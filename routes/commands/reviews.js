const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();

const { Mentor, Ticket } = require('../../models');

router.post('/', (req, res, next) => {
  const {channel_id, user_name, response_url, text} = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  let _title;
  Mentor.findOne({ slackUsername: user_name })
  .then(mentor => {
    if(text === "pending"){
      title = 'Pending reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        reviewed_at: { $exists: false },
        isActive: true
      });
    } else if(text === "completed"){
      title = 'Completed reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        reviewed_at: { $exists: true },
        isActive: true
      });
    } else if(text !== ""){
      const params = text.split(' ');
      if(params.length < 3) return Promise.reject('Invalid feedback params');
      const id = params[0];
      const colors = params[1];
      const review = params.slice(2, params.length).join(' ');

      return Ticket.findOne({ _id: id })
      .then(ticket => {
        if(!ticket){
          return Promise.reject('Invalid ticket ID');
        }
        ticket.review = review;
        ticket.colors = colors.split("/").map(item => {
          const student = item.split(':')[0];
          const color = item.split(':')[1];
          return {student, color};
        });
        ticket.reviewed_at = Date.now();
        ticket.save();
        return ticket.owlSession;
      });
    }else {
      title = 'Today\'s reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        isActive: true
      });
    }
  })
  .then(tickets => {
    if(typeof tickets === "string"){
      res.status(200).json({
        response_type: "ephemeral",
        text: `Feedback for ${tickets} submitted`
      });
    } else if(!tickets || tickets.length <= 0) {
      next('No reviews available');
    } else {
      switch(text){
        case "pending":
          res.status(200).json({
            response_type: "ephemeral",
            text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.owlSession}\n`).join('')}`
          });
        break;
        case "completed":
          res.status(200).json({
            response_type: "ephemeral",
            text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')}`
          });
        break;
        default:
        res.status(200).json({
          response_type: "ephemeral",
          text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.owlSession} => ${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')}`
        });
      }
    }
  })
  .catch(err =>  next(err));
});

module.exports = router;
