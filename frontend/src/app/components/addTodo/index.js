import angular from 'angular';

import template from './template.html';

class Controller {

  constructor(TaskService, $state, toastr) {
    'ngInject';
    this.taskService = TaskService;
    this.$state = $state;
    this.toastr = toastr;
  }

  create(task, inValid) {
    if (!inValid) {
      if (task.id !== '' && task.id !== undefined) {
        this.taskService.update(task).then(() => {
          this.toastr.success('Task updated successfully.', 'Task manager');
          this.$state.reload();
        },function(error){
          this.toastr.error(error, 'Task manager');
        })
      }
      else {
        this.taskService.create(task).then(() => {
          this.toastr.success('Task added successfully.', 'Task manager');
          this.$state.reload();
        },function(error){
          this.toastr.error(error, 'Task manager');
        })
      }
    }
  };
  back() {
    this.$state.reload();
  };
  $onInit() {
    console.log(this.task);
  }
}

let ComponentConfig = {
  bindings: {
    taskmode: '<',
    task: '<'
  },
  template: template,
  controller: Controller
};

const COMPONENT = 'addTodo';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;