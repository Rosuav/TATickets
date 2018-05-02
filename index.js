require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const { PORT, DATABASE_URL } = require('./config');
const { Mentor, Ticket } = require('./models');
const { vertificationTokenAuth, validateSlackRequest } = require('./helpers');

const mentors = require('./routes/mentors');
const { next, notifications, queue, reviews, summary, support, help } = require('./routes/commands');

const app = express();

// app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Auth
app.use(vertificationTokenAuth);

// RESTful Routes
app.use('/mentors', mentors);

// Slack POST Routes
app.use(validateSlackRequest);
app.use('/support', support);
app.use('/next', next);
app.use('/notifications', notifications);
app.use('/queue', queue);
// app.use('/reviews', reviews);
// app.use('/summary', summary);
app.use('/help', help);

app.use((err, req, res, next) => {

  if (err === 'Unauthorized') res.status(401);
  else res.status(200);

  res.json({
    response_type: 'ephemeral',
    text: err
  });
});

let server;
const runServer = (databaseUrl, port=PORT) => {
  mongoose.connect(databaseUrl)
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error('\n === Did you remember to start `mongod`? === \n');
      console.error(err);
    });

  server = app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
  })
    .on('error', err => {
      mongoose.disconnect();
      console.error(err);
    });
};

if(require.main === module){
  runServer(DATABASE_URL);
}

module.exports = app;
