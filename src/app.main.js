import angular from 'angular';
import ngMaterial from 'angular-material';
import uiRouter from '@uirouter/angularjs';
import materialIcon from 'angular-material-icons';
import ngAnimate from 'angular-animate';

import 'angular/angular-csp.css';
import 'angular-material/angular-material.css';
import './index.scss';

import AppComponent from './app.component';
// import routes from './index.route';
import NotificationService from './services/NotificationService';

angular.module('main', [
  ngMaterial,
  uiRouter,
  materialIcon,
  ngAnimate,
])
  .service('NotificationService', NotificationService)
  .component('app', AppComponent)
  // .config(['$stateProvider', routes])
  .run();
