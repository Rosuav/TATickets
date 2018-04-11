const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
  owlSession: {
    type: String,
    required: true
  },
  issue: {
    type: String
  },
  by: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  mentor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Mentor'
	},
	review: {
		type: String
	},
  colors: [
    {
      student: {type: String },
      color: {type: String}
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  },
  attended_at: {
    type: Date
  },
  reviewed_at: {
    type: Date
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
