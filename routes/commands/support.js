const express = require('express');
const moment = require('moment');
const axios = require('axios');

const router = express.Router();

const { Ticket } = require('../../models');

router.post('/', (req, res, next) => {
  const {channel_id, user_name, response_url, text} = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  const sentences = text ? text.split(' ') : [];
  let session = sentences.find(sentence => sentence.includes('http://') || sentence.includes('https://'));
  let issue = sentences.filter(sentence => sentence !== session).join(' ');
  if(text === "cancel" || text === "remove"){
    Ticket.findOne({
      by: user_name,
      channelId: channel_id,
      mentor: null,
      isActive: true,
      attended_at: { $exists: false }
    })
    .then(ticket => {
      if(ticket){
        ticket.remove();
        res.status(200).json({
          response_type: "ephemeral",
          text: `Request successfully removed from the queue`
        });
        axios.post(response_url, {
          response_type: "in_channel",
          text: `${ticket.owlSession} removed from the queue`
        });
      }else{
        next(`No ticket available to cancel`);
      }
    });
    return;
  }
  if(!session) {
    //return next(`You need to type a valid session url to be able to push it to the queue`);
    session = `https://sessions.thinkful.com/${user_name}`
  }
  Ticket.findOne({
    owlSession: session,
    channelId: channel_id,
    mentor: null,
    created_at: { $gte: today.toDate() }
  })
  .then(ticket => {
    if(ticket){
      return Promise.reject(`The session url has been already pushed to the queue, a mentor will reach you out soon`);
    }else{
      return Ticket.create({
        issue,
        owlSession: session,
        by: user_name,
        channelId: channel_id
      });
    }
  })
  .then(ticket => {
    const postIssue = issue ? `issued: ${issue[issue.length - 1] === "." ? issue : `${issue}.`} In ${session}` : `required a mentor in ${session}`;

    res.status(200).json({
      response_type: "ephemeral",
      text: `Request successfully pushed to the queue`
    });
    axios.post(response_url, {
      response_type: "in_channel",
      text: `<@${user_name}> ${postIssue}`
    });
  })
  .catch(err => next(err));
});

module.exports = router;
