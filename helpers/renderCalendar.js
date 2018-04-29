var AsciiTable = require('ascii-table');

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

module.exports = renderCalendar;
