'use strict';
const app = require('../../index');

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const axios = require('axios');

const moment = require('moment');
const { SLACK_VERIFICATION_TOKEN } = require('../../config');


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
    it('should reject unathorized requests', function() {
      return chai.request(app).post('/support').send({
        channel_id: 'G9AJF01BL',
        user_name: 'student3',
        response_url: 'http://localhost:8080/test',
        token: 'letmein ;-)'
      })
        .then(function(res) {
          expect(res).to.have.status(401);
        });
    });

    it('should create and return a new ticket with all the required fields', function () {
      const sessionUrl = 'https://sessions.thinkful.com/test';
      const newTicket = {
        channel_id: 'G9AJF01BL',
        user_name: 'TestUser',
        response_url: 'http://localhost:8080/test',
        text: `${sessionUrl} This is just a test`,
        token: SLACK_VERIFICATION_TOKEN
      };
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
        text: 'https://sessions.thinkful.com/test',
        token: SLACK_VERIFICATION_TOKEN
      };
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
        text: '',
        token: SLACK_VERIFICATION_TOKEN
      };
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
            text: 'cancel',
            token: SLACK_VERIFICATION_TOKEN
          };
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
            text: `${ticket.owlSession} ${ticket.issue}`,
            token: SLACK_VERIFICATION_TOKEN
          };
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
      });

      it('should not allow posting tickets before the morning session', function () {
        clock = sinon.useFakeTimers({
          now: new Date(1523451600000), // April 11, 2018 at 9:00AM (eastern) a Wednesday
          toFake: ['Date']
        });

        const newTicket = {
          channel_id: 'G9AJF01BL',
          user_name: 'TestUser',
          response_url: 'http://localhost:8080/test',
          text: '',
          token: SLACK_VERIFICATION_TOKEN
        };
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
            expect(body.text).to.equal('Oops! TA support is available starting at <!date^1514818800^{time}|10AM Eastern>, in the meantime check out an open session: https://www.thinkful.com/open-sessions/qa-sessions/ !');
          });
      });

      it('should not allow posting tickets during lunch', function () {
        clock = sinon.useFakeTimers({
          now: new Date(1523466000000), // April 11, 2018 at 1:00PM, a Wednesday (eastern)
          toFake: ['Date']
        });

        const newTicket = {
          channel_id: 'G9AJF01BL',
          user_name: 'TestUser',
          response_url: 'http://localhost:8080/test',
          text: '',
          token: SLACK_VERIFICATION_TOKEN
        };
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
            expect(body.text).to.equal('Oops! It\'s lunch time, TA support will be back at <!date^1514831400^{time}|1:30PM Eastern>');
          });
      });

      it('should not allow posting tickets after the afternoon session', function () {
        clock = sinon.useFakeTimers({
          now: new Date(1523482500000), // April 11, 2018 at 5:35PM, a Wednesday (eastern)
          toFake: ['Date']
        });

        const newTicket = {
          channel_id: 'G9AJF01BL',
          user_name: 'TestUser',
          response_url: 'http://localhost:8080/test',
          text: '',
          token: SLACK_VERIFICATION_TOKEN
        };
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
            expect(body.text).to.equal('Oops! TA support is only available until <!date^1514845800^{time}|5:30PM Eastern>, in the meantime check out an open session: https://www.thinkful.com/open-sessions/qa-sessions/ !');
          });
      });
    });
  });
});
