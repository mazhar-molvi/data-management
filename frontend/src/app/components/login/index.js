import angular from 'angular';

import template from './login.html';

class Controller {
  
  constructor(TodoService, $state) {
    'ngInject';
    this.todoService = TodoService;
    this.$state = $state;
  }
  
  login() {
      $state.go('todos');
      console.log('test');
  }
}

let ComponentConfig = {
  bindings: {},
  template: template,
  controller: Controller
};

const COMPONENT = 'login';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;