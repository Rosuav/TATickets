const validateSlackRequest = (req, res, next) => {
  const {channel_id, user_id, user_name, response_url } = req.body;

  if (!channel_id || !user_name|| !user_id || !response_url) throw 'Hmm... Something went wrong, and it\'s on Slack\'s end (400)';

  next();
};

module.exports = validateSlackRequest;
