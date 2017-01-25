_       = require 'lodash'
async   = require 'async'
Botkit  = require 'botkit'
moment  = require 'moment'
CronJob = require('cron').CronJob

SLACK_API_TOKEN = process.env.SLACK_API_TOKEN
SLACK_CHANNEL   = process.env.SLACK_CHANNEL
SLACK_USERNAME  = process.env.SLACK_USERNAME
EMOJI           = process.env.EMOJI
AVATAR_URL      = process.env.AVATAR_URL
DEFAULT_AVATAR  = 'https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2016-12-05/112583982146_48.png'

BOT             = null
CHANNEL_MEMBERS = []

unless SLACK_API_TOKEN
  console.log 'Error: Specify token in environment!'
  process.exit 1

unless SLACK_CHANNEL
  console.log 'Error: Specify standups channel!'
  process.exit 1

start = ->
  controller = Botkit.slackbot { debug: no }
  BOT = controller.spawn({ token: SLACK_API_TOKEN }).startRTM (err) ->
    return console.log err  if err

    BOT.api.channels.info
      channel : SLACK_CHANNEL
    , (err, { channel }) ->
      return console.log err  if err

      CHANNEL_MEMBERS = channel.members

      if moment().day() is 1
      then retro = -3
      else retro = -1

      BOT.api.channels.history
        channel : SLACK_CHANNEL
        oldest  : moment().day(retro).format('X')
      , (err, { messages }) ->

        return console.log err  if err

        updates         = []
        activeMembers   = []
        inactiveMembers = []

        pushUpdate = (message) ->
          updates.push
            name      : message.user
            message   : message.text
            timestamp : message.ts
          activeMembers.push message.user

        _.remove messages, (message) ->
          message.user not in CHANNEL_MEMBERS or not /done|doing|blocker/i.test message.text

        messages.forEach pushUpdate
        updates.sort (a, b) -> a.timestamp > b.timestamp

        inactiveMembers = _.difference CHANNEL_MEMBERS, activeMembers

        queue = inactiveMembers.slice().map (id) -> (fn) ->
          BOT.api.users.info { user: id }, (err, {user}) ->
            return fn err  if err
            if user.deleted or user.is_bot
              _.pull inactiveMembers, user.id
            do fn

        message = unless inactiveMembers.length
        then "That's good everyone, IMPRESSIVE!"
        else "Yeah, if everyone entered their updates daily, THAT'D BE GREAT."

        async.parallel queue, (err, results) ->
          text        = message
          channel     = SLACK_CHANNEL
          color       = "#F2778A"
          attachments = inactiveMembers.map (id) -> { text: "<@#{id}>", color }

          sendMessage { channel, text, attachments }, BOT.destroy.bind BOT


sendMessage = ({channel, text, attachments}, callback) ->
  BOT.api.chat.postMessage {
    username   : SLACK_USERNAME   or 'lumbergh'
    icon_url   : AVATAR_URL       or DEFAULT_AVATAR
    icon_emoji : EMOJI            if EMOJI
    as_user    : no
    attachments
    channel
    text
  }, callback


console.log 'Cron started.'
# new CronJob '00,10,20,30,40,50 * * * * *', ->
new CronJob '00 15 10 * * 1-5', ->
  console.log "Cron fires: #{moment().format 'dddd, MMMM Do YYYY, h:mm:ss a'}"
  start()
, null, true, 'America/Los_Angeles'
