import angular from 'angular';

import template from './template.html';

class Controller {

  constructor(TaskService, ScrapingService, $state, $uibModal, toastr, Upload) {
    'ngInject';
    this.taskService = TaskService;
    this.scrapingService = ScrapingService;
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
      that.scrapingService.deleteScraping(task).then(() => {
        that.$state.reload();
      });

    }, function (reason) {
      console.info("I was dimissed, so do what I need to do myContent's controller now.  Reason was->" + reason);
    });
  }


  comparer(task) {
    var that = this;
    that.scrapingService.getLastScrapingById(task.id).then((data) => {
      var res = [];
      res.push(task);
      if (data[0].id !== undefined) {
        res.push(data[0]);
      }
      this.$uibModal.open({
        component: "compareModal",
        modalData: task,
        resolve: {
          modalData: function () {
            return res;
          }
        }
      }).result.then(function (result) {
        console.info("I was closed, so do what I need to do myContent's controller now.  Result was->");

      }, function (reason) {
        console.info("I was dimissed, so do what I need to do myContent's controller now.  Reason was->" + reason);
      });
    });
  }

  getList() {
    this.scrapingService.getScraping().then(
      (data) => {
        this.isSubmitting = false;
        this.scrapingList = data;
      });
  }
  uploadScrapingJob() {
    this.scrapingService.uploadScrapingJob().then(
      (data) => {
        this.toastr.success('Scraping job uploaded successfully..', 'Scraping');
      });
  }
  uploadListing() {
    this.scrapingService.uploadListing().then(
      (data) => {
        this.toastr.success('Add listing uploaded successfully..', 'Scraping');
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

      this.scrapingService.processBulkScraping({
        FileName: file.name
      }).then(() => {
        this.$state.reload();
        this.toastr.success('Bulk scraping process successfully.', 'Scraping');
      });
      
    });

  }

}

let ComponentConfig = {
  bindings: {
    scrapingList: '='
  },
  template: template,
  controller: Controller
};

const COMPONENT = 'scrapingList';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;

angular.module('app').component('compareModal', {
  bindings: {
    modalData: '<',
    modalInstance: "<",
    resolve: "<"
  },
  template: `
  <div class="modal-header">
  <h3 class="modal-title" id="modal-title">Compare</h3>
</div>
<div class="modal-body" id="modal-body">
<div class="row">
  <div style="width:47%;float:left;">
  Current Record
  <pre> {
    "template": <span ng-class="{'test':$ctrl.resolve.modalData[0].template != $ctrl.resolve.modalData[1].template}">{{$ctrl.resolve.modalData[0].template}}</span>,
    "postcode": <span ng-class="{'test':$ctrl.resolve.modalData[0].postcode != $ctrl.resolve.modalData[1].postcode}">{{$ctrl.resolve.modalData[0].postcode}}</span>,
    "companyname": <span ng-class="{'test':$ctrl.resolve.modalData[0].companyname != $ctrl.resolve.modalData[1].companyname}">{{$ctrl.resolve.modalData[0].companyname}}</span>,
    "address": <span ng-class="{'test':$ctrl.resolve.modalData[0].address != $ctrl.resolve.modalData[1].address}">{{$ctrl.resolve.modalData[0].address}}</span>,
    "country": <span ng-class="{'test':$ctrl.resolve.modalData[0].country != $ctrl.resolve.modalData[1].country}">{{$ctrl.resolve.modalData[0].country}}</span>,
    "state": <span ng-class="{'test':$ctrl.resolve.modalData[0].state != $ctrl.resolve.modalData[1].state}">{{$ctrl.resolve.modalData[0].state}}</span>,
    "city": <span ng-class="{'test':$ctrl.resolve.modalData[0].city != $ctrl.resolve.modalData[1].city}">{{$ctrl.resolve.modalData[0].city}}</span>,
    "site_url":[<div ng-repeat="url in $ctrl.resolve.modalData[0].site_url track by $index">          <span ng-class="{'test': url != $ctrl.resolve.modalData[1].site_url[$index]}">{{url}}</span>,</div>     ]
    "storeURL": <span ng-class="{'test':$ctrl.resolve.modalData[0].storeURL != $ctrl.resolve.modalData[1].storeURL}">{{$ctrl.resolve.modalData[0].storeURL}}</span>,
    "longtude": <span ng-class="{'test':$ctrl.resolve.modalData[0].longtude != $ctrl.resolve.modalData[1].longtude}">{{$ctrl.resolve.modalData[0].longtude}}</span>,
    "latitude": <span ng-class="{'test':$ctrl.resolve.modalData[0].latitude != $ctrl.resolve.modalData[1].latitude}">{{$ctrl.resolve.modalData[0].latitude}}</span>,
    "phone": <span ng-class="{'test':$ctrl.resolve.modalData[0].phone != $ctrl.resolve.modalData[1].phone}">{{$ctrl.resolve.modalData[0].phone}}</span>,
    "address2": <span ng-class="{'test':$ctrl.resolve.modalData[0].address2 != $ctrl.resolve.modalData[1].address2}">{{$ctrl.resolve.modalData[0].address2}}</span>,
    "site_name": <span ng-class="{'test':$ctrl.resolve.modalData[0].site_name != $ctrl.resolve.modalData[1].site_name}">{{$ctrl.resolve.modalData[0].site_name}}</span>,
    "Status": <span ng-class="{'test':$ctrl.resolve.modalData[0].changeStatus != $ctrl.resolve.modalData[1].changeStatus}">{{$ctrl.resolve.modalData[0].changeStatus}}</span>,
}
  </pre>
  </div>
  <div style="width:47%;float:left;padding-left:5px;min-height:100%;">
  Previous Record
  <pre ng-show="!$ctrl.resolve.modalData[1].id">
There is no previous record exist!
  </pre>
  
  <pre ng-show="$ctrl.resolve.modalData[1].id"> {
    "template": <span ng-class="{'test':$ctrl.resolve.modalData[0].template != $ctrl.resolve.modalData[1].template}">{{$ctrl.resolve.modalData[1].template}}</span>,
    "postcode": <span ng-class="{'test':$ctrl.resolve.modalData[0].postcode != $ctrl.resolve.modalData[1].postcode}">{{$ctrl.resolve.modalData[1].postcode}}</span>,
    "companyname": <span ng-class="{'test':$ctrl.resolve.modalData[0].companyname != $ctrl.resolve.modalData[1].companyname}">{{$ctrl.resolve.modalData[1].companyname}}</span>,
    "address": <span ng-class="{'test':$ctrl.resolve.modalData[0].address != $ctrl.resolve.modalData[1].address}">{{$ctrl.resolve.modalData[1].address}}</span>,
    "country": <span ng-class="{'test':$ctrl.resolve.modalData[0].country != $ctrl.resolve.modalData[1].country}">{{$ctrl.resolve.modalData[1].country}}</span>,
    "state": <span ng-class="{'test':$ctrl.resolve.modalData[0].state != $ctrl.resolve.modalData[1].state}">{{$ctrl.resolve.modalData[1].state}}</span>,
    "city": <span ng-class="{'test':$ctrl.resolve.modalData[0].city != $ctrl.resolve.modalData[1].city}">{{$ctrl.resolve.modalData[1].city}}</span>,
    "site_url":[<div ng-repeat="url in $ctrl.resolve.modalData[1].site_url track by $index">          <span ng-class="{'test': url != $ctrl.resolve.modalData[0].site_url[$index]}">{{url}}</span>,</div>     ]
    "storeURL": <span ng-class="{'test':$ctrl.resolve.modalData[0].storeURL != $ctrl.resolve.modalData[1].storeURL}">{{$ctrl.resolve.modalData[1].storeURL}}</span>,
    "longtude": <span ng-class="{'test':$ctrl.resolve.modalData[0].longtude != $ctrl.resolve.modalData[1].longtude}">{{$ctrl.resolve.modalData[1].longtude}}</span>,
    "latitude": <span ng-class="{'test':$ctrl.resolve.modalData[0].latitude != $ctrl.resolve.modalData[1].latitude}">{{$ctrl.resolve.modalData[1].latitude}}</span>,
    "phone": <span ng-class="{'test':$ctrl.resolve.modalData[0].phone != $ctrl.resolve.modalData[1].phone}">{{$ctrl.resolve.modalData[1].phone}}</span>,
    "address2": <span ng-class="{'test':$ctrl.resolve.modalData[0].address2 != $ctrl.resolve.modalData[1].address2}">{{$ctrl.resolve.modalData[1].address2}}</span>,
    "site_name": <span ng-class="{'test':$ctrl.resolve.modalData[0].site_name != $ctrl.resolve.modalData[1].site_name}">{{$ctrl.resolve.modalData[1].site_name}}</span>,
    "Status": <span ng-class="{'test':$ctrl.resolve.modalData[0].changeStatus != $ctrl.resolve.modalData[1].changeStatus}">{{$ctrl.resolve.modalData[1].changeStatus}}</span>,
} </pre>
  </div>
</div>
</div>
<div class="modal-footer">
  <button class="btn btn-warning" type="button" ng-click="$ctrl.cancel()">Cancel</button>
</div>`,
  controller: [function () {
    var $ctrl = this;

    $ctrl.$init = function () {
      $ctrl.modalData = $ctrl.resolve.modalData;
    };


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

// angular.module('app')
//   .component('compareModal', {
//     template: `<div class="modal-header">
//     <h3 class="modal-title" id="modal-title">Compare</h3>
//   </div>
//   <div class="modal-body" id="modal-body">
//     <pre>{{$ctrl.modalData}}</pre>
//   </div>
//   <div class="modal-footer">
//     <button class="btn btn-warning" type="button" ng-click="$ctrl.cancel()">Cancel</button>
//   </div>`,
//     bindings: {
//       $close: '&',
//       modalData: '<'
//     },
//     controller: [function () {
//       var $ctrl = this;
//       $ctrl.cancel = function () {
//         console.info("in handle dismiss");
//         $ctrl.modalInstance.dismiss("cancel");
//       };
//     }],
//   });