'use strict';
const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const axios = require('axios');

const moment = require('moment-timezone');

const { Mentor, Ticket } = require('../../models');

const { SLACK_VERIFICATION_TOKEN } = require('../../config')

const expect = chai.expect;

chai.use(chaiHttp);

describe('TATickets - /help', function() {
	describe('POST /help', function() {
		const slackRequestWithoutToken = {
			channel_id: 'G9AJF01BL',
			user_name: 'SallyStudent',
      user_id: '123456789',
			response_url: 'http://localhost:8080/test'
		};

    const slackRequest = Object.assign({}, slackRequestWithoutToken, {
      token: SLACK_VERIFICATION_TOKEN
    })

    it('should reject unathorized requests', function() {
			return chai.request(app).post('/help').send(slackRequestWithoutToken)
				.then(function(res) {
        expect(res).to.have.status(401);
  		})
		});

		it('can provide help with a link to the readme', function() {
			return chai.request(app).post('/help').send(slackRequest)
				.then(function(res) {
  			const body = res.body;
  			expect(res).to.have.status(200);
  			expect(res).to.be.json;
  			expect(body).to.be.a('object');
  			expect(body).to.include.keys('response_type', 'text');
  			expect(body.response_type).to.equal('ephemeral');
  			expect(body.text).to.equal('https://github.com/vampaynani/TATickets/blob/master/README.md');
  		});
		});
		it('can return the username and user id', function() {
			return chai.request(app).post('/help').send(
        {...slackRequest, text: 'username' }
      )
				.then(function(res) {
  			const body = res.body;
  			expect(res).to.have.status(200);
  			expect(res).to.be.json;
  			expect(body).to.be.a('object');
  			expect(body).to.include.keys('response_type', 'text');
  			expect(body.response_type).to.equal('ephemeral');
  			expect(body.text).to.equal(`${slackRequest.user_id} - ${slackRequest.user_name}`);
  		});
		});
    it('can return the channel id', function() {
			return chai.request(app).post('/help').send(
        {...slackRequest, text: 'channel' }
      )
				.then(function(res) {
  			const body = res.body;
  			expect(res).to.have.status(200);
  			expect(res).to.be.json;
  			expect(body).to.be.a('object');
  			expect(body).to.include.keys('response_type', 'text');
  			expect(body.response_type).to.equal('ephemeral');
  			expect(body.text).to.equal(`${slackRequest.channel_id}`);
  		});
		});
	});
});
