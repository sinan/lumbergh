const _ = require('lodash')
const async = require('async')
const Botkit = require('botkit')
const moment = require('moment')
const { CronJob } = require('cron')

let {
  SLACK_API_TOKEN,
  SLACK_CHANNEL,
  SLACK_USERNAME,
  EMOJI,
  AVATAR_URL,
} = process.env
let DEFAULT_AVATAR =
  'https://s3-us-west-2.amazonaws.com/slack-files2/' +
  'bot_icons/2016-12-05/112583982146_48.png'

let BOT = null
let CHANNEL_MEMBERS = []

if (!SLACK_API_TOKEN) {
  console.log('Error: missing $SLACK_API_TOKEN env var.')
  process.exit(1)
}

if (!SLACK_CHANNEL) {
  console.log('Error: missing $SLACK_CHANNEL env var.')
  process.exit(1)
}

let start = () => {
  let controller = Botkit.slackbot({ debug: false })
  return (BOT = controller.spawn({ token: SLACK_API_TOKEN }).startRTM(err => {
    if (err) {
      return console.log(err)
    }

    return BOT.api.channels.info(
      { channel: SLACK_CHANNEL },
      (err, { channel }) => {
        let oldest
        if (err) {
          return console.log(err)
        }

        CHANNEL_MEMBERS = channel.members

        if (moment().day() === 1) {
          oldest = moment().subtract(3, 'days').format('X')
        } else {
          oldest = moment().subtract(1, 'days').format('X')
        }

        return BOT.api.channels.history(
          {
            channel: SLACK_CHANNEL,
            oldest,
          },
          (err, { messages }) => {
            if (err) {
              return console.log(err)
            }

            console.log(messages[0].ts)

            let updates = []
            let activeMembers = []
            let inactiveMembers = []

            let pushUpdate = message => {
              updates.push({
                name: message.user,
                message: message.text,
                timestamp: message.ts,
              })
              return activeMembers.push(message.user)
            }

            _.remove(
              messages,
              message =>
                !Array.from(CHANNEL_MEMBERS).includes(message.user) ||
                !/done|doing|blocker/i.test(message.text)
            )

            messages.forEach(pushUpdate)
            updates.sort((a, b) => a.timestamp > b.timestamp)

            inactiveMembers = _.difference(CHANNEL_MEMBERS, activeMembers)

            let queue = inactiveMembers.slice().map(id => fn =>
              BOT.api.users.info({ user: id }, (err, { user }) => {
                if (err) {
                  return fn(err)
                }
                if (user.deleted || user.is_bot) {
                  _.pull(inactiveMembers, user.id)
                }
                return fn()
              })
            )

            let message = !inactiveMembers.length
              ? "That's good everyone, IMPRESSIVE!"
              : 'Yeah, if everyone entered their updates daily,' +
                  " THAT'D BE GREAT."

            return async.parallel(queue, (err, results) => {
              if (err) {
                console.log(err)
              }
              let text = message
              channel = SLACK_CHANNEL
              channel = 'C3B6KA92S'
              let color = '#F2778A'
              let attachments = inactiveMembers.map(id => ({
                text: `<@${id}>`,
                color,
              }))

              return sendMessage(
                { channel, text, attachments },
                BOT.destroy.bind(BOT)
              )
            })
          }
        )
      }
    )
  }))
}

const sendMessage = ({ channel, text, attachments }, callback) => {
  BOT.api.chat.postMessage(
    {
      username: SLACK_USERNAME || 'lumbergh',
      icon_url: AVATAR_URL || DEFAULT_AVATAR,
      icon_emoji: EMOJI,
      as_user: false,
      attachments,
      channel,
      text,
    },
    callback
  )
}

let job = new CronJob({
  cronTime: '00 15 10 * * 1-5',
  onTick: () => {
    /*
    * Runs every weekday (Monday through Friday)
    * at 10:15:00 AM. It does not run on Saturday
    * or Sunday.
    */
    let timestamp = moment().format('dddd, MMMM Do YYYY, h:mm:ss a')
    console.log(`Cron fires: ${timestamp}`)
    return start()
  },
  start: false,
  timeZone: 'America/Los_Angeles',
})
job.start()
