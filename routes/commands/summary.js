const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();

const { Ticket } = require('../../models');

router.post('/', (req, res) => {
  const { channel_id, text } = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');

  if(text === "channel"){
    return res.send(`Channel ID: *${channel_id}*`);
  }

  let channelId = text ? text : channel_id;

  Ticket.find({
    channelId: channelId,
    created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
    reviewed_at: { $exists: true },
    isActive: true
  })
  .populate('mentor')
  .sort('created_at')
  .then(tickets => {
    res.status(200).json({
      response_type: "ephemeral",
      text: tickets.map(ticket => `${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')
    });
  })
})

module.exports = router;
