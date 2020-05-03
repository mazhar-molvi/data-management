import angular from 'angular';
import template from './template.html';


class Controller {

  constructor(TaskService, ScrapingService, $state, $uibModal, toastr, $stateParams) {
    'ngInject';
    this.taskService = TaskService;
    this.scrapingService = ScrapingService;
    this.$state = $state;
    this.addMode = false;
    this.$uibModal = $uibModal;
    this.$stateParams = $stateParams;
    this.scrap = {};
    this.scrap.site_url = [];
    this.toastr = toastr;
    this.progressVisible = false;
    this.isTestDone = false;
  }

  addurl(index) {
    this.scrap.site_url.push('');
  }
  removeurl(index) {
    this.scrap.site_url.splice(index, 1);
  }


  submit(scraping, invalid) {
    if (!invalid) {
      this.scrapingService.submit(scraping).then(() => {
        this.toastr.success('Web scraping save successfully.', 'Web scraping');
        this.$state.reload();
      }, function (error) {
        this.toastr.error(error, 'Web scraping');
      })
    }
    else{
      this.toastr.error('Form is invalid.', 'Web scraping');
    }
  };

  test(scraping, invalid) {
    if (!invalid) {
      this.progressVisible = true;
      this.scrapingService.test(scraping).then(() => {
        this.progressVisible = false;
        this.toastr.success('Web scraping test done successfully.', 'Web scraping');
        this.isTestDone = true;
      }, function (error) {
        this.toastr.error(error, 'Web scraping');
        this.progressVisible = false;
      })
    }
  };
  getCompanyList() {
    this.taskService.getList().then(
      (data) => {
        this.companyList = data;
        if (this.id !== undefined) {
          this.getScrapingById(this.id);
        }
      });
  }

  getScrapingById(id) {
    this.scrapingService.getScrapingById(id).then(
      (data) => {
        if (data !== undefined && data !== null && data.length > 0) {
          this.scrap = data[0];
          this.companyList.forEach(function (element) {
            if (element.companyname == this.scrap.companyname) {
              this.scrap.companyname = element;
            }
          }, this);
        }
      });
  }


  $onInit() {
    this.progressVisible = false;
    this.isTestDone = false;
    this.scrap = { site_url: [] };
    this.addurl();
    this.getCompanyList();
    this.id = this.$stateParams.id;
    
  }
}

let ComponentConfig = {
  bindings: {
    todos: '=',
    scrap: '='
  },
  template: template,
  controller: Controller
};

const COMPONENT = 'scraping';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;


// function EditableFieldController($scope, $element, $attrs) {
//   var ctrl = this;


//   ctrl.addurl = function (index) {
//     console.log(ctrl.scrap.site_url)
//     ctrl.scrap.site_url.push('');
//   }
//   ctrl.removeurl = function (index) {
//     ctrl.scrap.site_url.splice(index, 1);
//   }


//   // ctrl.submit = function (scraping) {
//   //   this.scrapService.submit(scraping).then(() => {
//   //     //this.toaster.success({title: "Task", body:"Task saved successfully."});
//   //     this.$state.reload();
//   //   }, function (error) {
//   //     //this.toaster.error("Task", error);
//   //   })
//   // };

//   // ctrl.test = function (scraping) {
//   //   this.scrapingService.test(scraping).then(() => {
//   //     //this.toaster.success({title: "Task", body:"Task saved successfully."});
//   //     this.$state.reload();
//   //   }, function (error) {
//   //     //this.toaster.error("Task", error);
//   //   })
//   // };
//   // ctrl.getCompanyList = function() {
//   //   this.taskService.getList().then(
//   //     (data) => {
//   //       this.companyList = data;
//   //     });
//   // }


//   ctrl.$onInit = function() {
//     // Make a copy of the initial value to be able to reset it later
//     ctrl.scrap = { site_url:[] };
//     ctrl.addurl();

//   };
// }

// angular.module('app').component('scraping', {
//   template: template,
//   controller: EditableFieldController,
//   bindings: {
//     todos: '=',
//     scrap: '='
//   }
// });

// const COMPONENT = 'scraping';
// export default COMPONENT;