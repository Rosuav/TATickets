const sinon = require('sinon');
const mongoose = require('mongoose');
const { TEST_MONGODB_URI } = require('../config');
const { Mentor, Ticket } = require('../models');
const seedMentors = require('../data/mentors');
const seedTickets = require('../data/tickets');

let clock;

before(function() {
  clock = sinon.useFakeTimers({
    now: new Date('April 11, 2018 3:00 PM'), // A Wednesday
    toFake: ['Date']
  });
  return mongoose.connect(TEST_MONGODB_URI);
});

beforeEach(function() {
  return Mentor.insertMany(seedMentors);
});

beforeEach(function() {
  return Ticket.insertMany(seedTickets);
});

afterEach(function() {
  return mongoose.connection.db.dropDatabase();
});

after(function() {
  clock.restore();
  return mongoose.disconnect();
});
