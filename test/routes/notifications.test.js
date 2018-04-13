'use strict';
const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const axios = require('axios');

const {Mentor} = require('../../models');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TATickets - /notifications', function() {
  let postStub;

  before(function() {
    postStub = sinon.stub(axios, 'post');
  });

  after(function() {
    axios.post.restore();
  });

describe('POST /notifications', function () {
  let mentor;
  it('should add notifications to mornings', function () {
    return Mentor.findOne().then(_mentor => {
      mentor = _mentor;
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: 'mornings'
      });
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('```.-----------------------------------------.\n|              Your Schedule              |\n|-----------------------------------------|\n|           | Mon | Tue | Wed | Thu | Fri |\n|-----------|-----|-----|-----|-----|-----|\n| Morning   | X   | X   | X   | X   | X   |\n| Afternoon |     |     |     |     |     |\n\'-----------------------------------------\'```');

      return Mentor.findById(mentor.id);
    }).then(updatedMentor => {
      const notifications = updatedMentor.notificationPreferences;
      [1,2,3,4,5].forEach((day, i) => {
        const notification = notifications[i];
        expect(notification.dayOfWeek).to.equal(day);
        expect(notification.timeOfDay).to.equal('morning');
      })
    })
  });
  it('should add notifications to afternoons', function () {
    return Mentor.findOne().then(_mentor => {
      mentor = _mentor;
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: 'afternoons'
      });
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('```.-----------------------------------------.\n|              Your Schedule              |\n|-----------------------------------------|\n|           | Mon | Tue | Wed | Thu | Fri |\n|-----------|-----|-----|-----|-----|-----|\n| Morning   |     |     |     |     |     |\n| Afternoon | X   | X   | X   | X   | X   |\n\'-----------------------------------------\'```');

      return Mentor.findById(mentor.id);
    }).then(updatedMentor => {
      const notifications = updatedMentor.notificationPreferences;
      [1,2,3,4,5].forEach((day, i) => {
        const notification = notifications[i];
        expect(notification.dayOfWeek).to.equal(day);
        expect(notification.timeOfDay).to.equal('afternoon');
      })
    })
  });
  it('should remove notifications', function () {
    return Mentor.findOne({slackUsername: 'mentor4'}).then(_mentor => {
      mentor = _mentor;
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: 'off'
      });
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('No notifications set for this channel.');
      return Mentor.findById(mentor.id);
    }).then(updatedMentor => {
      const notifications = updatedMentor.notificationPreferences;
      expect(notifications.length).to.equal(1)
    })
  });
  it('only mentors can add notifications', function () {
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: 'joeyStudent1000',
          response_url: 'http://localhost:8080/test',
          text: 'off'
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('Only registered mentors can add notifications');
    });
  });
  it('should display notifications with "view" command', function () {
    return Mentor.findOne({slackUsername: 'mentor4'}).then(_mentor => {
      mentor = _mentor;
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: 'view'
      });
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('```.-----------------------------------------.\n|              Your Schedule              |\n|-----------------------------------------|\n|           | Mon | Tue | Wed | Thu | Fri |\n|-----------|-----|-----|-----|-----|-----|\n| Morning   |     |     |     |     |     |\n| Afternoon | X   | X   | X   | X   | X   |\n\'-----------------------------------------\'```');
    })
  });
  it('should display notifications if no parameter is provided', function () {
    return Mentor.findOne({slackUsername: 'mentor4'}).then(_mentor => {
      mentor = _mentor;
      return chai.request(app).post(`/notifications`)
      .send({
          channel_id: 'G9AJF01BL',
          user_name: mentor.slackUsername,
          response_url: 'http://localhost:8080/test',
          text: ''
      });
    }).then(res => {
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.a('object');
      expect(res.body).to.include.keys('response_type', 'text');
      expect(res.body.response_type).to.equal('ephemeral');
      expect(res.body.text).to.equal('```.-----------------------------------------.\n|              Your Schedule              |\n|-----------------------------------------|\n|           | Mon | Tue | Wed | Thu | Fri |\n|-----------|-----|-----|-----|-----|-----|\n| Morning   |     |     |     |     |     |\n| Afternoon | X   | X   | X   | X   | X   |\n\'-----------------------------------------\'```');
    })
  });
  it('can respond gracefully to bad inputs', function () {
      return Mentor.findOne({slackUsername: 'mentor4'}).then(_mentor => {
        mentor = _mentor;
        return chai.request(app).post(`/notifications`)
        .send({
            channel_id: 'G9AJF01BL',
            user_name: mentor.slackUsername,
            response_url: 'http://localhost:8080/test',
            text: 'a89hwtnjkg'
        });
      }).then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('response_type', 'text');
        expect(res.body.response_type).to.equal('ephemeral');
        expect(res.body.text).to.equal("Sorry, I don't understand what you mean.")
      })
    });
});
});
