(function() {
    'use strict';

    angular
        .module('app')
        .factory('QuestionService', Service);

    function Service($http, $q, Upload) {
        var service = {};

        service.GetMine = GetMine;
        service.GetAll = GetAll;
        service.GetById = GetById;
        service.createQuestion = createQuestion;
        service.UpdateQuestion = UpdateQuestion;
        service.DeleteQuestion = DeleteQuestion;
        service.postAnswer = postAnswer;
        service.UpdateAnswer = UpdateAnswer;
        service.questionFileUpload = questionFileUpload;
        service.answerFileUpload = answerFileUpload;

        return service;

        function GetMine() {
            return $http.get('/api/questions/mine').then(handleSuccess, handleError);
        }

        function GetAll() {
            return $http.get('/api/questions/active').then(handleSuccess, handleError);
        }

        function GetById(_id) {
            return $http.get('/api/questions/all/' + _id).then(handleSuccess, handleError);
        }

        function createQuestion(question) {
            return $http.post('/api/questions/create', question).then(handleSuccess, handleError);
        }

        function UpdateQuestion(_id, question) {
            return $http.put('/api/questions/' + _id, question).then(handleSuccess, handleError);
        }

        function DeleteQuestion(_id) {
            return $http.delete('/api/questions/' + _id).then(handleSuccess, handleError);
        }

        function postAnswer(_id, answer) {
            return $http.post('/api/questions/' + _id + '/answer', answer).then(handleSuccess, handleError);
        }

        function UpdateAnswer(_id, aId, answer) {
            return $http.put('/api/questions/' + _id + '/answer/' + aId + '/update', answer).then(handleSuccess, handleError);
        }

        function questionFileUpload(id, file) {
            return Upload.upload({
                url: '/api/questions/fileUpload',
                data: { file: file, '_id': id }
            }).then(handleSuccess, handleError);
        }

        function answerFileUpload(qId, aId, file) {
            return Upload.upload({
                url: '/api/questions/'+ qId + '/answer/' + aId + '/fileUpload',
                data: { file: file, '_id': qId }
            }).then(handleSuccess, handleError);
        }
        

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(res) {
            return $q.reject(res.data);
        }
    }

})();