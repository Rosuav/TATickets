const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const { PORT, DATABASE_URL } = require('./config');
const { Mentor, Ticket } = require('./models');

const mentors = require('./routes/mentors');
const { next, queue, reviews, summary, support } = require('./routes/commands');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// RESTful Routes
app.use('/mentors', mentors);

// Slack POST Routes
app.use('/support', support);
app.use('/next', next);
app.use('/queue', queue);
app.use('/reviews', reviews);
app.use('/summary', summary);

app.post('/test', (req, res, next) => {
  //console.log(req.body);
  res.status(204).json();
})

app.get('/clear/:channelID', function(req, res) {
  const { channelID } = req.params;
  if(!channelID) return res.send(`A channel ID is required.`);
  Ticket.update({ channelId: channelID, isActive: true }, {isActive: false})
  .then(ticket => {
    res.send(`Tickets from ${channelID} cleared.`);
  });
});

app.post('/ta-mentor', function(req, res){
  const {text, user_id} = req.body;
  res.json({
    response_type: "ephemeral",
    text:`${text} ${user_id}`
  });
})

app.use((err, req, res, next) => {
  res.status(err.status || 200);
  res.json({
    response_type: "ephemeral",
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
}

if(require.main === module){
  runServer(DATABASE_URL);
}

module.exports = app;
