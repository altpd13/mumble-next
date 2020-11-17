import Head from 'next/head'
import '../styles/MetroMumbleDark/main.scss'
import '../styles/MetroMumbleDark/loading.scss'
import React from 'react'

class GlobalBindings {
  constructor (config) {
    this.config = config
    this.settings = new Settings(config.settings)
    this.connector = new WorkerBasedMumbleConnector()
    this.client = null
    this.userContextMenu = new ContextMenu()
    this.channelContextMenu = new ContextMenu()
    this.connectDialog = new ConnectDialog()
    this.connectErrorDialog = new ConnectErrorDialog(this.connectDialog)
    this.connectionInfo = new ConnectionInfo(this)
    this.commentDialog = new CommentDialog()
    this.settingsDialog = ko.observable()
    this.minimalView = ko.observable(false)
    this.log = ko.observableArray()
    this.remoteHost = ko.observable()
    this.remotePort = ko.observable()
    this.thisUser = ko.observable()
    this.root = ko.observable()
    this.avatarView = ko.observable()
    this.messageBox = ko.observable('')
    this.toolbarHorizontal = ko.observable(!this.settings.toolbarVertical)
    this.selected = ko.observable()
    this.selfMute = ko.observable()
    this.selfDeaf = ko.observable()

    this.selfMute.subscribe(mute => {
      if (voiceHandler) {
        voiceHandler.setMute(mute)
      }
    })

    this.toggleToolbarOrientation = () => {
      this.toolbarHorizontal(!this.toolbarHorizontal())
      this.settings.toolbarVertical = !this.toolbarHorizontal()
      this.settings.save()
    }

    this.select = element => {
      this.selected(element)
    }

    this.openSettings = () => {
      this.settingsDialog(new SettingsDialog(this.settings))
    }

    this.applySettings = () => {
      const settingsDialog = this.settingsDialog()

      settingsDialog.applyTo(this.settings)

      this._updateVoiceHandler()

      this.settings.save()
      this.closeSettings()
    }

    this.closeSettings = () => {
      if (this.settingsDialog()) {
        this.settingsDialog().end()
      }
      this.settingsDialog(null)
    }

    this.getTimeString = () => {
      return '[' + new Date().toLocaleTimeString('en-US') + ']'
    }

    this.connect = (username, host, port, tokens = [], password, channelName = "") => {
      this.resetClient()

      this.remoteHost(host)
      this.remotePort(port)

      log(translate('logentry.connecting'), host)

      // Note: This call needs to be delayed until the user has interacted with
      // the page in some way (which at this point they have), see: https://goo.gl/7K7WLu
      this.connector.setSampleRate(audioContext().sampleRate)

      // TODO: token
      this.connector.connect(`wss://${host}:${port}`, {
        username: username,
        password: password,
        tokens: tokens
      }).done(client => {
        log(translate('logentry.connected'))

        this.client = client
        // Prepare for connection errors
        client.on('error', (err) => {
          log(translate('logentry.connection_error'), err)
          this.resetClient()
        })

        // Make sure we stay open if we're running as Matrix widget
        window.matrixWidget.setAlwaysOnScreen(true)

        // Register all channels, recursively
        if(channelName.indexOf("/") != 0) {
          channelName = "/"+channelName;
        }
        const registerChannel = (channel, channelPath) => {
          this._newChannel(channel)
          if(channelPath === channelName) {
            client.self.setChannel(channel)
          }
          channel.children.forEach(ch => registerChannel(ch, channelPath+"/"+ch.name))
        }
        registerChannel(client.root, "")

        // Register all users
        client.users.forEach(user => this._newUser(user))

        // Register future channels
        client.on('newChannel', channel => this._newChannel(channel))
        // Register future users
        client.on('newUser', user => this._newUser(user))

        // Handle messages
        client.on('message', (sender, message, users, channels, trees) => {
          sender = sender || { __ui: 'Server' }
          ui.log.push({
            type: 'chat-message',
            user: sender.__ui,
            channel: channels.length > 0,
            message: sanitize(message)
          })
        })

        // Log permission denied error messages
        client.on('denied', (type) => {
          ui.log.push({
            type: 'generic',
            value: 'Permission denied : '+ type
          })
        })

        // Set own user and root channel
        this.thisUser(client.self.__ui)
        this.root(client.root.__ui)
        // Upate linked channels
        this._updateLinks()
        // Log welcome message
        if (client.welcomeMessage) {
          this.log.push({
            type: 'welcome-message',
            message: sanitize(client.welcomeMessage)
          })
        }

        // Startup audio input processing
        this._updateVoiceHandler()
        // Tell server our mute/deaf state (if necessary)
        if (this.selfDeaf()) {
          this.client.setSelfDeaf(true)
        } else if (this.selfMute()) {
          this.client.setSelfMute(true)
        }
      }, err => {
        if (err.$type && err.$type.name === 'Reject') {
          this.connectErrorDialog.type(err.type)
          this.connectErrorDialog.reason(err.reason)
          this.connectErrorDialog.show()
        } else {
          log(translate('logentry.connection_error'), err)
        }
      })
    }

    this._newUser = user => {
      const simpleProperties = {
        uniqueId: 'uid',
        username: 'name',
        mute: 'mute',
        deaf: 'deaf',
        suppress: 'suppress',
        selfMute: 'selfMute',
        selfDeaf: 'selfDeaf',
        texture: 'rawTexture',
        textureHash: 'textureHash',
        comment: 'comment'
      }
      var ui = user.__ui = {
        model: user,
        talking: ko.observable('off'),
        channel: ko.observable()
      }
      ui.texture = ko.pureComputed(() => {
        let raw = ui.rawTexture()
        if (!raw || raw.offset >= raw.limit) return null
        return 'data:image/*;base64,' + ByteBuffer.wrap(raw).toBase64()
      })
      ui.show_avatar = () => {
        let setting = this.settings.showAvatars()
        switch (setting) {
          case 'always':
            break
          case 'own_channel':
            if (this.thisUser().channel() !== ui.channel()) return false
            break
          case 'linked_channel':
            if (!ui.channel().linked()) return false
            break
          case 'minimal_only':
            if (!this.minimalView()) return false
            if (this.thisUser().channel() !== ui.channel()) return false
            break
          case 'never':
          default: return false
        }
        if (!ui.texture()) {
          if (ui.textureHash()) {
            // The user has an avatar set but it's of sufficient size to not be
            // included by default, so we need to fetch it explicitly now.
            // mumble-client should make sure we only send one request per hash
            user.requestTexture()
          }
          return false
        }
        return true
      }
      ui.openContextMenu = (_, event) => openContextMenu(event, this.userContextMenu, ui)
      ui.canChangeMute = () => {
        return false // TODO check for perms and implement
      }
      ui.canChangeDeafen = () => {
        return false // TODO check for perms and implement
      }
      ui.canChangePrioritySpeaker = () => {
        return false // TODO check for perms and implement
      }
      ui.canLocalMute = () => {
        return false // TODO implement local mute
        // return this.thisUser() !== ui
      }
      ui.canIgnoreMessages = () => {
        return false // TODO implement ignore messages
        // return this.thisUser() !== ui
      }
      ui.canChangeComment = () => {
        return false // TODO implement changing of comments
        // return this.thisUser() === ui // TODO check for perms
      }
      ui.canChangeAvatar = () => {
        return this.thisUser() === ui // TODO check for perms
      }
      ui.toggleMute = () => {
        if (ui.selfMute()) {
          this.requestUnmute(ui)
        } else {
          this.requestMute(ui)
        }
      }
      ui.toggleDeaf = () => {
        if (ui.selfDeaf()) {
          this.requestUndeaf(ui)
        } else {
          this.requestDeaf(ui)
        }
      }
      ui.viewAvatar = () => {
        this.avatarView(ui.texture())
      }
      ui.changeAvatar = () => {
        let input = document.createElement('input')
        input.type = 'file'
        input.addEventListener('change', () => {
          let reader = new window.FileReader()
          reader.onload = () => {
            this.client.setSelfTexture(reader.result)
          }
          reader.readAsArrayBuffer(input.files[0])
        })
        input.click()
      }
      ui.removeAvatar = () => {
        user.clearTexture()
      }
      Object.entries(simpleProperties).forEach(key => {
        ui[key[1]] = ko.observable(user[key[0]])
      })
      ui.state = ko.pureComputed(userToState, ui)
      if (user.channel) {
        ui.channel(user.channel.__ui)
        ui.channel().users.push(ui)
        ui.channel().users.sort(compareUsers)
      }

      user.on('update', (actor, properties) => {
        Object.entries(simpleProperties).forEach(key => {
          if (properties[key[0]] !== undefined) {
            ui[key[1]](properties[key[0]])
          }
        })
        if (properties.channel !== undefined) {
          if (ui.channel()) {
            ui.channel().users.remove(ui)
          }
          ui.channel(properties.channel.__ui)
          ui.channel().users.push(ui)
          ui.channel().users.sort(compareUsers)
          this._updateLinks()
        }
        if (properties.textureHash !== undefined) {
          // Invalidate avatar texture when its hash has changed
          // If the avatar is still visible, this will trigger a fetch of the new one.
          ui.rawTexture(null)
        }
      }).on('remove', () => {
        if (ui.channel()) {
          ui.channel().users.remove(ui)
        }
      }).on('voice', stream => {
        console.log(`User ${user.username} started takling`)
        var userNode = new BufferQueueNode({
          audioContext: audioContext()
        })
        userNode.connect(audioContext().destination)

        stream.on('data', data => {
          if (data.target === 'normal') {
            ui.talking('on')
          } else if (data.target === 'shout') {
            ui.talking('shout')
          } else if (data.target === 'whisper') {
            ui.talking('whisper')
          }
          userNode.write(data.buffer)
        }).on('end', () => {
          console.log(`User ${user.username} stopped takling`)
          ui.talking('off')
          userNode.end()
        })
      })
    }

    this._newChannel = channel => {
      const simpleProperties = {
        position: 'position',
        name: 'name',
        description: 'description'
      }
      var ui = channel.__ui = {
        model: channel,
        expanded: ko.observable(true),
        parent: ko.observable(),
        channels: ko.observableArray(),
        users: ko.observableArray(),
        linked: ko.observable(false)
      }
      ui.userCount = () => {
        return ui.channels().reduce((acc, c) => acc + c.userCount(), ui.users().length)
      }
      ui.openContextMenu = (_, event) => openContextMenu(event, this.channelContextMenu, ui)
      ui.canJoin = () => {
        return true // TODO check for perms
      }
      ui.canAdd = () => {
        return false // TODO check for perms and implement
      }
      ui.canEdit = () => {
        return false // TODO check for perms and implement
      }
      ui.canRemove = () => {
        return false // TODO check for perms and implement
      }
      ui.canLink = () => {
        return false // TODO check for perms and implement
      }
      ui.canUnlink = () => {
        return false // TODO check for perms and implement
      }
      ui.canSendMessage = () => {
        return false // TODO check for perms and implement
      }
      Object.entries(simpleProperties).forEach(key => {
        ui[key[1]] = ko.observable(channel[key[0]])
      })
      if (channel.parent) {
        ui.parent(channel.parent.__ui)
        ui.parent().channels.push(ui)
        ui.parent().channels.sort(compareChannels)
      }
      this._updateLinks()

      channel.on('update', properties => {
        Object.entries(simpleProperties).forEach(key => {
          if (properties[key[0]] !== undefined) {
            ui[key[1]](properties[key[0]])
          }
        })
        if (properties.parent !== undefined) {
          if (ui.parent()) {
            ui.parent().channel.remove(ui)
          }
          ui.parent(properties.parent.__ui)
          ui.parent().channels.push(ui)
          ui.parent().channels.sort(compareChannels)
        }
        if (properties.links !== undefined) {
          this._updateLinks()
        }
      }).on('remove', () => {
        if (ui.parent()) {
          ui.parent().channels.remove(ui)
        }
        this._updateLinks()
      })
    }

    this.resetClient = () => {
      if (this.client) {
        this.client.disconnect()
      }
      this.client = null
      this.selected(null).root(null).thisUser(null)
    }

    this.connected = () => this.thisUser() != null

    this._updateVoiceHandler = () => {
      if (!this.client) {
        return
      }
      if (voiceHandler) {
        voiceHandler.end()
        voiceHandler = null
      }
      let mode = this.settings.voiceMode
      if (mode === 'cont') {
        voiceHandler = new ContinuousVoiceHandler(this.client, this.settings)
      } else if (mode === 'ptt') {
        voiceHandler = new PushToTalkVoiceHandler(this.client, this.settings)
      } else if (mode === 'vad') {
        voiceHandler = new VADVoiceHandler(this.client, this.settings)
      } else {
        log(translate('logentry.unknown_voice_mode'), mode)
        return
      }
      voiceHandler.on('started_talking', () => {
        if (this.thisUser()) {
          this.thisUser().talking('on')
        }
      })
      voiceHandler.on('stopped_talking', () => {
        if (this.thisUser()) {
          this.thisUser().talking('off')
        }
      })
      if (this.selfMute()) {
        voiceHandler.setMute(true)
      }

      this.client.setAudioQuality(
        this.settings.audioBitrate,
        this.settings.samplesPerPacket
      )
    }

    this.messageBoxHint = ko.pureComputed(() => {
      if (!this.thisUser()) {
        return '' // Not yet connected
      }
      var target = this.selected()
      if (!target) {
        target = this.thisUser()
      }
      if (target === this.thisUser()) {
        target = target.channel()
      }
      if (target.users) { // Channel
        return translate('chat.channel_message_placeholder')
          .replace('%1', target.name())
      } else { // User
        return translate('chat.user_message_placeholder')
          .replace('%1', target.name())
      }
    })

    this.submitMessageBox = () => {
      this.sendMessage(this.selected(), this.messageBox())
      this.messageBox('')
    }

    this.sendMessage = (target, message) => {
      if (this.connected()) {
        // If no target is selected, choose our own user
        if (!target) {
          target = this.thisUser()
        }
        // If target is our own user, send to our channel
        if (target === this.thisUser()) {
          target = target.channel()
        }
        // Send message
        target.model.sendMessage(message)
        if (target.users) { // Channel
          this.log.push({
            type: 'chat-message-self',
            message: sanitize(message),
            channel: target
          })
        } else { // User
          this.log.push({
            type: 'chat-message-self',
            message: sanitize(message),
            user: target
          })
        }
      }
    }

    this.requestMove = (user, channel) => {
      if (this.connected()) {
        user.model.setChannel(channel.model)

        let currentUrl = url.parse(document.location.href, true)
        // delete search param so that query one can be taken into account
        delete currentUrl.search

        // get full channel path
        if( channel.parent() ){ // in case this channel is not Root
          let parent = channel.parent()
          currentUrl.query.channelName = channel.name()
          while( parent.parent() ){
            currentUrl.query.channelName = parent.name() + '/' + currentUrl.query.channelName
            parent = parent.parent()
          }
        } else {
          // there is no channelName as we moved to Root
          delete currentUrl.query.channelName
        }

        // reflect this change in URL
        window.history.pushState(null, channel.name(), url.format(currentUrl))
      }
    }

    this.requestMute = user => {
      if (user === this.thisUser()) {
        this.selfMute(true)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setSelfMute(true)
        } else {
          user.model.setMute(true)
        }
      }
    }

    this.requestDeaf = user => {
      if (user === this.thisUser()) {
        this.selfMute(true)
        this.selfDeaf(true)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setSelfDeaf(true)
        } else {
          user.model.setDeaf(true)
        }
      }
    }

    this.requestUnmute = user => {
      if (user === this.thisUser()) {
        this.selfMute(false)
        this.selfDeaf(false)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setSelfMute(false)
        } else {
          user.model.setMute(false)
        }
      }
    }

    this.requestUndeaf = user => {
      if (user === this.thisUser()) {
        this.selfDeaf(false)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setSelfDeaf(false)
        } else {
          user.model.setDeaf(false)
        }
      }
    }

    this._updateLinks = () => {
      if (!this.thisUser()) {
        return
      }

      var allChannels = getAllChannels(this.root(), [])
      var ownChannel = this.thisUser().channel().model
      var allLinked = findLinks(ownChannel, [])
      allChannels.forEach(channel => {
        channel.linked(allLinked.indexOf(channel.model) !== -1)
      })

      function findLinks (channel, knownLinks) {
        knownLinks.push(channel)
        channel.links.forEach(next => {
          if (next && knownLinks.indexOf(next) === -1) {
            findLinks(next, knownLinks)
          }
        })
        allChannels.map(c => c.model).forEach(next => {
          if (next && knownLinks.indexOf(next) === -1 && next.links.indexOf(channel) !== -1) {
            findLinks(next, knownLinks)
          }
        })
        return knownLinks
      }

      function getAllChannels (channel, channels) {
        channels.push(channel)
        channel.channels().forEach(next => getAllChannels(next, channels))
        return channels
      }
    }

    this.openSourceCode = () => {
      var homepage = require('../package.json').homepage
      window.open(homepage, '_blank').focus()
    }

    this.updateSize = () => {
      this.minimalView(window.innerWidth < 320)
      if (this.minimalView()) {
        this.toolbarHorizontal(window.innerWidth < window.innerHeight)
      } else {
        this.toolbarHorizontal(!this.settings.toolbarVertical)
      }
    }
  }
}
var ui = new GlobalBindings(window.mumbleWebConfig)

function ConnectDialog () {
  this.address = ko.observable('')
  this.port = ko.observable('')
  this.tokenToAdd = ko.observable('')
  this.selectedTokens = ko.observableArray([])
  this.tokens = ko.observableArray([])
  this.username = ko.observable('')
  this.password = ko.observable('')
  this.channelName = ko.observable('')
  this.joinOnly = ko.observable(false)
  this.visible = ko.observable(true)
  this.show = this.visible.bind(this.visible, true)
  this.hide = this.visible.bind(this.visible, false)
  this.connect = function () {
    this.hide()
    ui.connect(this.username(), this.address(), this.port(), this.tokens(), this.password(), this.channelName())
  }

  this.addToken = function() {
    if ((this.tokenToAdd() != "") && (this.tokens.indexOf(this.tokenToAdd()) < 0)) {
      this.tokens.push(this.tokenToAdd())
    }
    this.tokenToAdd("")
  }

  this.removeSelectedTokens = function() {
      this.tokens.removeAll(this.selectedTokens())
      this.selectedTokens([])
  }
}

class MatrixWidget {
  widgetId: null
  constructor() {
    this.widgetId = null
    window.addEventListener('message', this.onMessage.bind(this))
  }

  onMessage(event: any) {
    this.widgetId = this.widgetId || event.data.widgetId

    switch (event.data.api) {
      case 'fromWidget':
        break
      case 'toWidget':
        switch (event.data.action) {
          case 'capabilities':
            this.sendResponse(event, {
              capabilities: ['m.always_on_screen']
            })
            break
        }
        break
      default:
        break
    }
  }

  sendContentLoaded() {
    this.sendMessage({
      action: 'content_loaded'
    })
  }

  setAlwaysOnScreen(value: any) {
    // Extension of main spec, see https://github.com/matrix-org/matrix-doc/issues/1354
    this.sendMessage({
      action: 'set_always_on_screen',
      value: value, // once for spec compliance
      data: { value: value } // and once for Riot
    })
  }

  sendMessage(message: any) {
    if (!this.widgetId) return
    message.api = message.api || 'fromWidget'
    message.widgetId = message.widgetId || this.widgetId
    message.requestId = message.requestId || Math.random().toString(36)
    window.parent.postMessage(message, '*')
  }

  sendResponse(event: any, response: any) {
    event.data.response = response
    event.source.postMessage(event.data, event.origin)
  }
}

declare global {
  interface Window {
    matrixWidget: any;
    mumbleWebConfig: any;
    mumbleUi: any;
  }
}

class index extends React.Component {
  componentDidMount() {
    window.matrixWidget = new MatrixWidget()
    window.mumbleWebConfig = {
      // Which fields to show on the Connect to Server dialog
      'connectDialog': {
        'address': true,
        'port': true,
        'token': true,
        'username': true,
        'password': true,
        'channelName': false
      },
      // Default values for user settings
      // You can see your current value by typing `localStorage.getItem('mumble.$setting')` in the web console.
      'settings': {
        'voiceMode': 'vad', // one of 'cont' (Continuous), 'ptt' (Push-to-Talk), 'vad' (Voice Activity Detection)
        'pttKey': 'ctrl + shift',
        'vadLevel': 0.3,
        'toolbarVertical': false,
        'showAvatars': 'always', // one of 'always', 'own_channel', 'linked_channel', 'minimal_only', 'never'
        'userCountInChannelName': false,
        'audioBitrate': 40000, // bits per second
        'samplesPerPacket': 960
      },
      // Default values (can be changed by passing a query parameter of the same name)
      'defaults': {
        // Connect Dialog
        'address': window.location.hostname,
        'port': '443',
        'token': '',
        'username': '',
        'password': '',
        'joinDialog': false, // replace whole dialog with single "Join Conference" button
        'matrix': false, // enable Matrix Widget support (mostly auto-detected; implies 'joinDialog')
        'avatarurl': '', // download and set the user's Mumble avatar to the image at this URL
        // General
        'theme': 'MetroMumbleLight'
      }
    }
    window.mumbleUi = ui
  }
  render() {
    return (
      <>
        <IndexPage />
      </>
    )
  }
}

const IndexPage = () => {
  return (
    <>
      <Loading />
      <Container isMinimal={false}
        visible={false}
        joinOnly={false}
      />
    </>
  )
}

const Loading = () => {
  return (
    <>
    </>
  )
}

const Container = (props: any) => {
  const isMinimal = props.isMinimal
  const visible = props.visible
  const joinOnly = props.joinOnly
  if (isMinimal) {
    return (
      <div id='contianer'>

      </div>
    )
  } else {
    return (
      <div id='container'>

      </div>
    )
  }
}

export default index
