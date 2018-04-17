const express = require('express');
const moment = require('moment-timezone');
const axios = require('axios');

const router = express.Router();
const { SLACK_VERIFICATION_TOKEN } = require('../../config');

const { Mentor } = require('../../models');
const { parseTextToNotiPrefs, renderCalendar } = require('../../helpers');

router.post('/', (req, res, next) => {
  const {channel_id, user_name, user_id, response_url, text} = req.body;

  let mentor;

  Mentor.findOne({slackUserId: user_id})
    .then(_mentor => {
      mentor = _mentor;

      if (!mentor) return Promise.reject('Only registered mentors can add notifications');

      if ( !text || text === 'view') return;

      let preferences = mentor.notificationPreferences;

      if (text === 'off') {
        mentor.notificationPreferences = preferences.filter(p => p.channelId !== channel_id);
        return mentor.save();
      }

      mentor.notificationPreferences = preferences.concat(
        parseTextToNotiPrefs(text, channel_id)
      );

      return mentor.save();
    }).then(() => {
      const days = mentor.notificationPreferences.filter(p => p.channelId === channel_id);
      const calendar = `\`\`\`${renderCalendar(days)}\`\`\``;
      res.json({
        response_type: 'ephemeral',
        text: days.length > 0 ? calendar : 'No notifications set for this channel.'
      // text: `\`\`\`${table}\`\`\``
      });
    })
    .catch(err => next(err));
});

module.exports = router;
