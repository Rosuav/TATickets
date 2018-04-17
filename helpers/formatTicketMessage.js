const formatTicketMessage = ({user_id, issue, session, mentors = [], response_type='in_channel'}) => {
  const postIssue = issue
    ? `issued: ${issue[issue.length - 1] === '.'
      ? issue
      : `${issue}.`} In ${session}`
    : `required a mentor in ${session}`;

  const mentorUsernames = mentors.map(mentor => `<@${mentor}>`).join(' ');

  let slackResponse = {
    response_type: response_type,
    'attachments': [{
      'title': response_type === 'in_channel' ? 'TA Support Request' : undefined,
      title: `<@${user_id}> issued:`,
      'fallback': `<@${user_id}> ${postIssue} ${mentorUsernames}`,
      'text': issue || '...',
      'fields': [{
        'value': session,
      }],
      footer: mentors && mentors.length > 0 ? ':bell: ' + mentorUsernames : undefined
    }]
  };

  return slackResponse;
};

module.exports = formatTicketMessage;
