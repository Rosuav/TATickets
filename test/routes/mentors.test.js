'use strict';
const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { Mentor } = require('../../models');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TATickets - /mentors', function () {
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
            expect(item).to.include.keys('name','isActive','email','slackUsername', 'slackUserId');
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
        slackUserId: 'UMENTORTEST'
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
          expect(body).to.include.keys('name', 'email', 'slackUserId', 'isActive');
          return Mentor.findById(body._id);
        })
        .then(data => {
          expect(body.name.firstName).to.equal(data.name.firstName);
          expect(body.email).to.equal(data.email);
          expect(body.slackUserId).to.equal(data.slackUserId);
          expect(body.isActive).to.equal(data.isActive);
        });
    });
  });
});
