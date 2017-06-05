import Ember from 'ember';
import Httpservice, {resourseBuilder} from './httpservice';

const service = {
  host: 'https://api.github.com'
};


// will use these params for all settings;
const generalConfig = {
  useCache: true,
  cacheTimeout: 6000
};

const resourse = resourseBuilder({
  getAllIssues: {
    url: '/repos/vmg/redcarpet/issues',
    type: 'get',
    useCache: true,
    cacheTimeout: 6000,
    //resetCaches: ['getAllIssues'] //also could be used to reset cache
  },
  newIssue: {
    url: '/',
    type: 'post',
    resetCaches: ['getAllIssues']
  }
}, generalConfig);



export default Httpservice.extend(resourse, service);
