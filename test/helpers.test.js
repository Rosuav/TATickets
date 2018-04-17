const chai = require('chai');

const { parseTextToNotiPrefs, formatTicketMessage } = require('../helpers');

const expect = chai.expect;

describe('Helper functions', function() {
  describe('parseTextToNotificationPreferences()', function() {
    it('should parse the shorthand command \'mornings\'', function() {
      expect(parseTextToNotiPrefs('mornings', '123')).to.deep.equal(
        [1,2,3,4,5].map(day => ({
          channelId: '123',
          dayOfWeek: day,
          timeOfDay: 'morning'
        }))
      );
    });
    it('should parse the shorthand command \'Afternoons\'', function() {
      expect(parseTextToNotiPrefs('Afternoons', '123')).to.deep.equal(
        [1,2,3,4,5].map(day => ({
          channelId: '123',
          dayOfWeek: day,
          timeOfDay: 'afternoon'
        }))
      );
    });
    it('should parse \'monday and wed mornings\'', function() {
      expect(parseTextToNotiPrefs('monday and wednesday mornings', '123')).to.deep.equal(
        [1,3].map(day => ({
          channelId: '123',
          dayOfWeek: day,
          timeOfDay: 'morning'
        }))
      );
    });
    it('should parse \'mon tues friday afternoons\'', function() {
      expect(parseTextToNotiPrefs('monday tuesday friday afternoons', '123')).to.deep.equal(
        [1,2,5].map(day => ({
          channelId: '123',
          dayOfWeek: day,
          timeOfDay: 'afternoon'
        }))
      );
    });
    it('should parse  \'tuesday friday\'');
    it('should parse  \'monday tuesday afternoons and monday mornings\'');
    it('should parse  \'monday afternoons and friday mornings\'');
  });

  describe('parseTextToNotificationPreferences()', function() {
    it('should build response for slack', function() {
      expect(formatTicketMessage({
        user_id: 'UJS1000',
        issue: 'We are having too much fun',
        session: 'https://sessions.thinkful.com/fun',
        mentors: ['UMENTOR1', 'UMENTOR2']
      })).to.deep.equal({
        'response_type': 'in_channel',
        'attachments': [
          {
            'fallback': '<@UJS1000> issued: We are having too much fun. In https://sessions.thinkful.com/fun <@UMENTOR1> <@UMENTOR2>',
            'title': '<@UJS1000> issued:',
            'text': 'We are having too much fun',
            'fields': [
              {
                'value': 'https://sessions.thinkful.com/fun'
              },
            ],
            'footer': ':bell: <@UMENTOR1> <@UMENTOR2>',
          }
        ]
      });
    });
    it('should not display notification field if there are none', function() {
      expect(formatTicketMessage({
        user_id: 'UJS1000',
        issue: 'We are having too much fun',
        session: 'https://sessions.thinkful.com/fun',
        mentors: [],
      }).attachments[0].fields.length).to.equal(1);
      expect(formatTicketMessage({
        user_id: 'UJS1000',
        issue: 'We are having too much fun',
        session: 'https://sessions.thinkful.com/fun',
      }).attachments[0].fields.length).to.equal(1);
    });
    it('should be able to make ephemeral responses', function() {
      expect(formatTicketMessage({
        user_id: 'UJS1000',
        issue: 'We are having too much fun',
        session: 'https://sessions.thinkful.com/fun',
        response_type: 'ephemeral'
      }).response_type).to.equal('ephemeral');
    });
    it('should be able display different colors');
  });
  describe('renderCalendar()', function() {
    it('can render calendar');
  });
});
