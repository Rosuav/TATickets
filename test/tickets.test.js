'use strict';
const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const moment = require('moment');

const { TEST_MONGODB_URI } = require('../config');

const { Ticket } = require('../models');
const seedTickets = require('../data/tickets');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TFTATickets API - Tickets', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Ticket.insertMany(seedTickets);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /support', function () {
    it('should create and return a new ticket with all the required fields', function () {
      const newTicket = {
        channel_id: 'G9AJF01BL',
        user_name: 'TestUser',
        response_url: 'http://localhost:8080/test',
        text: 'https://sessions.thinkful.com/test This is just a test'
      }
      let body;
      return chai.request(app)
        .post('/support')
        .send(newTicket)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('response_type', 'text');
          expect(body.response_type).to.equal('ephemeral');
          expect(body.text).to.equal('Request successfully pushed to the queue');
        });
    });

    it('should create and return a new ticket with just the session url (/ta-support https://sessions.thinkful.com/test)', function () {
      const newTicket = {
        channel_id: 'G9AJF01BL',
        user_name: 'TestUser',
        response_url: 'http://localhost:8080/test',
        text: 'https://sessions.thinkful.com/test'
      }
      let body;
      return chai.request(app)
        .post('/support')
        .send(newTicket)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('response_type', 'text');
          expect(body.response_type).to.equal('ephemeral');
          expect(body.text).to.equal('Request successfully pushed to the queue');
        });
    });

    it('should create and return a new ticket with just the slack command (/ta-support)', function () {
      const newTicket = {
        channel_id: 'G9AJF01BL',
        user_name: 'TestUser',
        response_url: 'http://localhost:8080/test',
        text: ''
      }
      let body;
      return chai.request(app)
        .post('/support')
        .send(newTicket)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('response_type', 'text');
          expect(body.response_type).to.equal('ephemeral');
          expect(body.text).to.equal('Request successfully pushed to the queue');
        });
    });

    it('should cancel a previously created ticket', function () {
      return Ticket.findOne({mentor: null})
      .then(ticket => {
        const testTicket = {
          channel_id: ticket.channelId,
          user_name: ticket.by,
          response_url: 'http://localhost:8080/test',
          text: 'cancel'
        }
        let body;
        return chai.request(app)
          .post('/support')
          .send(testTicket)
          .then(function (res) {
            body = res.body;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(body).to.be.a('object');
            expect(body).to.include.keys('response_type', 'text');
            expect(body.response_type).to.equal('ephemeral');
            expect(body.text).to.equal('Request successfully removed from the queue');
          })
          .then(function () {
            let cancelledBody;
            return chai.request(app)
              .post('/support')
              .send(testTicket)
              .then(function (res) {
                cancelledBody = res.body;
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(cancelledBody).to.be.a('object');
                expect(cancelledBody).to.include.keys('response_type', 'text');
                expect(cancelledBody.response_type).to.equal('ephemeral');
                expect(cancelledBody.text).to.equal('No ticket available to cancel');
              });
          });
        });
    });

    it('should fail to create a new ticket with a session already queued', function () {
      return Ticket.findOne({mentor: null})
      .then(ticket => {
        ticket.created_at = moment().startOf('day').add(5, 'hours');
        ticket.save();
        const newTicket = {
          channel_id: ticket.channelId,
          user_name: ticket.by,
          response_url: 'http://localhost:8080/test',
          text: `${ticket.owlSession} ${ticket.issue}`
        }
        let body;
        return chai.request(app)
          .post('/support')
          .send(newTicket)
          .then(function (res) {
            body = res.body;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(body).to.be.a('object');
            expect(body).to.include.keys('response_type', 'text');
            expect(body.response_type).to.equal('ephemeral');
            expect(body.text).to.equal('The session url has been already pushed to the queue, a mentor will reach you out soon');
          });
        });
    });
  });
});