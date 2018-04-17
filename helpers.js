var AsciiTable = require('ascii-table');
const { SLACK_VERIFICATION_TOKEN } = require('./config');


const parseTextToNotiPrefs = (_text, channelId) => {
  const generateDay = (day, timeOfDay) => ({
    channelId: channelId,
    dayOfWeek: day,
    timeOfDay
  });

  const text = _text.toLowerCase();
  // fixed keyword commands
  const keywords = {
    'mornings': [1,2,3,4,5].map(day => generateDay(day, 'morning')),
    'afternoons': [1,2,3,4,5].map(day => generateDay(day, 'afternoon')),
  };

  if (text in keywords) {
    return keywords[text];
  }

  const dayNames = {
    'mon': 1,
    'tue': 2,
    'wed': 3,
    'thu': 4,
    'fri': 5,
  };

  let days = [];

  if (!text.includes('morning') && !text.includes('afternoon'))
    throw 'Sorry, I don\'t understand what you mean.';

  // TODO: make this more efficient and flexible
  Object.keys(dayNames).forEach(dayName => {
    if(text.includes(dayName)) {
      days.push(
        generateDay(dayNames[dayName],
          text.includes('morning') && 'morning' || text.includes('afternoon') && 'afternoon'
        )
      );
    }
  });

  return days;
};

const renderCalendar = days => {
  let mornings = ['Morning', '', '', '', '', ''];
  let afternoons = ['Afternoon', '', '', '', '', ''];

  days.forEach((day, i) => {
    if(day.timeOfDay === 'morning') mornings[day.dayOfWeek] = 'X';
    if(day.timeOfDay === 'afternoon') afternoons[day.dayOfWeek] = 'X';
  });

  let table = new AsciiTable('Your Schedule')
    .setHeading('','Mon', 'Tue', 'Wed', 'Thu', 'Fri')
    .addRow(mornings)
    .addRow(afternoons);

  return table;
};

const formatTicketMessage = ({user_name, issue, session, mentors = [], response_type='in_channel'}) => {
  const postIssue = issue
    ? `issued: ${issue[issue.length - 1] === '.'
      ? issue
      : `${issue}.`} In ${session}`
    : `required a mentor in ${session}`;

  const mentorUsernames = mentors.map(mentor => `<@${mentor}>`).join(' ');

  let slackResponse = {
    response_type: response_type,
    'attachments': [{
      // "author_name": `<@${user_name}> issued:`,
      'title': response_type === 'in_channel' ? 'TA Support Request' : undefined,
      // title: 'TA Support Request',
      title: `<@${user_name}> issued:`,
      'fallback': `<@${user_name}> ${postIssue} ${mentorUsernames}`,
      'text': issue || '...',
      // "color": response_type === 'in_channel' ? "warning" : undefined,
      'fields': [{
        'value': session,
      }],
      // "footer": `Issued by: <@${user_name}>`,
      footer: mentors && mentors.length > 0 ? ':bell: ' + mentorUsernames : undefined
    }]
  };

  // if(mentors && mentors.length > 0) {
  //   // slackResponse.attachments[0].fields.push({
  //   slackResponse.footer.push({
  //     value: mentorUsernames,
  //   })
  // }

  return slackResponse;
};

const vertificationTokenAuth = (req, res, next) => {
  const { token } = req.body;
  if(token !== SLACK_VERIFICATION_TOKEN) throw 'Unauthorized';
  next();
};

module.exports = {
  parseTextToNotiPrefs,
  formatTicketMessage,
  renderCalendar,
  vertificationTokenAuth
};
