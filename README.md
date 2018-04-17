# TATickets

## Slack Commands

### Commands for Students

#### `/ta-support`

Ask for help with the `/ta-support` command. Here are some examples:

* A session url and description of the issue are [recommended](https://gist.github.com/bookcasey/82959515f52b787286678c54f234474f) parameters. Order doesn't matter.

    > `/ta-support http://sessions.thinkful.com/casey We tried push our code to github with git push, we expected to see a confirmation, but we got an error message (which we Googled) but don't understand.`

* Cancel your support request with `remove` or `cancel`


    > `/ta-support cancel`

### Commands for Staff

#### `/ticket-next`

If you are a registered mentor, you can claim tickets from students with the `/ticket-next` command (without arguments). (Want to get registered? Ask Casey or Wences)

* Dequeue a ticket silently with `/ticket-next silent`

#### `/ticket-alerts`

If you are a registered mentor, you can sign up for notifications for the specific days and times (and channels, even multiple!) that you work. Support requests in your chosen time slots will mention you.

![TA Ticket with mentors' Slack handles appended](http://i63.tinypic.com/2u40xo5.png)

* Run the command with your days and `mornings` or `afternoons` (not optional), run this more than once, it's additive, to configure your week.


    > `/ticket-alerts monday wednesday fri afternoons`

    > `/ticket-alerts tue thu mornings`

    ![Representation of a calendar](http://i65.tinypic.com/xmitu0.png)


* Enable all `mornings` or `afternoons` with a shortcut:


    > `/ticket-alerts afternoons`

* Disable all notifications with `off`


    > `/ticket-alerts off`

* View your current notification by omitting a parameter or with `view`


    > `/ticket-alerts`

    > `/ticket-alerts view`

#### `/ticket-help`

* Without arguments, get a link to this readme!
* Get your slack [username](https://api.slack.com/changelog/2017-09-the-one-about-usernames) and id, or the channel id

      > `/ticket-help username`

      > `/ticket-help channel`


## Development

We would love to have you contribute! Fork the repo!

### Notes:

- The [Slacks Slash Command API](https://api.slack.com/slash-commands), and therefore parts of this app are not very RESTful. Slack can only makes `POST` requests in response to a command, and expects a `200` response, even if you want to show the user an error.

- The command keywords (like `/ta-support`) are only editable in the Slack App settings, and often the names differ from the routes they hit here.

### Requirements

  * NodeJS
  * MongoDB

### Get started

  * Clone the repo
  * Run `npm install`
  * Run `mongod` in another window
  * Run `npm test` in another window (everything green?)
  * Run `npm start` in another window to start the server

#### Local Development with Slack

You can get pretty far writing tests, the Slack API is relatively straightforward, but it's a good idea to test it out manually with a real Slack workspace

##### Requirements

  * A Slack workspace and app that you control (I set one up exclusively for testing Slack Apps)
  * [ngrok](https://api.slack.com/tutorials/tunneling-with-ngrok) for tunneling

##### Get started
  * Create an `.env` file with `SLACK_VERIFICATION_TOKEN=yourSlackVerificationTokenHere`
  * Start the server, `npm start`
  * Run `ngrok http 8080` in another window
  * Create Slack commands through Slack's website with the url that ngrok gives you, for example:
    * Command: `/ta-support`
    * Request URL: `http://12345678.ngrok.io/support`
