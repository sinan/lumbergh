## Lumbergh

An intentionally annoying, but highly useful, slack bot to replace daily meetings with your teammates.

It checks if everyone in a particular slack channel has entered their daily updates, if they haven't, it publicly shames them the next morning.

### Why

Daily meetings are mostly waste of everybody's time. This way you update your people when you have time rather than in a fixed schedule. Also, your teammates can see anytime what you're working on by just checking that #standups channel you specify.

Especially useful if your team has people from different timezones.

![screenshot](http://s.sinanyasar.com/170516_123548.png)

### Installation

I used env vars instead of a config file to avoid accidentally pushing slack api tokens.

```bash
$ SLACK_API_TOKEN = <YOUR-SLACK-API-TOKEN>
$ SLACK_CHANNEL = <YOUR-SLACK-CHANNEL-ID>
$ make dist
$ node lib/index.js
```

You can use `forever` or similar task runners to make it run in the background or restart when killed etc.

### Usage

Every day members in your daily meeting channel should write an update in following format:

```
Done:
 - Fixed #3521
 - talked to boss for an hour
 - meeting with John
Doing:
 - Fixing #3522
 - Investigating such and such issue
Blockers:
 - Life is hard
```

Lumbergh checks the messages written in the last 24 hours. If it doesn't find a message like the one shown above, it reminds the ones who didn't put their daily updates.

Also, you can slightly customize the looks by defining these additional env vars before running the bot.

```
$ SLACK_USERNAME = <CUSTOM-BOT-NAME>
$ EMOJI = <BOT-EMOJI-INSTEAD-OF-AVATAR>
$ AVATAR_URL = <CUSTOM-BOT-AVATAR-URL>
```

### License

MIT