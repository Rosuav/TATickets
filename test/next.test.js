'use strict';
const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const axios = require('axios');

const mongoose = require('mongoose');
const moment = require('moment');

const {TEST_MONGODB_URI} = require('../config');

const {Mentor, Ticket} = require('../models');
const seedTickets = require('../data/tickets');
const seedMentors = require('../data/mentors');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TFTATickets API - Tickets', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function() {
    return Ticket.insertMany(seedTickets);
  });

  beforeEach(function() {
    return Mentor.insertMany(seedMentors);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('POST /next', function() {
    let postStub;

    before(function() {
      postStub = sinon.stub(axios, 'post');
    })

    afterEach(function() {
      postStub.reset();
    });

    after(function() {
      axios.post.restore();
    });

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
        console.log(body);
        const attachment = body.attachments[0];
        const field = attachment.fields[0];
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'attachments');
        expect(body.response_type).to.equal('ephemeral');
        expect(attachment).to.include.keys('fallback', 'pretext', 'text', 'fields');
        expect(attachment.fallback).to.equal('Ticket from <@test8> - It does not work...');
        expect(attachment.pretext).to.equal('Ticket from <@test8>');
        expect(attachment.text).to.equal('It does not work...')
        expect(field.title).to.equal('Room');
        expect(field.value).to.equal('https://sessions.thinkful.com/test8');
        expect(field.short).to.equal(true);
        // Testing second message
        expect(postStub.firstCall.args[0]).to.equal(slackRequest.response_url);
        expect(postStub.firstCall.args[1]).to.be.an('object');
        expect(postStub.firstCall.args[1].response_type).to.equal('in_channel');
        expect(postStub.firstCall.args[1].text).to.equal(
          `<@${mentor.slackUsername}> incoming <@${'test8'}>`
        );
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
