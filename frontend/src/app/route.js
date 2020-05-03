import angular from 'angular';

import todoList from './components/todoList';
import login from './components/login';
import scraping from './components/scraping';
import scrapingList from './components/scrapingList';
import addListing from './components/addListing';
import addListingData from './components/listing';

let routeConfig = ($stateProvider, $urlRouterProvider) => {
    'ngInject';
    $urlRouterProvider.otherwise('/todos');
    
    $stateProvider
      .state('todos', {
        url: '/todos',
        params: {
          siteTitle: 'Todo list'
        },
        component: todoList
      })
      .state('scrapingList', {
        url: '/scrapingList',
        params: {
          siteTitle: 'scrapingList'
        },
        component: scrapingList
      })
      .state('scraping.edit', {
        url: '/:id',
        params: {
          siteTitle: 'Scraping'
        },
        component: scraping
      })
      .state('scraping', {
        url: '/scraping',
        params: {
          siteTitle: 'Scraping'
        },
        component: scraping
      })
      .state('listing', {
        url: '/listing',
        params: {
          siteTitle: 'listing'
        },
        component: addListingData
      })
      .state('addListing.edit', {
        url: '/:id',
        params: {
          siteTitle: 'Listing'
        },
        component: addListing
      })
      .state('addListing', {
        url: '/addListing',
        params: {
          siteTitle: 'Add Listing'
        },
        component: addListing
      })
      .state('login', {
        url: '/login',
        params: {
          siteTitle: 'Login'
        },
        component: login
      })
    ;
  }
;

angular.module('app').config(routeConfig);
