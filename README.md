# TATickets

## Slack Commands

### `/ta-support`

Ask for help with the `/ta-support` command. Here are some examples:

* A session url and description of the issue are [recommended](https://gist.github.com/bookcasey/82959515f52b787286678c54f234474f) parameters. Order doesn't matter.

    > `/ta-support http://sessions.thinkful.com/casey We tried push our code to github with git push, we expected to see a confirmation, but we got an error message (which we Googled) but don't understand.`

* Cancel your support request with `remove` or `cancel`


    > `/ta-support cancel`

### `/ticket-next`

If you are a registered mentor, you can claim tickets from students with the `/ticket-next` command. No arguments. (Want to get registered? Ask Casey or Wences)

### `/ticket-alerts`

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


## Notes for development:

- Slacks Slash Command API, and therefore parts of this app are not very RESTful. Slack can only makes `POST` requests in response to a command, and expects a `200` response, even if you want to show the user an error.

- The command keywords (`/ta-support`) are only editable in the Slack App settings, and often the names differ from the routes they hit here.
