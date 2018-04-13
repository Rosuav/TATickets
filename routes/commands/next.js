const express = require('express');
const moment = require('moment-timezone');

const axios = require('axios');

const router = express.Router();

const { Mentor, Ticket } = require('../../models');
const { formatTicketMessage } = require('../../helpers')

router.post('/', (req, res, next) => {
  const {channel_id, user_name, response_url, text} = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  let _mentor;

  Mentor.findOne({ slackUsername: user_name })
  .then(mentor => {
    if(!mentor) return Promise.reject('Only registered mentors could call next');
    _mentor = mentor;
    return Ticket.findOne({
      channelId: channel_id,
      mentor: null,
      isActive: true,
      created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() }
    })
    .sort({created_at: 1})
  })
  .then(ticket => {
    if(!ticket) return Promise.reject(`No sessions in queue`);
    ticket.mentor = _mentor;
    ticket.attended_at = Date.now();
    return ticket.save();
  }).then(ticket => {

    if (text === 'silent') {
      res.status(200).json({
        response_type: 'ephemeral',
        text: `:shushing_face: Ticket silently dequeued: ${ticket.owlSession}`
      });
    } else {
      res.status(200).json(
        formatTicketMessage({
          user_name: ticket.by,
          issue: ticket.issue,
          session: ticket.owlSession,
          response_type: 'ephemeral'
        }));

        axios.post(response_url, {
          response_type: "in_channel",
          text: `<@${user_name}> incoming <@${ticket.by}>`
        });
      }
  })
  .catch(err => next(err));
});

module.exports = router;
