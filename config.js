exports.PORT = process.env.PORT || 8080;

exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/tftatickets';

//for testing
exports.TEST_MONGODB_URI = process.env.TEST_MONGODB_URI ||
                      'mongodb://localhost/test-tftatickets';

exports.SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN || 'myCoolTokenJustForTestingPurposes';
