const { SLACK_VERIFICATION_TOKEN } = require('./../config');

const vertificationTokenAuth = (req, res, next) => {
  const { token, channel_id, user_id, user_name, response_url } = req.body;
  if(token !== SLACK_VERIFICATION_TOKEN) throw 'Unauthorized';

  if (!channel_id || !user_name|| !user_id || !response_url) throw 'Hmm... Something went wrong, and it\'s on Slack\'s end (400)';

  next();
};

module.exports = vertificationTokenAuth;
