const express = require('express');
const router = express.Router();

const { Mentor } = require('../models');

router.post('/', (req, res, next) => {
  Mentor.create({
    name: {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    },
    email: req.body.email,
    slackUsername: req.body.username
  })
    .then(mentor => res.status(201).json(mentor))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  Mentor.find()
    .then(mentors => res.json(mentors))
    .catch(err => next(err));
});

module.exports = router;
