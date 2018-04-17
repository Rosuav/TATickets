const express = require('express');
const moment = require('moment-timezone');
const axios = require('axios');

const router = express.Router();

const { SLACK_VERIFICATION_TOKEN } = require('../../config');

const { Mentor, Ticket } = require('../../models');
const { formatTicketMessage } = require('../../helpers');

router.post('/', (req, res, next) => {
  const {channel_id, user_name, user_id, response_url, text} = req.body;

  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  const sentences = text
    ? text.split(' ')
    : [];
  let session = sentences.find(sentence => sentence.includes('http://') || sentence.includes('https://'));
  let issue = sentences.filter(sentence => sentence !== session).join(' ');
  if (text === 'cancel' || text === 'remove') {
    Ticket.findOne({
      by: user_id,
      channelId: channel_id,
      mentor: null,
      isActive: true,
      attended_at: {
        $exists: false
      }
    }).then(ticket => {
      if (ticket) {
        ticket.remove();
        res.status(200).json({response_type: 'ephemeral', text: 'Request successfully removed from the queue'});
        axios.post(response_url, {
          response_type: 'in_channel',
          text: `${ticket.owlSession} removed from the queue`
        });
      } else {
        next('No ticket available to cancel');
      }
    });
    return;
  }
  const m = moment().tz('America/New_York');

  const hours = m.get('hour');
  const minutes = m.get('minutes');

  // Morning class time, 10AM Eastern
  if (hours < 10)
    throw 'Oops! TA support is available starting at <!date^1514818800^{time}|10AM Eastern>, in the meantime check out an open session: https://www.thinkful.com/open-sessions/qa-sessions/ !';

  // Lunch between 12:45 and 1:30 Eastern
  if ((hours === 12 && minutes >= 45) || (hours === 13 && minutes <= 30))
    throw 'Oops! It\'s lunch time, TA support will be back at <!date^1514831400^{time}|1:30PM Eastern>';

  // Afternoon TA end time, 5:30 Eastern
  if ((hours === 17 && minutes > 30) || hours >= 18)
    throw 'Oops! TA support is only available until <!date^1514845800^{time}|5:30PM Eastern>, in the meantime check out an open session: https://www.thinkful.com/open-sessions/qa-sessions/ !';

  if (!session) {
    //return next(`You need to type a valid session url to be able to push it to the queue`);
    session = `https://sessions.thinkful.com/${user_name}`;
  }
  Ticket.findOne({
    owlSession: session,
    channelId: channel_id,
    mentor: null,
    created_at: {
      $gte: today.toDate()
    }
  }).then(ticket => {
    if (ticket) {
      return Promise.reject('The session url has been already pushed to the queue, a mentor will reach you out soon');
    } else {
      return Ticket.create({issue, owlSession: session, by: user_id, channelId: channel_id});
    }
  }).then(ticket => {
    const m = moment().tz('America/New_York');

    // TODO: Make this better.
    // 13 the magic number because Eastern Timezone lunch happens around 1PM
    // Currently relies on errors for being out of time slots
    const timeOfDay = parseFloat(m.format('HH')) >= 13 ? 'afternoon' : 'morning';

    return Mentor.find({
      notificationPreferences: {
        $elemMatch: {
          channelId: channel_id,
          dayOfWeek: m.day(),
          timeOfDay
        }
      }
    });
  }).then(mentors => {
    res.status(200).json({response_type: 'ephemeral', text: 'Request successfully pushed to the queue'});
    axios.post(response_url, formatTicketMessage({user_id, issue, session, mentors: mentors.map(mentor => mentor.slackUserId)}));
  }).catch(err => next(err));
});

module.exports = router;
