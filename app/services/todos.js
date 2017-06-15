import Httpservice, { resourseBuilder } from './httpservice';

const service = {
  host: 'http://localhost:4200'
};


// will use these params for all settings;
const generalConfig = {
  useCache: true,
  cacheTimeout: 6000
};

const resourse = resourseBuilder({
  getAllTodos: {
    url: '/todos/all',
    type: 'get',
    useCache: true,
    cacheTimeout: 6000,
  },
  getTodo: {
    url: '/todos/get/:id',
    type: 'get',
    useCache: true,
    cacheTimeout: 6000,
  },
  createTodo: {
    url: '/todos/create',
    type: 'post',
    resetCaches: ['getAllTodos']
  },
  updateTodo: {
    url: '/todos/update/:id',
    params:{ id: 'id'},
    type: 'put',
    resetCaches: ['getAllTodos']
  },
  deleteTodo: {
    url: '/todos/delete/:id',
    params:{ id: 'id'},
    type: 'delete',
    resetCaches: ['getAllIssues']
  }
}, generalConfig);



export default Httpservice.extend(resourse, service);
