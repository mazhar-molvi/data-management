import angular from 'angular';

class Service {
  
  constructor($http) {
    'ngInject';
    this.$http = $http;
    this.baseuri = 'https://u6tl6uhqwd.execute-api.us-east-1.amazonaws.com/dev';
    //this.baseuri = 'https://zs2popxq66.execute-api.us-east-1.amazonaws.com/dev';
  }
  
  test(scraping) {
    return this.$http.post(this.baseuri +'/testScraping', scraping).then(function (res) {
      return res.data;
    });
  }
  
  submit(scraping) {
    return this.$http.post(this.baseuri +'/saveScraping', scraping).then(function (res) {
      return res.data;
    });
  }
  addListing(scraping) {
    return this.$http.post(this.baseuri +'/addListing', scraping).then(function (res) {
      return res.data;
    });
  }

  getListing() {
    return this.$http.get(this.baseuri + '/getlisting').then(function (res) {
      return res.data.body;
    });
  }
  
  getScraping() {
    return this.$http.get(this.baseuri + '/getScraping').then(function (res) {
      return res.data.body;
    });
  }

  getScrapingById(id) {
    return this.$http.get(this.baseuri +'/getScrapingById/' + id).then(function (res) {
      return res.data.body;
    });
  }

  getLastScrapingById(id) {
    return this.$http.get(this.baseuri +'/getLastScrapingById/' + id).then(function (res) {
      return res.data.body;
    });
  }
  
  getListingById(id) {
    return this.$http.get(this.baseuri +'/getListingById/' + id).then(function (res) {
      return res.data.body;
    });
  }

  deleteScraping(scrap) {
    return this.$http.delete(this.baseuri +'/deleteScraping/' + scrap.id, scrap).then(function (res) {
      return res.data;
    });
  }

  deleteListing(listing) {
    return this.$http.delete(this.baseuri +'/deleteListing/' + listing.listing_id, listing).then(function (res) {
      return res.data;
    });
  }

  uploadListing() {
    return this.$http.post(this.baseuri +'/uploadListing', {}).then(function (res) {
      return res.data;
    });
  }

  uploadScrapingJob() {
    return this.$http.post(this.baseuri +'/uploadScrapingJob', {}).then(function (res) {
      return res.data;
    });
  }

  processBulkListing(obj) {
    return this.$http.post(this.baseuri +'/processBulkListing', obj).then(function (res) {
      return res.data;
    });
  }

  processBulkScraping(obj) {
    return this.$http.post(this.baseuri +'/processBulkScraping', obj).then(function (res) {
      return res.data;
    });
  }

}

const SERVICE = 'ScrapingService';
angular.module('app').service(SERVICE, Service);
export default SERVICE;


