(function() {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', Controller)
        .controller('Home.QuestionController', QuestionCtrl)
        .controller('Home.AddQuestionController', AddQuestionCtrl);

    function Controller(UserService, QuestionService, $uibModal) {
        var vm = this;

        vm.user = null;
        vm.questions = [];
        vm.deleteQuestion = deleteQuestion;

        function getQuestions() {
            QuestionService.GetAll().then(function(questions) {
                vm.questions = questions;
            })
        }

        function deleteQuestion(id) {
            $uibModal.open({
                templateUrl: 'deleteConfirm.html',
                controller: function($scope, $uibModalInstance){
                    $scope.ok = function(){
                        $uibModalInstance.close();
                    }
                    $scope.cancel = function(){
                        $uibModalInstance.dismiss();
                    }
                },
                size: 'sm',
                resolve: {
                    
                }
            }).result.then(function(){
                QuestionService.DeleteQuestion(id).then(function(){
                    getQuestions();
                })
            }, function(){
                console.log("here1");
            })
        }

        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function(user) {
                vm.user = user;
            });
            getQuestions();
        }
    }

    function QuestionCtrl(UserService, QuestionService, $stateParams, $state) {
        var vm = this;

        vm.postAnswer = postAnswer;

        function postAnswer() {
            if (vm.answer) {
                QuestionService.postAnswer($stateParams.id, { 'text': vm.answer }).then(function(answer) {

                    if (vm.file) {
                        fileUpload(answer.id, vm.file)
                    } else {
                        vm.answer = "";
                        init();
                    }
                }, function(error) {
                    $state.go('home');
                });
            }
        }

        function fileUpload(id, file) {
            QuestionService.answerFileUpload($stateParams.id, id, vm.file).then(function(question) {
                vm.answer = "";
                vm.file = {};
                init();
            }, function(error) {
                $state.go('home');
            });
        }

        function init() {
            if ($stateParams.id) {
                QuestionService.GetById($stateParams.id).then(function(question) {
                    vm.question = question;
                }, function(error) {
                    $state.go('home');
                });
            } else {
                $state.go('home')
            }
        }
        init();
    }

    function AddQuestionCtrl(UserService, QuestionService, $state, $stateParams) {
        var vm = this;
        vm.obj = {};
        vm.postQuestion = postQuestion;

        function postQuestion() {
            if (vm.obj.question) {
                if (vm.isEdit) {
                    QuestionService.UpdateQuestion($stateParams.id, vm.obj).then(function(question) {
                        if (vm.file) {
                            fileUpload($stateParams.id, vm.file)
                        } else {
                            vm.obj = {};
                            $state.go('home');
                        }
                    }, function(error) {
                        $state.go('home');
                    });
                } else {
                    QuestionService.createQuestion(vm.obj).then(function(question) {
                        if (vm.file) {
                            fileUpload(question._id, vm.file)
                        } else {
                            vm.obj = {};
                            $state.go('home');
                        }
                    }, function(error) {
                        $state.go('home');
                    });
                }
            }
        }

        function fileUpload(id, file) {
            QuestionService.questionFileUpload(id, vm.file).then(function(question) {
                vm.obj = {};
                vm.file = "";
                $state.go('home');
            }, function(error) {
                $state.go('home');
            });
        }

        function init() {
            if ($stateParams.id) {
                vm.isEdit = true;
                vm.headerText = "Edit";
                QuestionService.GetById($stateParams.id).then(function(question) {
                    vm.obj = {
                        'question': question.question,
                        'largeText': question.largeText
                    };
                }, function(error) {
                    $state.go('home');
                });
            } else {
                vm.isEdit = false;
                vm.headerText = "New";
            }
        }
        init();
    }

})();