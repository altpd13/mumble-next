import React from 'react'
import {log} from "../../utils";
import WorkerBasedMumbleConnector from "../../workers/worker-client";
const audioContext = require('audio-context')

export default class ConnectTestDialog extends React.Component<any, any> {

  clickMe() {
    window.mumbleUi.connectDialog.address = 'voice.johni0702.de'
    window.mumbleUi.connectDialog.port = '433/demo'
    window.mumbleUi.connectDialog.username = 'alt'
    window.mumbleUi.connectDialog.connect(window.mumbleUi)
  }
  render() {
    return (
      <button onClick={this.clickMe}>
        Connect
      </button>
    )
  }
}

// function connect(username: string, host: string, port: string, tokens: string[], password: string, channelName: string) {
//   let webrtc = true
//   const fallbackConnector = new WorkerBasedMumbleConnector()
//
//   let connectLink  = port === '433/demo' ? `wss://${host}/demo` : `wss://${host}:${port}`
//   log(['logentry.connecting', host])
//
//   // Note: This call needs to be delayed until the user has interacted with
//   // the page in some way (which at self point they have), see: https://goo.gl/7K7WLu
//
//   // this.connector.setSampleRate(audioContext().sampleRate)
//
//   let ctx = audioContext()
//   if (!webrtc) {
//     fallbackConnector.setSampleRate(ctx.sampleRate)
//   }
//   if (!this._delayedMicNode) {
//     this._micNode = ctx.createMediaStreamSource(this._micStream)
//     this._delayNode = ctx.createDelay()
//     // @ts-ignore
//     this._delayNode.delayTime.value = 0.15
//     this._delayedMicNode = ctx.createMediaStreamDestination()
//   }
//
//   // TODO: token
//   (this.webrtc ? this.webrtcConnector : this.fallbackConnector).connect(connectLink, {
//     username: username,
//     password: password,
//     webrtc: this.webrtc ? {
//       enabled: true,
//       required: true,
//       mic: this._delayedMicNode.stream,
//       audioContext: ctx
//     } : {
//       enabled: false,
//     },
//     tokens: tokens
//   }).done((client: any) => {
//     log(['logentry.connected'])
//     this.client = client
//     // Prepare for connection errors
//     if (client === undefined) {
//       console.log('No Client Found')
//     } else {
//       client.on('error', (err: any) => {
//         log(['logentry.connection_error', err])
//         this.resetClient()
//       })
//     }
//     // Make sure we stay open if we're running as Matrix widget
//     window.matrixWidget.setAlwaysOnScreen(true)
//
//     // Register all channels, recursively
//     if (channelName.indexOf("/") != 0) {
//       channelName = "/" + channelName;
//     }
//
//     const registerChannel = (channel: any, channelPath: string) => {
//       this.newChannel(channel)
//       if (channelPath === channelName) {
//         client.this.setChannel(channel)
//       }
//       channel.children.forEach((ch: { name: string }) => registerChannel(ch, channelPath + "/" + ch.name))
//     }
//     registerChannel(client.root, "")
//
//     // Register all users
//     client.users.forEach((user: any) => this._newUser(user))
//
//     // Register future channels
//     client.on('newChannel', (channel: any) => this.newChannel(channel))
//     // Register future users
//     client.on('newUser', (user: any) => this._newUser(user))
//
//     // Handle messages
//     client.on('message', (sender: any, message: any, channels: string | any[]) => {
//       console.log(sender)
//       console.log(`Sender: ${sender} Message: ${message} Channels: ${channels}`)
//       sender = sender || {__ui: 'Server'}
//       this.log.push({
//         type: 'chat-message',
//         user: sender.__ui,
//         channel: channels.length > 0,
//         message: message
//       })
//     })
//
//     // Log permission denied error messages
//     client.on('denied', (type: string) => {
//       this.log.push({
//         type: 'generic',
//         value: 'Permission denied : ' + type
//       })
//     })
//
//     // Set own user and root channel
//     this.selfUser = client.self.__ui
//     this.root = client.root.__ui
//     // Upate linked channels
//     this.updateLinks()
//     // Log welcome message
//     if (client.welcomeMessage) {
//       this.log.push({
//         type: 'welcome-message',
//         message: client.welcomeMessage
//       })
//     }
//
//     // Startup audio input processing
//     this.updateVoiceHandler()
//     // Tell server our mute/deaf state (if necessary)
//     if (this.selfDeaf) {
//       this.client.setSelfDeaf(true)
//     } else if (this.selfMute) {
//       this.client.setSelfMute(true)
//     }
//   }, (err: any) => {
//     if (err.$type && err.$type.name === 'Reject') {
//       this.connectErrorDialog.type = err.type
//       this.connectErrorDialog.reason = err.reason
//       this.connectErrorDialog.show()
//     } else if (err === 'server_does_not_support_webrtc' && this.detectWebRTC && this.webrtc) {
//       log(['logentry.connection_fallback_mode'])
//       this.webrtc = false
//       this.connect(username, host, port, tokens, password, channelName)
//     } else {
//       log(['logentry.connection_error', err])
//     }
//   })
// }