const express = require('express');
const moment = require('moment');
const axios = require('axios');

const router = express.Router();

const { Ticket } = require('../../models');

router.post('/', (req, res, next) => {
  const {channel_id, user_name, response_url} = req.body;
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
    ticket.save();
    res.status(200).json({
      response_type: "ephemeral",
      attachments: [
        {
          fallback: `Ticket from <@${ticket.by}> - ${ticket.issue}`,
          pretext: `Ticket from <@${ticket.by}>`,
          text: ticket.issue,
          fields: [
            {
              title: "Room",
              value: ticket.owlSession,
              short: true
            }
          ]
        }
      ]
    });
    axios.post(response_url, {
      response_type: "in_channel",
      text: `<@${user_name}> incoming <@${ticket.by}>`
    });
  })
  .catch(err => next(err));
});

module.exports = router;
