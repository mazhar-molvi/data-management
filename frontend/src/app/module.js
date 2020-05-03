import angular from 'angular';

import '../style/app.scss';

import modal from 'angular-ui-bootstrap/src/modal';
import tooltip from 'angular-ui-bootstrap/src/tooltip';
import router from 'angular-ui-router';
import messages from 'angular-messages';
import toastr from 'angular-toastr';
import uiselect from 'ui-select';
import ngSanitize from 'angular-sanitize';
import ngAnimate from 'angular-animate';
import ngFileUpload from 'ng-file-upload';
import Upload from 'ng-file-upload';

angular.module('app', [router, modal, tooltip, messages, uiselect, ngSanitize, toastr, ngFileUpload, Upload]);

export default 'app-module';