const { SLACK_VERIFICATION_TOKEN } = require('./../config');

const vertificationTokenAuth = (req, res, next) => {
  const { token } = req.body;
  if(token == SLACK_VERIFICATION_TOKEN) return next();

  if(req.headers.authorization == `Basic ${SLACK_VERIFICATION_TOKEN}`) {
    return next();
  }

  throw 'Unauthorized';
};

module.exports = vertificationTokenAuth;
