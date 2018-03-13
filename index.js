const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const morgan = require('morgan');
const moment = require('moment');
const app = express();

const {PORT, DATABASE_URL} = require('./config');
const { Mentor, Ticket } = require('./models');

app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));

const tickets = {};

app.post('/mentors', (req, res, next) => {
  Mentor.create({
    name: {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    },
    email: req.body.email,
    slackUsername: req.body.username
  })
  .then(mentor => res.status(201).json(mentor))
  .catch(err => next(err));
});

app.get('/mentors', (req, res, next) => {
  Mentor.find()
  .then(mentors => res.json(mentors))
  .catch(err => next(err));
});

app.post('/support', (req, res, next) => {
  const {channel_id, user_name, response_url, text} = req.body;
  const sentences = text.split(' ');
  const session = sentences.find(sentence => sentence.includes('https://'));
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  if(text === "cancel"){
    Ticket.findOne({
      by: user_name,
      channelId: channel_id,
      mentor: null,
      isActive: true,
      attended_at: { $exists: false },
      created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() } 
    })
    .then(ticket => {
      if(ticket){
        ticket.remove();
        res.status(200).json({
          response_type: "ephemeral",
          text: `Request successfully removed from the queue`
        });
        axios.post(response_url, {
          response_type: "in_channel",
          text: `${ticket.owlSession} removed from the queue`
        });
      }else{
        next(`No ticket available to cancel`);
      }
    });
    return;
  }
  if(!session) {
    return next(`You need to type a valid session url to be able to push it to the queue`);
  }
  Ticket.findOne({ owlSession: session, channelId: channel_id, mentor: null, created_at: { $gte: today.toDate() }})
  .then(ticket => {
    if(ticket){
      return Promise.reject(`The session url has been already pushed to the queue, a mentor will reach you out soon`);
    }else{
      return Ticket.create({
        owlSession: session,
        by: user_name,
        channelId: channel_id
      });
    }
  })
  .then(ticket => {
    res.status(200).json({
      response_type: "ephemeral",
      text: `Request successfully pushed to the queue`
    });
    axios.post(response_url, {
      response_type: "in_channel",
      text: `Mentor required in ${session} by <@${user_name}>`
    });
  })
  .catch(err => next(err));
});

app.post('/next', (req, res, next) => {
  const {channel_id, user_name, response_url} = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  let _ticket;

  Ticket.findOne({ 
    channelId: channel_id,
    mentor: null,
    isActive: true,
    created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() } 
  })
  .then(ticket => {
    if(!ticket) return Promise.reject(`No sessions in queue`);
    _ticket = ticket;
    return Mentor.findOne({ slackUsername: user_name });
  })
  .then(mentor => {
    if(!mentor) return Promise.reject('Only registered mentors could call next');
    _ticket.mentor = mentor;
    _ticket.attended_at = Date.now();
    _ticket.save();
    res.status(200).json({
      response_type: "ephemeral",
      text: `Next session room: ${_ticket.owlSession}`
    });
    axios.post(response_url, {
      response_type: "in_channel",
      text: `<@${user_name}> incoming <@${_ticket.by}>`
    });
  })
  .catch(err => next(err));
});

app.post('/reviews', (req, res, next) => {
  const {channel_id, user_name, response_url, text} = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  let _title;
  Mentor.findOne({ slackUsername: user_name })
  .then(mentor => {
    if(text === "pending"){
      title = 'Pending reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        reviewed_at: { $exists: false },
        isActive: true
      });
    } else if(text === "completed"){
      title = 'Completed reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() }, 
        reviewed_at: { $exists: true },
        isActive: true
      });
    } else if(text !== ""){
      const params = text.split(' ');
      if(params.length < 3) return Promise.reject('Invalid feedback params');
      const id = params[0];
      const colors = params[1];
      const review = params.slice(2, params.length).join(' ');
      
      return Ticket.findOne({ _id: id })
      .then(ticket => {
        if(!ticket){
          return Promise.reject('Invalid ticket ID');
        }
        ticket.review = review;
        ticket.colors = colors.split("/").map(item => {
          const student = item.split(':')[0];
          const color = item.split(':')[1];
          return {student, color};
        });
        ticket.reviewed_at = Date.now();
        ticket.save();
        return ticket.owlSession;
      });
    }else {
      title = 'Today\'s reviews';
      return Ticket.find({
        channelId: channel_id,
        mentor,
        created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
        isActive: true
      });
    }
  })
  .then(tickets => {
    if(typeof tickets === "string"){
      res.status(200).json({
        response_type: "ephemeral",
        text: `Feedback for ${tickets} submitted`
      });
    } else if(!tickets || tickets.length <= 0) {
      next('No reviews available');
    } else {
      switch(text){
        case "pending":
          res.status(200).json({
            response_type: "ephemeral",
            text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.owlSession}`)}`
          });
        break;
        case "completed":
          res.status(200).json({
            response_type: "ephemeral",
            text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')}`
          });     
        break;
        default:
        res.status(200).json({
          response_type: "ephemeral",
          text: `*${title}*\n${tickets.map(ticket => `[${ticket._id}] ${ticket.owlSession} => ${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')}`
        }); 
      }    
    }
  })
  .catch(err =>  next(err));
});

app.post('/queue', (req, res) => {
  const { channel_id } = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  if(!channel_id) {
    return next(`A channel ID is required.`);
  }
  Ticket.find({
    channelId: channel_id,
    mentor: null,
    created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() },
    isActive: true
   })
  .then(tickets => {
    if(tickets.length <= 0) return Promise.reject(`No sessions in queue`);
    res.send(tickets.map((ticket, index) => `[${index + 1}] ${ticket.owlSession} reported by <@${ticket.by}>.\n`).join(''));
  })
  .catch(err => next(err));
});

app.post('/summary', (req, res) => {
  const { channel_id, text } = req.body;
  const today = moment().startOf('day');
  const tomorrow = moment(today).add(1, 'days');
  if(!text) {
    return res.send('A channel ID is required.');
  }
  if(text === "channel"){
    return res.send(`Channel ID: *${channel_id}*`);
  }
  if(channel_id === text){
    return res.send('The summary can not be posted in the same channel');
  }
  Ticket.find({ 
    channelId: text, 
    created_at: { $gte: today.toDate(), $lt: tomorrow.toDate() }, 
    reviewed_at: { $exists: true },
    isActive: true
  })
  .populate('mentor')
  .sort('created_at')
  .then(tickets => {
    res.status(200).json({
      response_type: "in_channel",
      text: tickets.map(ticket => `${ticket.colors.map(item => `${item.student}:${item.color}`).join('/')} - ${ticket.review}\n`).join('')
    }); 
  })
})

app.get('/clear/:channelID', function(req, res) {
  const { channelID } = req.params;
  if(!channelID) return res.send(`A channel ID is required.`);
  Ticket.update({ channelId: channelID, isActive: true }, {isActive: false})
  .then(ticket => {
    res.send(`Tickets from ${channelID} cleared.`);
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 200);
  res.json({
    response_type: "ephemeral",
    text: err
  });
});

let server;
const runServer = (databaseUrl=DATABASE_URL, port=PORT) => {
  return new Promise((resolve, reject) => {
   mongoose.connect(databaseUrl, err => {
      if(err) return reject(err);
      server = app.listen(port, () => {
        console.log(`App is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

const closeServer = () => {
  return mongoose.disconnect()
  .then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if(err) return reject(err);
        resolve();
      });
    });
  });
}

if(require.main === module){
  runServer().catch(err => console.error(err));
}