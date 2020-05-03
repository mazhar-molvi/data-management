import angular from 'angular';

class Service {
  
  constructor($http) {
    'ngInject';
    this.$http = $http;
    this.baseuri = 'https://u6tl6uhqwd.execute-api.us-east-1.amazonaws.com/dev';
    //this.baseuri = 'https://zs2popxq66.execute-api.us-east-1.amazonaws.com/dev';
  }
  
  getList() {
    return this.$http.get(this.baseuri + '/todos').then(function (res) {
      console.log('res.data.body');
      console.log(res.data.body);
      return res.data.body;
    });
  }
  
  create(todo) {
    return this.$http.post(this.baseuri +'/todos', todo).then(function (res) {
      return res.data;
    });
  }
  
  update(todo) {
    return this.$http.put(this.baseuri +'/todos/' + todo.id, todo).then(function (res) {
      return res.data;
    });
  }
  
  delete(todo) {
    return this.$http.delete(this.baseuri +'/todos/' + todo.id, todo).then(function (res) {
      return res.data;
    });
  }

  processBulkTask(obj) {
    return this.$http.post(this.baseuri +'/processBulkTask', obj).then(function (res) {
      return res.data;
    });
  }

}

const SERVICE = 'TaskService';
angular.module('app').service(SERVICE, Service);
export default SERVICE;


