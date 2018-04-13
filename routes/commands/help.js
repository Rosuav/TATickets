const express = require('express');
const moment = require('moment');
const axios = require('axios');

const router = express.Router();

const { Mentor, Ticket } = require('../../models');

router.post('/help', (req, res, next) => {
  const {channel_id, text, user_name, user_id, response_url} = req.body;
  switch(text){
    case 'username':
      return res.json({
        response_type: "ephemeral",
        text:`${user_id} - ${text}`
      });
    case 'channel':
      return res.json({
        response_type: "ephemeral",
        text:`${channel_id}`
      });
    default:
    return res.json({
      response_type: "ephemeral",
      text:`https://github.com/vampaynani/TATickets/README.md`
    });
  }
});

module.exports = router;
