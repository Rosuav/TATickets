exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/tftatickets'; //edit for the name of the db

exports.PORT = process.env.PORT || 8080;

//for testing
exports.TEST_DATABASE_URL = process.env.DATABASE_URL ||
                      'mongodb://localhost/tftatickets';