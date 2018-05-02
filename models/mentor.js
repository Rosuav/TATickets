const mongoose = require('mongoose');

const mentorSchema = mongoose.Schema({
  name: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  },
  email: {
    type: String,
    required: true
  },
  slackUsername: {
    type: String
  },
  slackUserId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  notificationPreferences: [{
    channelId: {
      type: String,
      required: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    timeOfDay: {
      type: String,
      required: true,
      enum: ['morning', 'afternoon']
    }
  }]
});

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor;
