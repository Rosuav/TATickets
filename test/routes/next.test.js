'use strict';
const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const axios = require('axios');

const moment = require('moment-timezone');

const { Mentor, Ticket } = require('../../models');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TATickets - /next', function() {
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

  describe('POST /next', function() {
    it('can assign a ticket to a mentor', function() {
      let slackRequest;
      let mentor;
      return Mentor.findOne().then(_mentor => {
        mentor = _mentor;
        slackRequest = {
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test'
        }
        return chai.request(app).post('/next').send(slackRequest);
      }).then(function(res) {
        const body = res.body;
        const attachment = body.attachments[0];
        const field = attachment.fields[0];
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'attachments');
        expect(body.response_type).to.equal('ephemeral');
        expect(attachment).to.include.keys('fallback', 'title', 'text', 'fields');
        expect(attachment.fallback).to.equal('<@test8> issued: It does not work... In https://sessions.thinkful.com/test8 ');
        // TODO: write assertions that match new format
        // expect(attachment.pretext).to.equal('Ticket from <@test8>');
        // expect(attachment.text).to.equal('It does not work...')
        // expect(field.title).to.equal('Room');
        // expect(field.value).to.equal('https://sessions.thinkful.com/test8');
        // expect(field.short).to.equal(true);
        // Testing second message
        expect(postStub.firstCall.args[0]).to.equal(slackRequest.response_url);
        expect(postStub.firstCall.args[1]).to.be.an('object');
        expect(postStub.firstCall.args[1].response_type).to.equal('in_channel');
        expect(postStub.firstCall.args[1].text).to.equal(
          `<@${mentor.slackUsername}> incoming <@${'test8'}>`
        );
      })
    });
    it('can silently dequeue the next ticket', function() {
      let slackRequest;
      let mentor;
      return Mentor.findOne().then(_mentor => {
        mentor = _mentor;
        slackRequest = {
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: 'silent'
        }
        return chai.request(app).post('/next').send(slackRequest);
      }).then(function(res) {
        const body = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'text');
        expect(body.response_type).to.equal('ephemeral');
        expect(body.text).to.equal(':shushing_face: Ticket silently dequeued: https://sessions.thinkful.com/test8');
        expect(postStub.firstCall).to.equal(null);
      })
    })
    it('can provide feedback if there are no sessions', function() {
      // TODO: improve this, old tickets and tickets from today should be tested as well
      return Ticket.collection.drop().then(() => {
        return Mentor.findOne()
      }).then(mentor => {
        const slackRequest = {
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test'
        }
        return chai.request(app).post('/next').send(slackRequest);
      }).then(function(res) {
        let body = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'text');
        expect(body.response_type).to.equal('ephemeral');
        expect(body.text).to.equal('No sessions in queue');
      })
    })
    it('rejects non-mentors', function() {
      return Mentor.findOne().then(mentor => {
        const slackRequest = {
          channel_id: 'G9AJF01BL',
          user_name: 'student1000',
          response_url: 'http://localhost:8080/test'
        }

        return chai.request(app).post('/next').send(slackRequest);
      }).then(function(res) {
        let body = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'text');
        expect(body.response_type).to.equal('ephemeral');
        expect(body.text).to.equal('Only registered mentors could call next');
      })
    })
  });
});
