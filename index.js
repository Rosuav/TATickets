const express = require('express'); const bodyParser = require('body-parser'); const axios = require('axios'); const app = express(); app.use(bodyParser.urlencoded({ 
extended: false })); const PORT = process.env.PORT || 8000; const tickets = {}; app.post('/support', function(req, res) {
  const {channel_id, user_name, response_url, text} = req.body;
  const sentences = text.split(' ');
  const session = sentences.find(sentence => sentence.includes('sessions.thinkful.com'));
  if(!session) {
    return res.status(200).json({
      response_type: "ephemeral",
      text: `You need to type a valid session url(https://sessions.thinkful.com/<room>) to be able to push it to the queue`
    });
  }
  if(!tickets[channel_id]) tickets[channel_id] = [];
  const exists = tickets[channel_id].find(ticket => ticket.session === session);
  if(exists){
    return res.status(200).json({
      response_type: "ephemeral",
      text: `The session url has been already pushed to the queue, a mentor will reach you out soon`
    });
  }
  tickets[channel_id].push({session, by: user_name});
  res.status(200).json({
    response_type: "ephemeral",
    text: `Request successfully pushed to the queue`
  });
  axios.post(response_url, {
    response_type: "in_channel",
    text: `Mentor required in ${session} by <@${user_name}>`
  });
});
app.post('/next', function(req, res){
  const {channel_id, user_name, response_url} = req.body;
  if(!tickets[channel_id] || tickets[channel_id].length <= 0){
    res.status(200).json({
      response_type: "ephemeral",
      text: `No sessions in queue`
    });
  } 
  const ticket = tickets[channel_id].shift();
  res.status(200).json({
    response_type: "ephemeral",
    text: `Next session room: ${ticket.session}`
  });
  axios.post(response_url, {
    response_type: "in_channel",
    text: `<@${user_name}> incoming <@${ticket.by}>`
  });
});
app.get('/queue/:channelName', function(req, res) {
  const { channelName } = req.params;
  if(!channelName) {
    return res.send(`A channel name is required.`);
  }
  if(!tickets[channelName]) tickets[channelName] = [];
  if(tickets[channelName].length <= 0) return res.send(`No sessions in queue`);
  res.send(tickets[channelName].map(ticket => `<p>Session: ${ticket.session} reported by ${ticket.by}.</p>`).join(''));
});
app.get('/clear/:channelName', function(req, res) {
  const { channelName } = req.params;
  if(!channelName) return res.send(`A channel name is required.`);
  if(tickets[channelName]) delete tickets[channelName];
  res.send(`Tickets from ${channelName} cleared.`);
});
app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT}`);
});
