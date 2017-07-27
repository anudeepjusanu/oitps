var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('services/user.service');
var questionService = require('services/questions.service');
var crypto = require('crypto');
var multer = require('multer');
var mime = require('mime');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
        });
    }
});
var upload = multer({ storage: storage });

// routes
router.get('/all', allQuestions);
router.get('/active', activeQuestions);
router.get('/mine', myQuestions);
router.post('/create', postQuestion);
router.get('/all/:_id', getQuestion);
router.put('/:_id', updateQuestion);
router.delete('/:_id', deleteQuestion);
router.post('/:_id/answer', postAnswer);
router.put('/:_id/answer/:aId/update', updateAnswer);
router.post('/fileUpload', upload.single('file'), fileUpload);
router.post('/:_id/answer/:aId/fileUpload', upload.single('file'), fileUploadA);

module.exports = router;

function allQuestions(req, res) {
    questionService.allQ()
        .then(function(questions) {
            if (questions) {
                // authentication successful
                res.send(questions);
            } else {
                // authentication failed
                res.status(401).send('Username or password is incorrect');
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
}

function activeQuestions(req, res) {
    questionService.activeQ()
        .then(function(questions) {
            if (questions) {
                // authentication successful
                res.send(questions);
            } else {
                // authentication failed
                res.status(401).send('Username or password is incorrect');
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
}

function myQuestions(req, res) {
    questionService.myQ(req.user.sub)
        .then(function(questions) {
            if (questions) {
                // authentication successful
                res.send(questions);
            } else {
                // authentication failed
                res.status(401).send('Username or password is incorrect');
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
}

function postQuestion(req, res) {
    userService.getById(req.user.sub)
        .then(function(user) {
            if (user) {
                create(user);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });

    function create(user) {
        questionService.createQ(user, req.body)
            .then(function(question) {
                res.send(question);
            })
            .catch(function(err) {
                res.status(400).send(err);
            });
    }
}

function getQuestion(req, res) {
    questionService.getQById(req.params._id)
        .then(function(question) {
            if (question) {
                res.send(question);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
}

function updateQuestion(req, res) {
    var userId = req.user.sub;
    questionService.updateQ(userId, req.params._id, req.body)
        .then(function(question) {
            res.send(question);
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
};

function deleteQuestion(req, res) {
    var userId = req.user.sub;

    questionService.deleteQ(req.params._id)
        .then(function() {
            res.sendStatus(200);
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
}

function postAnswer(req, res) {
    userService.getById(req.user.sub)
        .then(function(user) {
            if (user) {
                createA(user);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
    function createA(user) {
        questionService.postAnswer(user, req.params._id, req.body)
            .then(function(question) {
                res.send(question);
            })
            .catch(function(err) {
                res.status(400).send(err);
            });
    }
};

function updateAnswer(req, res) {
    var userId = req.user.sub;
    questionService.updateA(req.params._id, req.params.aId, req.body)
        .then(function(question) {
            res.send(question);
        })
        .catch(function(err) {
            res.status(400).send(err);
        });
};

function fileUpload(req, res) {
    var userId = req.user.sub;
    if (req.file) {
        questionService.upload(req.file.mimetype, req.body._id, req.file.path, "question")
            .then(function(question) {
                res.send(question);
            })
            .catch(function(err) {
                res.status(400).send(err);
            });
    } else {
        res.status(400);
    }
}

function fileUploadA(req, res) {
    if (req.file) {
        questionService.upload(req.file.mimetype, req.body._id, req.file.path, "answer", req.params.aId)
            .then(function(question) {
                res.send(question);
            })
            .catch(function(err) {
                res.status(400).send(err);
            });
    } else {
        res.status(400);
    }
}