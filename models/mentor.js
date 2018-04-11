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
		type: String,
    required: true,
    unique: true
	},
	isActive: {
		type: Boolean,
		required: true,
		default: true
	}
});

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor;
