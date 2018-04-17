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

module.exports = parseTextToNotiPrefs;
