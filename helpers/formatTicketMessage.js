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

module.exports = formatTicketMessage;
