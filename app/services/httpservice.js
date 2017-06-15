import Ember from 'ember';
import moment from 'moment';
const { $: { ajax, param, each }, RSVP: { Promise } } = Ember;

const httpMethods = {
  get: 'httpGet',
  post: 'httpPost',
  put: 'httpPut',
  delete: 'httpDelete'
};


const makeExpiration = ms =>  moment().add(ms/1000, 'seconds').unix();

const checkIsExpired = timestams => moment.unix(timestams).isBefore(moment());

/**
 * Method which convert resource object to Ember service mixin
 * 
 * ========
 *  Input
 * ========
 * @example 
 *     const resources = {
 *       getAllIssues: {
 *         url: '/repos/vmg/redcarpet/issues',
 *         type: 'get',
 *         useCache: true,
 *         cacheTimeout: 6000,
 *       },
 *       newIssue: {
 *         url: '/',
 *         type: 'post',
 *         resetCaches: ['getAllIssues']
 *       }
 *     };
 * 
 * 
 * ========
 *  Output
 * ========
 * @example
 *    const emberMixin = {
 *      getAllIssues(url, data, cacheData) {
 *        return this.http.get({
 *          url: `${this.get('host')}${url}`,
 *          data: data.query,
 *          headers: data.headers
 *        }).then(response => {
 *          this.setCache(cacheData, response);
 *          return response;
 *        })
 *      },
 *      newIssue(url, data, headers) {
 *        // remove caches -  ['getAllIssues']
 *        return this.http.post({
 *          url: `${this.get('host')}${url}`,
 *          data: data.data,
 *          headers: data.headers
 *        });
 *      }
 *    };
 * 
 * 
 * =================
 *  Resourse form
 * =================
 *  url {String} - Path to endpoint without host part, could contain dynamic param "/users/:id" 
 *  type {String} - Name of HTTP Protocol method [GET,POST,PUT,DELETE]
 *  params {Object} - List of names and aliases of url dynamic segments "/folders/:folderId/files/:fileId"
 *  {
 *    fid: 'folderId',
 *    flid: 'fileId',
 *    // this.get('serviceName').loadFile({fid: 3, flid: 5}),then(...) - fires "/folders/3/files/5"
 *  }
 *  headers {Object} - Some specific headers for HTTP current request
 *  useCache {Boolean} - Mark that needs to save http response to cache - Default (true)
 *  cacheTimeout {Number} - Time in millisecond to flush cache for current method - Default (600000) - 10 minutes
 *  resetCache {Array} - List of methods which needs to flush cache - Default (Empty)
 * 
 * 
 * @param {Object} resources - list of method names and parameters which needs to create for use in mixins
 * @returns {Object} Return the Ember mixin with http methods
 * 
 */
export const resourseBuilder = resources => {
  const EmberMixin = {};
  each(resources, (methodName, config) => {

    // extract dara from Resource config
    const {
      url, type, useCache: cUseCache, params,
      headers: cHeaders, cacheTimeout, resetCaches
    } = config;

    // define new EmberMixin method and build specific HTTP calls according to configuration
    /**
     * @param {Object} data - Means POST, PUT body or GET, DELETE query including url params
     * @param {Object} options - service data (useCache, cacheTimeout, headers)
     * @returns {Promise} Promise of http call
     */
    EmberMixin[methodName] = function (data = {}, options = {}) {

      const { headers, useCache } = options;

      // jQuery AJAX http method
      const method = httpMethods[type];

      // useCache {bool} - from options or from config
      const uc = useCache !== undefined ? useCache : cUseCache || false;

      // headers {Object} - from options or from config
      const h = headers || cHeaders;

      //will contain compiled url for example /users/1
      let formatedUrl = url;

      // Get aliases for dynamic segments from Resource.params and data to replace container in url 
      if (params && Object.keys(params).length > 0) {
        each(params, (key, val) => {
          formatedUrl = formatedUrl.replace(`:${key}`, data[val]);
        });
      }
      // call method which defined in Ember "httpservice.js" service
      return this[method](formatedUrl, { data, headers: h, useCache: uc, cacheTimeout, resetCaches, serviceName: methodName });
    }
  });
  return EmberMixin;
};

/**
 * Helper function to build ajax request with union interface 
 * @param {String} type - name of HTTP Protocol method 
 * @returns {Function} - pass url, body and headers to HTTP reuqst
 *    @param {String} url - full path to endpoint - "http://localhost:3000/users"
 *    @param {Object} data - body or query for jQuery ajax request
 *    @param {Object} headers - headers for jQuery ajax request
 *    @returns {Promise} jQuery ajax call promise
 */
const makeAjax = type => ({ url, data = {}, headers = {} }) => new Promise((success, error) =>
  ajax(Object.assign({
    headers,
    url,
    type,
    success,
    error,
    contentType: "application/json",
    dataType: 'json'
  }, (data ? {data: JSON.stringify(data)} : {}))));


/**
 * 
 * @param {String} httpMethod - name of http method - same for POST, PUT, DEKETE 
 */
const makeEmberMixinHttpMethod = httpMethod => function (endpoint, options = {}) {
    let { data, headers, resetCaches } = options;
    const url = `${this.get('host')}${endpoint}`;
    if (resetCaches) {
      this.resetCaches(resetCaches);
    }
    if(httpMethod === 'del' || Object.keys(data || {}).length === 0) {
      data = null;
    }

    return this.http[httpMethod]({ url, data, headers });
};

export default Ember.Service.extend({
  init() {
    // Create cache object if it is not created
    if (!this.get('cache')) {
      this.set('cache', Ember.Object.create());
    }
  },
  host: '', // will be replaced in child service instances
  
  // HTTP methods based on jQuery ajax
  http: {
    get: makeAjax('GET'),
    post: makeAjax('POST'),
    put: makeAjax('PUT'),
    del: makeAjax('DELETE')
  },


  /**
   * Get data from cache by uniq key 
   * @param {Object} data which needs get data from cache
   */
  fromCache(dataForKey) {
    const { serviceName, query, headers, url } = dataForKey;
    // uniq key for cache storage based on query string "a=1&b=2&c=3"
    const key = param({ serviceName, url, query, headers });

    // get cache storage 
    const cache = this.get('cache');

    // get data by key
    const val = key in cache && cache[key];

    if (val && !checkIsExpired(val.exp)) {
        return val.data;
    }

    // if returns null that means we need to get data from server (mek HTTP request)
    return null;
  },


  /**
   * Save data to cache by uniq key
   * @param {Object} dataForKey - data which needs to create uniq key for cache storage
   * @param {Any} data to keep in cache storage
   */
  setCache(dataForKey, data) {
    const { serviceName, query, headers, url, cacheTimeout } = dataForKey;
    const key = param({ serviceName, url, query, headers });
    const cache = this.get('cache');
    const exp = makeExpiration(cacheTimeout || 600000);
    cache[key] = { exp, data };
    this.set('cache', cache);
  },


  /**
   * Flush cache using array of cache names
   * @param {Array} caches - list of resource names to force flush
   */
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

    // re set cache only if it changed
    if (hasChanges) {
      this.set('cache', cache);
    }
  },

  /**
   * Call GET HTTP Request and save response to cache if it needs
   * @param {String} url - urls without host "/users"
   * @param {Object} options
   */
  [httpMethods.get](endpoint, options = {}) {
         // debugger;
    const url = `${this.get('host')}${endpoint}`;
    let { data, headers, useCache, cacheTimeout, serviceName } = options;
    const cacheData = { url: endpoint, data, headers, serviceName, cacheTimeout };
    if (useCache) {
      const fromCache = this.fromCache(cacheData);
      if (fromCache) {
        return Promise.resolve(fromCache);
      }
    }
    if (Object.keys(data || {}).length === 0) {
      data = null;
    }
    return this.http.get({ url, data, headers }).then(response => {
      this.setCache(cacheData, response);
      return response;
    })
  },

  /**
   * Call POST HTTP Reqest and reset some cache if it needs
   * @param {String} endpoint - urls without host "/users"
   * @param {Object} options
   */
  [httpMethods.post]: makeEmberMixinHttpMethod('post'),

  /**
   * Call PUT HTTP Reqest and reset some cache if it needs
   * @param {String} endpoint - urls without host "/users"
   * @param {Object} options
   */
  [httpMethods.put]: makeEmberMixinHttpMethod('put'),

  /**
   * Call DELETE HTTP Reqest and reset some cache if it needs
   * @param {String} endpoint - urls without host "/users"
   * @param {Object} options
   */
  [httpMethods.delete]: makeEmberMixinHttpMethod('del')

});