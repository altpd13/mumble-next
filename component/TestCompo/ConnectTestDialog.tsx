import React, {useEffect, useReducer, useState} from 'react'
import GlobalBindings, {log} from "../../utils";

const audioContext = require('audio-context')

export default function ConnectTestDialog(props: any) {

  const connect = (username: string, host: string, port: string, tokens: string[], password: string, channelName: string) => {

    let connectLink = port === '433/demo' ? `wss://${host}/demo` : `wss://${host}:${port}`

    props.setMessages(messages => [messages,{message:`Connecting to ${host}`}])

    log(['logentry.connecting', host])

    // Note: This call needs to be delayed until the user has interacted with
    // the page in some way (which at self point they have), see: https://goo.gl/7K7WLu

    let ctx = audioContext()
    if (!window.mumbleUi.webrtc) {
      window.mumbleUi.fallbackConnector.setSampleRate(ctx.sampleRate)
    }
    if (!window.mumbleUi._delayedMicNode) {
      window.mumbleUi._micNode = ctx.createMediaStreamSource(window.mumbleUi._micStream)
      window.mumbleUi._delayNode = ctx.createDelay()
      // @ts-ignore
      window.mumbleUi._delayNode.delayTime.value = 0.15
      window.mumbleUi._delayedMicNode = ctx.createMediaStreamDestination()
    }

    // TODO: token
    (window.mumbleUi.webrtc ? window.mumbleUi.webrtcConnector : window.mumbleUi.fallbackConnector).connect(connectLink, {
      username: username,
      password: password,
      webrtc: window.mumbleUi.webrtc ? {
        enabled: true,
        required: true,
        mic: window.mumbleUi._delayedMicNode.stream,
        audioContext: ctx
      } : {
        enabled: false,
      },
      tokens: tokens
    }).done((client: any) => {
      log(['logentry.connected'])
      props.setMessages(messages => [...messages,{message:`Connected!`}])
      window.mumbleUi.client = client
      // Prepare for connection errors
      if (client === undefined) {
        console.log('No Client Found')
      } else {
        client.on('error', (err: any) => {
          log(['logentry.connection_error', err])
          window.mumbleUi.resetClient()
        })
      }
      // Make sure we stay open if we're running as Matrix widget
      window.matrixWidget.setAlwaysOnScreen(true)

      // Register all channels, recursively
      if (channelName.indexOf("/") != 0) {
        channelName = "/" + channelName;
      }

      const registerChannel = (channel: any, channelPath: string) => {
        window.mumbleUi.newChannel(channel)
        if (channelPath === channelName) {
          client.window.mumbleUi.setChannel(channel)
        }
        channel.children.forEach((ch: { name: string }) => registerChannel(ch, channelPath + "/" + ch.name))
      }
      registerChannel(client.root, "")

      // Register all users
      client.users.forEach((user: any) => window.mumbleUi._newUser(user))

      // Register future channels
      client.on('newChannel', (channel: any) => window.mumbleUi.newChannel(channel))
      // Register future users
      client.on('newUser', (user: any) => window.mumbleUi._newUser(user))

      // Handle messages
      client.on('message', (sender: any, message: any, channels: string | any[]) => {
        sender = sender || {__ui: 'Server'}
        const messageChunk = {
          type: 'chat-message',
          user: sender.__ui,
          channel: channels.length > 0,
          message: message
        }
        props.setMessages(messages => [...messages,messageChunk])
        window.mumbleUi.log.push({
          type: 'chat-message',
          user: sender.__ui,
          channel: channels.length > 0,
          message: message
        })
      })

      // Log permission denied error messages
      client.on('denied', (type: string) => {
        const messageChunk = {
          type: 'generic',
          value: 'Permission denied : ' + type
        }
        window.mumbleUi.log.push({
          type: 'generic',
          value: 'Permission denied : ' + type
        })
        props.setMessages(props.messages.concat(messageChunk))
      })

      // Set own user and root channel
      window.mumbleUi.selfUser = client.self.__ui
      window.mumbleUi.root = client.root.__ui
      // Upate linked channels
      window.mumbleUi.updateLinks()
      // Log welcome message
      if (client.welcomeMessage) {
        const messageChunk = {
          type: 'welcome-message',
          message: client.welcomeMessage
        }
        props.setMessages(props.messages.concat(messageChunk))
        window.mumbleUi.log.push({
          type: 'welcome-message',
          message: client.welcomeMessage
        })
      }

      // Startup audio input processing
      window.mumbleUi.updateVoiceHandler()
      // Tell server our mute/deaf state (if necessary)
      if (window.mumbleUi.selfDeaf) {
        window.mumbleUi.client.setSelfDeaf(true)
      } else if (window.mumbleUi.selfMute) {
        window.mumbleUi.client.setSelfMute(true)
      }
    return client
    }, (err: any) => {
      if (err.$type && err.$type.name === 'Reject') {
        window.mumbleUi.connectErrorDialog.type = err.type
        window.mumbleUi.connectErrorDialog.reason = err.reason
        window.mumbleUi.connectErrorDialog.show()
      } else if (err === 'server_does_not_support_webrtc' && window.mumbleUi.detectWebRTC && window.mumbleUi.webrtc) {
        log(['logentry.connection_fallback_mode'])
        window.mumbleUi.webrtc = false
        window.mumbleUi.connect(username, host, port, tokens, password, channelName)
      } else {
        log(['logentry.connection_error', err])
      }
    })
  }

  function connectToServer(ui: GlobalBindings) {
    if (ui.detectWebRTC) {
      ui.webrtc = true
    }
    connect(window.mumbleUi.connectDialog.username, window.mumbleUi.connectDialog.address, window.mumbleUi.connectDialog.port, window.mumbleUi.connectDialog.tokens, window.mumbleUi.connectDialog.password, window.mumbleUi.connectDialog.channelName)
  }

  const clickMe = () => {
    window.mumbleUi.connectDialog.address = 'voice.johni0702.de'
    window.mumbleUi.connectDialog.port = '433/demo'
    window.mumbleUi.connectDialog.username = 'alt'
    connectToServer(window.mumbleUi)
  }

  return (
    <div>
      <button onClick={()=>{
        clickMe()
      }}>
        Connect
      </button>
    </div>
  )
}
