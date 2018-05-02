const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment-timezone');

const { SLACK_VERIFICATION_TOKEN } = require('../../config');

const { Ticket } = require('../../models');

const expect = chai.expect;

chai.use(chaiHttp);

describe('TATickets - /queue', function() {
  describe('POST /queue', function() {
    it('can return a list of tickets', function() {
      const today = moment().tz('America/New_York').startOf('day');
      const tomorrow = moment(today).add(1, 'days');

      return Ticket.find({
        channelId: 'G9AJF01BL',
        mentor: null,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        isActive: true
      }).then(function(tickets) {
        const slackRequest = {
          channel_id: 'G9AJF01BL',
          user_id: 'UMENTOR2',
          user_name: 'Mentor2',
          response_url: 'http://localhost:8080/test',
          token: SLACK_VERIFICATION_TOKEN
        };
        return chai.request(app).post('/queue').send(slackRequest);
      }).then(function(res) {
        const body = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('response_type', 'text');
        expect(body.response_type).to.equal('ephemeral');
        expect(body.text).to.equal('[1] https://sessions.thinkful.com/test8 reported by <@UTEST8>.\n[2] https://sessions.thinkful.com/test10 reported by <@UTEST10>.\n');
        // TODO: should check that the ticket make the right text
      });
    });
    it('provides feedback if there are no sessions', function() {
      const slackRequest = {
        channel_id: 'FF014445',
        user_id: 'UMENTOR2',
        user_name: 'Mentor2',
        response_url: 'http://localhost:8080/test',
        token: SLACK_VERIFICATION_TOKEN
      };
      return chai.request(app).post('/queue').send(slackRequest)
        .then(function(res) {
          const body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('response_type', 'text');
          expect(body.response_type).to.equal('ephemeral');
          expect(body.text).to.equal('No sessions in queue');
        });
    });
    it('rejects requests without channel id', function() {
      const slackRequest = {
        user_id: 'UMENTOR2',
        user_name: 'Mentor2',
        response_url: 'http://localhost:8080/test',
        token: SLACK_VERIFICATION_TOKEN
      };
      return chai.request(app).post('/queue').send(slackRequest)
        .then(function(res) {
          const body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('response_type', 'text');
          expect(body.response_type).to.equal('ephemeral');
          expect(body.text).to.equal('Hmm... Something went wrong, and it\'s on Slack\'s end (400)');
        });
    });
    it('rejects unauthorized requests', function() {
      const slackRequest = {
        channel_id: 'G9AJF01BL',
        user_id: 'UMENTOR2',
        user_name: 'Mentor2',
        response_url: 'http://localhost:8080/test',
      };
      return chai.request(app).post('/queue').send(slackRequest)
        .then(function(res) {
          expect(res).to.have.status(401);
        });
    });
  });
});
