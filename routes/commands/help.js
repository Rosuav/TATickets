require('dotenv').config();
const express = require('express');
const moment = require('moment');
const axios = require('axios');
const { SLACK_VERIFICATION_TOKEN } = require('../../config');

const router = express.Router();

const { Mentor, Ticket } = require('../../models');

router.post('/', (req, res, next) => {
  const {channel_id, text, user_name, user_id, response_url, token} = req.body;

  if(token !== SLACK_VERIFICATION_TOKEN) throw 'Unauthorized';

  switch(text){
  case 'username':
    return res.json({
      response_type: 'ephemeral',
      text:`${user_id} - ${user_name}`
    });
  case 'channel':
    return res.json({
      response_type: 'ephemeral',
      text:`${channel_id}`
    });
  default:
    return res.json({
      response_type: 'ephemeral',
      text:'https://github.com/vampaynani/TATickets/blob/master/README.md'
    });
  }
});

module.exports = router;
