const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();

const { Ticket } = require('../../models');

router.post('/', (req, res, next) => {
  const { channel_id } = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  if(!channel_id) {
    return next(`A channel ID is required.`);
  }
  Ticket.find({
    channelId: channel_id,
    mentor: null,
    created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
    isActive: true
   })
   .sort({created_at: 1})
  .then(tickets => {
    if(tickets.length <= 0) return Promise.reject(`No sessions in queue`);
    res.send(tickets.map((ticket, index) => `[${index + 1}] ${ticket.owlSession} reported by <@${ticket.by}>.\n`).join(''));
  })
  .catch(err => next(err));
});

module.exports = router;
