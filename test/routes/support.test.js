'use strict';
const app = require('../../index');

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const axios = require('axios');

const moment = require('moment');

const { Mentor, Ticket } = require('../../models');

const expect = chai.expect;
chai.use(chaiHttp);

describe('TATickets - /support', function () {
  let postStub;

  before(function() {
    postStub = sinon.stub(axios, 'post');
  });

  afterEach(function() {
    postStub.reset();
  });

  after(function() {
    axios.post.restore();
  });

  describe('POST /support', function () {
    it('should create and return a new ticket with all the required fields', function () {
      const sessionUrl = 'https://sessions.thinkful.com/test'
      const newTicket = {
        channel_id: 'G9AJF01BL',
        user_name: 'TestUser',
        response_url: 'http://localhost:8080/test',
        text: `${sessionUrl} This is just a test`
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
          // Testing second message
          expect(postStub.firstCall.args[0]).to.equal(newTicket.response_url);
          expect(postStub.firstCall.args[1]).to.be.an('object');
          expect(postStub.firstCall.args[1].response_type).to.equal('in_channel');
          expect(postStub.firstCall.args[1].attachments[0].fallback).to.equal(
            `<@${newTicket.user_name}> issued: This is just a test. In ${sessionUrl} <@mentor4> <@mentor5>`
          );
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
            expect(postStub.firstCall.args[1]).to.be.an('object');
            expect(postStub.firstCall.args[1].response_type).to.equal('in_channel');
            expect(postStub.firstCall.args[1].text).to.equal(
              `${ticket.owlSession} removed from the queue`
            );
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

    describe('Disallow requests outside of TA Hours', function() {
      let clock;

      afterEach(function() {
        clock.restore();
      })

    it('should not allow posting tickets before the morning session', function () {
      clock = sinon.useFakeTimers({
        now: new Date('April 11, 2018 9:00 AM'), // A Wednesday
        toFake: ['Date']
      });

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
          expect(body.text).to.equal('Oops! TA support is available starting at 11AM Eastern, please request again later!');
        });
    });

    it('should not allow posting tickets during lunch', function () {
      clock = sinon.useFakeTimers({
        now: new Date('April 11, 2018 1:25 PM'), // A Wednesday
        toFake: ['Date']
      });

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
          expect(body.text).to.equal('Oops! It\'s lunch time, TAs will be back at 1:30 Eastern');
        });
    });

    it('should not allow posting tickets after the afternoon session', function () {
      clock = sinon.useFakeTimers({
        now: new Date('April 11, 2018 8:00 PM'), // A Wednesday
        toFake: ['Date']
      });

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
          expect(body.text).to.equal('Oops! TA support is only available until 4:30 Eastern!');
        });
    });



        })

  });
});
