'use strict';
const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const { Mentor } = require('../models');
const seedMentors = require('../data/mentors');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TFTATickets API - Mentors', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Mentor.insertMany(seedMentors);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /mentors', function () {
    it('should return the correct number of mentors', function () {
      const dbPromise = Mentor.find();
      const apiPromise = chai.request(app).get('/mentors');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(item => {
            expect(item).to.be.a('object');
            expect(item).to.include.keys('name','isActive','email','slackUsername');
          });
        });
    });
  });

  describe('POST /mentors', function () {
    it('should create and return a new mentor when provided valid data', function () {
      const newItem = {
        firstName: 'Mentor',
        lastName: 'Test',
        email: 'mentortest@mail.com',
        username: 'mentortest'
      };
      let body;
      return chai.request(app)
        .post('/mentors')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('name', 'email', 'slackUsername', 'isActive');
          return Mentor.findById(body._id);
        })
        .then(data => {
          expect(body.name.firstName).to.equal(data.name.firstName);
          expect(body.email).to.equal(data.email);
          expect(body.slackUsername).to.equal(data.slackUsername);
          expect(body.isActive).to.equal(data.isActive);
        });
    });
  });
});