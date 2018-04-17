const { SLACK_VERIFICATION_TOKEN } = require('./../config');

const vertificationTokenAuth = (req, res, next) => {
  const { token } = req.body;
  if(token !== SLACK_VERIFICATION_TOKEN) throw 'Unauthorized';
  next();
};

module.exports = vertificationTokenAuth;
