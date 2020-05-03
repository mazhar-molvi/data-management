import angular from 'angular';
import template from './template.html';


class Controller {

  constructor(TaskService, ScrapingService, $state, $uibModal, $stateParams, toastr) {
    'ngInject';
    this.taskService = TaskService;
    this.scrapingService = ScrapingService;
    this.$state = $state;
    this.addMode = false;
    this.$uibModal = $uibModal;
    this.$stateParams = $stateParams;
    this.listing = {};
    this.toastr = toastr;
  }
  submit(listing) {
    listing.companyname = listing.companyname.companyname;
    listing.listing_level = listing.listing_level.value;
    listing.listing_status = listing.listing_status.value;
    listing.listing_template = listing.listing_template.value;
    this.scrapingService.addListing(listing).then(() => {
      this.toastr.success('Add listing save successfully.', 'Add Listing');
      this.$state.reload();
    }, function (error) {
      this.toastr.success(error, 'Add Listing');
    })
  };

  onSelectCallback(item, modal){
    this.listing.company = item.companyname;
  }
  getCompanyList() {
    this.taskService.getList().then(
      (data) => {
        this.companyList = data;
      });
  }

  // changec(){
  //   this.listing.company += 1;
  // }
  getListingById(id) {
    this.taskService.getList().then(
      (data) => {
        this.companyList = data;
        this.scrapingService.getListingById(id).then(
          (data) => {
            if (data !== undefined && data !== null && data.length > 0) {
              this.listing = data[0];
              this.companyList.forEach(function (element) {
                if (element.companyname == this.listing.companyname) {
                  this.listing.companyname = element;
                }
              }, this);
              this.levels.forEach(function (element) {
                if (element.id == this.listing.listing_level) {
                  this.listing.listing_level = element;
                }
              }, this);
              this.listingStatus.forEach(function (element) {
                if (element.id == this.listing.listing_status) {
                  this.listing.listing_status = element;
                }
              }, this);

              this.listingTemplate.forEach(function (element) {
                if (element.id == this.listing.listing_template) {
                  this.listing.listing_template = element;
                }
              }, this);
            }
          });
      });
  }

  $onInit() {
    this.levels = [
      { id: "Level 1", value: "Level 1" },
      { id: "Level 2", value: "Level 2" },
      { id: "Level 3", value: "Level 3" },
      { id: "Level 4", value: "Level 4" },
      { id: "Level 5", value: "Level 5" }
    ];
    this.listingStatus = [
      { id: "Disable", value: "Disable" },
      { id: "Enable", value: "Enable" }
    ];
    this.listingTemplate = [
      { id: "Template 1", value: "Template 1" },
      { id: "Template 2", value: "Template 2" },
      { id: "Template 3", value: "Template 3" },
      { id: "Template 4", value: "Template 4" }
    ];

    this.id = this.$stateParams.id;
    if (this.id !== undefined) {
      this.getListingById(this.id);
    }
    else {
      this.getCompanyList();
    }

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

const COMPONENT = 'addListing';
angular.module('app').component(COMPONENT, ComponentConfig);
export default COMPONENT;

angular.module('app').filter('propsFilter', function () {
  return function (items, props) {
    var out = [];

    if (angular.isArray(items)) {
      var keys = Object.keys(props);

      items.forEach(function (item) {
        var itemMatches = false;

        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

