import React, {useState} from "react";
import GlobalBindings, {log} from "../../utils";
import compareUsers from "../../utils/compareUsers";
import openContextMenu from "../../utils/openContextMenu";
import getTimeString from "../../utils/getTimeString";
import newChannel from "../../utils/newChannel";
import _newUser from "../../utils/newUser";
// @ts-ignore
// import audioContext from 'audio-context'
const audioContext = require('audio-context')
const BufferQueueNode = require('web-audio-buffer-queue')

const ConnectDialog = (props: any) => {
  const [inputs, setInputs] = useState({
    address: `voice.disomnis.com`,
    port: '443/demo',
    username: '',
    password: ''
  })

  const hideDialog = () => {
    props.onHide(!props.hide)
  }

  function connectToServer(ui: GlobalBindings) {
    if (ui.detectWebRTC) {
      ui.webrtc = false
    }
    connect(window.mumbleUi.connectDialog.username,
      window.mumbleUi.connectDialog.address,
      window.mumbleUi.connectDialog.port,
      window.mumbleUi.connectDialog.tokens,
      window.mumbleUi.connectDialog.password,
      window.mumbleUi.connectDialog.channelName,
      props.setMessages,
      props.messages,
      props.channels,
      props.setChannels,
      props.users,
      props.setUsers
      )
  }

  const {address, port, username, password} = inputs
  const handleChange = (event: any) => {
    const {name, value} = event.target
    setInputs({
      ...inputs,
      [name]: value
    })
  }

  const handleSubmit = (event: any) => {
    window.mumbleUi.connectDialog.address = address
    window.mumbleUi.connectDialog.port = port
    window.mumbleUi.connectDialog.username = username
    window.mumbleUi.connectDialog.password = password
    connectToServer(window.mumbleUi)
    hideDialog()
    event.preventDefault()
  }

  return (
    <>
      {props.hide
        ? <></>
        : <div className="connect-dialog dialog">
          <div id="connect-dialog_title" className="dialog-header">
            Connect to Server
          </div>
          <form onSubmit={handleSubmit}>
            <table>
              <tbody>
              <tr /*data-bind="if: $root.config.connectDialog.address"*/>
                <td id="connect-dialog_input_address">Address</td>
                <td><input name="address" id="address" type="text" value={address}
                           onChange={handleChange}
                /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.port"*/>
                <td id="connect-dialog_input_port">Port</td>
                <td><input name="port" id="port" type="text" value={port} onChange={handleChange}
                /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.username"*/>
                <td id="connect-dialog_input_username">Username</td>
                <td><input name="username" id="username" type="text" value={username}
                           onChange={handleChange}
                /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.password"*/>
                <td id="connect-dialog_input_password">Password</td>
                <td><input name="password" id="password" type="text" value={password}
                           onChange={handleChange}/></td>
              </tr>
              </tbody>
            </table>
            <div className="dialog-footer">
              <input id="connect-dialog_controls_cancel" className="dialog-close" type="button"
                     onClick={hideDialog} value="Cancel"/>
              {/*<button className="dialog-close" >Cancel</button>*/}
              <input id="connect-dialog_controls_connect" className="dialog-submit" type="submit" value="Connect"/>
            </div>
          </form>
        </div>
      }
    </>
  )
}

const connect = (username: string, host: string, port: string, tokens: string[], password: string, channelName: string, setMessages:any,messages:any,channels:any,setChannels:any,users:any,setUsers:any) => {
  console.log(window.mumbleUi.webrtc)
  let connectLink = port === '443/demo' ? `wss://${host}/demo` : `wss://${host}:${port}`

  setMessages(messages => [messages, {
    type: `generic`,
    time: getTimeString(),
    message: `Connecting to ${host}`
  }])

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
  window.mumbleUi.fallbackConnector.connect(connectLink, {
    username: username,
    password: password,
    // webrtc: window.mumbleUi.webrtc ? {
    //   enabled: true,
    //   required: true,
    //   mic: window.mumbleUi._delayedMicNode.stream,
    //   audioContext: ctx
    // } : {
    //   enabled: false,
    // },
    tokens: tokens
  }).done((client: any) => {
    log(['logentry.connected'])
    setMessages(messages => [...messages, {type: `generic`, time: getTimeString(), message: `Connected!`}])
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
      newChannel(channel,channels,setChannels)
      if (channelPath === channelName) {
        client.this.setChannel(channel)
      }
      channel.children.forEach((ch: { name: string }) => registerChannel(ch, channelPath + "/" + ch.name))
    }
    registerChannel(client.root, "")
    // Register all users
    client.users.forEach((user: any) => {
      _newUser(user)
      setUsers(users => [...users,user])
    })
    // Register future channels
    client.on('newChannel', (channel: any) => window.mumbleUi.newChannel(channel))
    // Register future users
    // client.on('newUser', (user: any) => {
    //   _newUser(user)
    //   setUsers(users => [...users,user])
    // })

    // Handle messages
    client.on('message', (sender: any, message: any, channels: string | any[]) => {
      sender = sender || {__ui: 'Server'}
      const messageChunk = {
        time: getTimeString(),
        type: 'chat-message',
        user: sender.__ui.name,
        channel: channels.length > 0,
        message: message
      }

      setMessages(messages => [...messages, messageChunk])

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
      setMessages(messages.concat(messageChunk))
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
      setMessages(messages.concat(messageChunk))
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
      const messageChunk = {
        type: 'error-message',
        message: `logentry.connection_fallback_mode`
      }
      setMessages(messages.concat(messageChunk))
      window.mumbleUi.webrtc = false
      window.mumbleUi.connect(username, host, port, tokens, password, channelName)
    } else {
      const messageChunk = {
        type: 'error-message',
        message: `logentry.connection_error`
      }
      setMessages(messages.concat(messageChunk))
      log(['logentry.connection_error', err])
    }
  })
}


export default ConnectDialog