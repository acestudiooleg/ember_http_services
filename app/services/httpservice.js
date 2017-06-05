import Ember from 'ember';
const { $: { ajax, param, each }, RSVP: { Promise }, run } = Ember;

const httpMethods = {
  get: 'httpGet',
  post: 'httpPost',
  put: 'httpPut',
  delete: 'httpDelete'
};

export const resourseBuilder = resourses => {
  const methods = {};
  each(resourses, (methodName, config) => {
    const {
      url, type, useCache: cUseCache, params: cParams,
      headers: cHeaders, cacheTimeout, resetCaches
    } = config;
    methods[methodName] = function ({ data, query, headers, useCache, params } = {}) {
      const method = httpMethods[type];
      const uc = useCache || cUseCache;
      const h = headers || cHeaders;
      let formatedUrl = url;
      if (cParams && Object.keys(cParams).length > 0) {
        Ember.$.each(cParams, (key, val) => {
          formatedUrl = formatedUrl.replace(`:${key}`, params[val]);
        });
      }

      return this[method](formatedUrl, { data, query, headers: h, useCache: uc }, { cacheTimeout, resetCaches, serviceName: methodName});
    }
  });
  return methods;
};

const makeAjax = type => ({url, data = {}, headers = {}}) => new Promise((success, error) =>
  ajax({headers, url, data, type, success, error, dataType: 'json'}));

export default Ember.Service.extend({
  init() {
    if (!this.get('cache')) {
      this.set('cache', Ember.Object.create());
    }
  },
  host: '',
  http: {
    get: makeAjax('get'),
    post: makeAjax('post')
  },
  fromCache(dataForKey) {
    const {serviceName, query, headers, url} = dataForKey;
    const key = param({serviceName, url, query, headers});
    const cache = this.get('cache');
    const val =  key in cache && cache[key];
    if (val) {
      // if val.exp < now return null
      return val.data;
    }
    return null;
  },
  setCache(dataForKey, data) {
    const {serviceName, query, headers, url, cacheTimeout} = dataForKey;
    const key = param({serviceName, url, query, headers});
    const cache = this.get('cache');
    const exp = cacheTimeout || 600000 //use tool
    cache[key] = {exp, data};
    this.set('cache', cache);
  },
  resetCaches(caches = []) {
    const cache = this.get('cache');
    const cacheKeys = Object.keys(cache);
    let hasChanges = false;
    caches.forEach(cacheName => {
      cacheKeys.forEach(cacheKey => {
        if (new RegExp(cacheName, 'g').test(cacheKey)) {
          delete cache[cacheKey];
          hasChanges = true;
        }
      })
    });
    if (hasChanges) {
      this.set('cache', cache);
    }
  },
  [httpMethods.get](url, data = {}, cacheInfo = {}) {
    const { query, headers, useCache } = data;
    const { cacheTimeout, serviceName } = cacheInfo;
    const cacheData = { url, query, headers, serviceName, cacheTimeout };
    if (useCache) {
      const fromCache = this.fromCache(cacheData);
      if (fromCache) {
        return Promise.resolve(fromCache);
      }
    }
    return this.http.get({
      url: `${this.get('host')}${url}`, 
      data: query, 
      headers
    }).then(response => {
      this.setCache(cacheData, response);
      return response;
    })
  },
  [httpMethods.post](url, data = {}, cacheInfo = {}) {
    const { data: postData, query, headers } = data;
    const { resetCaches } = cacheInfo;
    const cacheData = { url, query, headers };
    if (resetCaches) {
      this.resetCaches(resetCaches);
    }

    return this.http.post({
      url: `${this.get('host')}${url}`, 
      data: postData, 
      headers
    });
  }

});