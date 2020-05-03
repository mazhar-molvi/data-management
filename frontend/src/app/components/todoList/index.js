import angular from 'angular';

import template from './template.html';
import '../addTodo';
import '../todoTable';


class Controller {

  constructor(TaskService, $state, $uibModal, toastr, Upload) {
    'ngInject';
    this.taskService = TaskService;
    this.$state = $state;
    this.addMode = false;
    this.$uibModal = $uibModal;
    this.toastr = toastr;
    this.Upload = Upload;
  }

  open(task) {
    console.log(this.pages);
    var that = this;
    this.$uibModal.open({
      component: "myModal",
      resolve: {
        modalData: function () {
          return [];
        }
      }
    }).result.then(function (result) {
      console.info("I was closed, so do what I need to do myContent's controller now.  Result was->");
      that.taskService.delete(task).then(() => {
        that.$state.reload();
      });

    }, function (reason) {
      console.info("I was dimissed, so do what I need to do myContent's controller now.  Reason was->" + reason);
    });
  }

  getList() {
    this.taskService.getList().then(
      (data) => {
        this.isSubmitting = false;
        this.todos = data;
      });
  }
  $onInit() {
    this.getList();
  }
  add() {
    this.addMode = true;
    this.task = {};
  }
  edit(task) {
    this.addMode = true;
    this.task = task;
  }
  delete(task) {
    console.log(task);
    this.taskService.delete(task).then(() => {
      this.$state.reload();
    })
  };

  uploadBulkTask(files) {
    var file = files[0];
    this.Upload.upload({
      url: 'https://bulktask-files.s3.amazonaws.com/', //S3 upload url including bucket name
      method: 'POST',
      data: {
        key: file.name, // the key to store the file on S3, could be file name or customized
        AWSAccessKeyId: 'AKIAIZYV5K5JCBYR2Y3A',
        acl: 'private', // sets the access to the uploaded file in the bucket: private, public-read, ...
        policy: 'ewogICJleHBpcmF0aW9uIjogIjIwMjAtMDEtMDFUMDA6MDA6MDBaIiwKICAiY29uZGl0aW9ucyI6IFsKICAgIHsiYnVja2V0IjogImJ1bGt0YXNrLWZpbGVzIn0sCiAgICBbInN0YXJ0cy13aXRoIiwgIiRrZXkiLCAiIl0sCiAgICB7ImFjbCI6ICJwcml2YXRlIn0sCiAgICBbInN0YXJ0cy13aXRoIiwgIiRDb250ZW50LVR5cGUiLCAiIl0sCiAgICBbInN0YXJ0cy13aXRoIiwgIiRmaWxlbmFtZSIsICIiXSwKICAgIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCA1MjQyODgwMDBdCiAgXQp9', // base64-encoded json policy (see article below)
        signature: 'Wyjb/M3++N6D+nf26G3T+Sv2mM0=', // base64-encoded signature based on policy string (see article below)
        "Content-Type": file.type != '' ? file.type : 'application/octet-stream', // content type of the file (NotEmpty)
        filename: file.name, // this is needed for Flash polyfill IE8-9
        file: file
      }
    }).then(() => {
      console.log('success');

      this.taskService.processBulkTask({
        FileName: file.name
      }).then(() => {
        this.$state.reload();
        this.toastr.success('Bulk tasks process successfully.', 'Task Management');
      });
      
    });

  }
}

let ComponentConfig = {
  bindings: {
    todos: '='
  },
  template: template,
  controller: Controller
};

const COMPONENT = 'todoList';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;

angular.module('app').component('myModal', {
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  template: `
  <div class="modal-header">
  <h3 class="modal-title" id="modal-title">Delete</h3>
</div>
<div class="modal-body" id="modal-body">
  Are you sure want to delete ?
</div>
<div class="modal-footer">
  <button class="btn btn-primary" type="button" ng-click="$ctrl.ok()">OK</button>
  <button class="btn btn-warning" type="button" ng-click="$ctrl.cancel()">Cancel</button>
</div>`,
  controller: [function () {
    var $ctrl = this;

    $ctrl.$init = function () {
      $ctrl.modalData = $ctrl.resolve.modalData;
    }

    $ctrl.ok = function () {
      console.info("in handle close");
      $ctrl.modalInstance.close($ctrl.modalData);
    };

    $ctrl.cancel = function () {
      console.info("in handle dismiss");
      $ctrl.modalInstance.dismiss("cancel");
    };
  }]
})