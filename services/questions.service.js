var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('questions');
var ObjectId = require('mongodb').ObjectID;

var service = {};

service.allQ = allQ;
service.activeQ = activeQ;
service.myQ = myQ;
service.getQById = getQById;
service.createQ = createQ;
service.updateQ = updateQ;
service.deleteQ = _deleteQ;
service.postAnswer = postAnswer;
service.updateA = updateA;
service.upload = upload;

module.exports = service;

function allQ() {
    var deferred = Q.defer();

    db.questions.find().toArray(function(err, questions) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (questions) {
            // authentication successful
            deferred.resolve(questions);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function activeQ() {
    var deferred = Q.defer();

    db.questions.find({ "isDelete": false }).toArray(function(err, questions) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (questions) {
            // authentication successful
            deferred.resolve(questions);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function myQ(userId) {
    var deferred = Q.defer();
    //console.log(userId)
    db.questions.find({ "postedById": mongo.helper.toObjectID(userId) }).toArray(function(err, questions) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (questions) {
            // authentication successful
            deferred.resolve(questions);
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getQById(_id) {
    var deferred = Q.defer();

    db.questions.findById(_id, function(err, question) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (question) {
            // return Question
            deferred.resolve(question);
        } else {
            // question not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function createQ(user, param) {
    var deferred = Q.defer();

    // add hashed password to user object
    var question = {
        "question": param.question,
        "largeText": param.largeText,
        "answers": [],
        "postedById": user._id,
        "postedByName": user.firstName + " " + user.lastName,
        "postedByEmail": user.username,
        "postedDate": new Date(),
        "isDelete": false,
        "location": []
    }

    db.questions.insert(
        question,
        function(err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve(doc.ops[0]);
        });

    return deferred.promise;
}

function updateQ(userId, _id, userParam) {
    var deferred = Q.defer();

    // validation
    db.questions.findById(_id, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (user.postedById == userId) {
            updateQuestion();
        } else {
            deferred.reject("You are not authorized");
        }
    });

    function updateQuestion() {
        // fields to update
        var set = {
            question: userParam.question,
            largeText: userParam.largeText
        };

        db.questions.update({ _id: mongo.helper.toObjectID(_id) }, { $set: set },
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                deferred.resolve(doc);
            });
    }

    return deferred.promise;
}

function _deleteQ(_id) {
    var deferred = Q.defer();

    db.questions.findById(_id, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        deleteQ();
    });

    function deleteQ() {
        // fields to update
        var set = {
            isDelete: true
        };

        db.questions.update({ _id: mongo.helper.toObjectID(_id) }, { $set: set },
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve(doc);
            });
    }

    return deferred.promise;
}

function postAnswer(user, qId, params) {
    var deferred = Q.defer();
    db.questions.findById(qId, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        post();
    });

    function post() {
        var id = new ObjectId();
        db.questions.update({ _id: mongo.helper.toObjectID(qId) }, {
                "$push": {
                    "answers": {
                        "text": params.text,
                        "postedById": user._id,
                        "postedByName": user.firstName + " " + user.lastName,
                        "postedByEmail": user.username,
                        "postedDate": new Date(),
                        "id": id,
                        "isDelete": false,
                        "location": []
                    }
                }
            },
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                doc.result.id = id;
                deferred.resolve(doc);
            });
    }

    return deferred.promise;
}

function updateA(qId, aId, userParam) {
    var deferred = Q.defer();
    // validation
    db.questions.findOne({ _id: mongo.helper.toObjectID(qId), "answers.id": mongo.helper.toObjectID(aId) }, { 'answers.$': 1 }, function(err, doc) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (doc) {
            updateAnswer(doc);
        } else {
            deferred.reject("not found");
        }
    });

    function updateAnswer(doc) {
        // fields to update
        db.questions.update({ 'answers.id': mongo.helper.toObjectID(aId) }, {
                "$set": {
                    "answers.$.text": userParam.text
                }
            },
            function(err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve(doc);
            });
    }

    return deferred.promise;
}

function upload(mimeType, _id, location, type, aId) {
    var deferred = Q.defer();

    if (type == 'question') {
        // validation
        db.questions.findById(_id, function(err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            uploadF();
        });

        function uploadF() {
            // fields to update

            db.questions.update({ _id: mongo.helper.toObjectID(_id) }, {
                    "$push": {
                        "location": {
                            'path': config.filePath + location,
                            'type': mimeType
                        }
                    }
                },
                function(err, doc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    deferred.resolve(doc);
                });
        }
    } else if (type == 'answer') {
        db.questions.findOne({ _id: mongo.helper.toObjectID(_id), "answers.id": mongo.helper.toObjectID(aId) }, { 'answers.$': 1 }, function(err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                uploadA(doc);
            } else {
                deferred.reject("not found");
            }
        });

        function uploadA(doc) {
            // fields to update
            db.questions.update({ 'answers.id': mongo.helper.toObjectID(aId) }, {
                    "$push": {
                        "answers.$.location": {
                            'path': config.filePath + location,
                            'type': mimeType
                        }
                    }
                },
                function(err, doc) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    deferred.resolve(doc);
                });
        }
    }

    return deferred.promise;
}