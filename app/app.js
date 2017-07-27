(function() {
    'use strict';

    angular
        .module('app', ['ui.router', 'ngSanitize', 'textAngular', 'angular-loading-bar', 'ngFileUpload', 'ui.bootstrap'])
        .config(config)
        .run(run)
        .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
            cfpLoadingBarProvider.includeSpinner = false;
        }]);

    function config($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'home/index.html',
                controller: 'Home.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'home' }
            })
            .state('question', {
                url: '/question/:id',
                templateUrl: 'home/question.html',
                controller: 'Home.QuestionController',
                controllerAs: 'vm',
                data: { activeTab: 'home' }
            })
            .state('postQuestion', {
                url: '/postQuestion',
                templateUrl: 'home/addQuestion.html',
                controller: 'Home.AddQuestionController',
                controllerAs: 'vm',
                data: { activeTab: 'home' }
            })
            .state('editQuestion', {
                url: '/editQuestion/:id',
                templateUrl: 'home/addQuestion.html',
                controller: 'Home.AddQuestionController',
                controllerAs: 'vm',
                data: { activeTab: 'home' }
            })
            .state('account', {
                url: '/account',
                templateUrl: 'account/index.html',
                controller: 'Account.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'account' }
            });
    }

    function run($http, $rootScope, $window, $anchorScroll) {
        // add JWT token as default auth header
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.jwtToken;

        // update active tab on state change
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.activeTab = toState.data.activeTab;
        });
        $rootScope.$on("$locationChangeSuccess", function() {
            $anchorScroll();
        });
    }

    // manually bootstrap angular after the JWT token is retrieved from the server
    $(function() {
        // get JWT token from server
        $.get('/app/token', function(token) {
            window.jwtToken = token;

            angular.bootstrap(document, ['app']);
        });
    });
})();