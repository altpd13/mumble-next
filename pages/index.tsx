import '../styles/MetroMumbleDark/main.scss'
import '../styles/MetroMumbleDark/loading.scss'
import React, { useState } from 'react'
import WorkerBasedMumbleConnector from "../utils/worker-client";
import {filterArray} from "../utils/filterArray";
import MumbleClient from 'mumble-client'
import {log} from "util";
import {url} from "inspector";

let ui: GlobalBindings;

class GlobalBindings {
  config: any;
  settings: Settings;
  connector: WorkerBasedMumbleConnector;
  client: any
  userContextMenu: ContextMenu;
  channelContextMenu: ContextMenu;
  connectDialog: ConnectDialog;
  connectErrorDialog: ConnectErrorDialog;
  connectionInfo: ConnectionInfo;
  commentDialog: CommentDialog;
  settingsDialog: string;
  minimalView: boolean;
  log: string[];
  remoteHost: string;
  remotePort: string;
  thisUser: string;
  root: string;
  avatarView: string;
  messageBox: string;
  toolbarHorizontal: boolean;
  selected: string;
  thisMute: string;
  thisDeaf: string;

  constructor(config: mumbleWebConfig) {
    this.config = config
    this.settings = new Settings({defaults: config.settings})
    this.connector = new WorkerBasedMumbleConnector()
    this.client = null
    this.userContextMenu = new ContextMenu(0, 0, null)
    this.channelContextMenu = new ContextMenu(0, 0, null)
    this.connectDialog = new ConnectDialog()
    this.connectErrorDialog = new ConnectErrorDialog(this.connectDialog)
    this.connectionInfo = new ConnectionInfo(this)
    this.commentDialog = new CommentDialog()
    this.settingsDialog = ""
    this.minimalView = false
    this.log = []
    this.remoteHost = ""
    this.remotePort = ""
    this.thisUser = ""
    this.root = ""
    this.avatarView = ""
    this.messageBox = ""
    this.toolbarHorizontal = !this.settings.toolbarVertical
    this.selected = ""
    this.thisMute = ""
    this.thisDeaf = ""

    this.thisMute.subscribe(mute => {
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

    this.getTimestring = () => {
      return '[' + new Date().toLocaleTimestring('en-US') + ']'
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
        if (channelName.indexOf("/") != 0) {
          channelName = "/" + channelName;
        }
        const registerChannel = (channel, channelPath) => {
          this._newChannel(channel)
          if (channelPath === channelName) {
            client.this.setChannel(channel)
          }
          channel.children.forEach(ch => registerChannel(ch, channelPath + "/" + ch.name))
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
          sender = sender || {__ui: 'Server'}
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
            value: 'Permission denied : ' + type
          })
        })

        // Set own user and root channel
        this.thisUser(client.this.__ui)
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
        if (this.thisDeaf()) {
          this.client.setthisDeaf(true)
        } else if (this.thisMute()) {
          this.client.setthisMute(true)
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
        thisMute: 'thisMute',
        thisDeaf: 'thisDeaf',
        texture: 'rawTexture',
        textureHash: 'textureHash',
        comment: 'comment'
      }
      var ui = user.__ui = {
        model: user,
        talking: 'off',
        channel: ""
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
          default:
            return false
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
        if (ui.thisMute()) {
          this.requestUnmute(ui)
        } else {
          this.requestMute(ui)
        }
      }
      ui.toggleDeaf = () => {
        if (ui.thisDeaf()) {
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
            this.client.setthisTexture(reader.result)
          }
          reader.readAsArrayBuffer(input.files[0])
        })
        input.click()
      }
      ui.removeAvatar = () => {
        user.clearTexture()
      }
      Object.entries(simpleProperties).forEach(key => {
        ui[key[1]] = user[key[0]]
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
        expanded: true,
        parent: "",
        channels: [],
        users: [],
        linked: false
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
        ui[key[1]] = channel[key[0]]
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
      if (this.thisMute()) {
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
            type: 'chat-message-this',
            message: sanitize(message),
            channel: target
          })
        } else { // User
          this.log.push({
            type: 'chat-message-this',
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
        if (channel.parent()) { // in case this channel is not Root
          let parent = channel.parent()
          currentUrl.query.channelName = channel.name()
          while (parent.parent()) {
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
        this.thisMute(true)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setthisMute(true)
        } else {
          user.model.setMute(true)
        }
      }
    }

    this.requestDeaf = user => {
      if (user === this.thisUser()) {
        this.thisMute(true)
        this.thisDeaf(true)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setthisDeaf(true)
        } else {
          user.model.setDeaf(true)
        }
      }
    }

    this.requestUnmute = user => {
      if (user === this.thisUser()) {
        this.thisMute(false)
        this.thisDeaf(false)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setthisMute(false)
        } else {
          user.model.setMute(false)
        }
      }
    }

    this.requestUndeaf = user => {
      if (user === this.thisUser()) {
        this.thisDeaf(false)
      }
      if (this.connected()) {
        if (user === this.thisUser()) {
          this.client.setthisDeaf(false)
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

      function findLinks(channel, knownLinks) {
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

      function getAllChannels(channel, channels) {
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

ui = new GlobalBindings(window.mumbleWebConfig);

class Settings {
  voiceMode: string;
  pttKey: string;
  vadLevel: number;
  toolbarVertical: Boolean;
  showAvatars: string;
  userCountInChannelName: Boolean;
  audioBitrate: number;
  samplesPerPacket: number;

  constructor({defaults}: { defaults: any }) {
    function load(key: string) {
      return window.localStorage.getItem('mumble.' + key);
    }

    this.voiceMode = load('voiceMode') || defaults.voiceMode
    this.pttKey = load('pttKey') || defaults.pttKey
    this.vadLevel = load('vadLevel') || defaults.vadLevel
    this.toolbarVertical = load('toolbarVertical') || defaults.toolbarVertical
    this.showAvatars = load('showAvatars') || defaults.showAvatars
    this.userCountInChannelName = load('userCountInChannelName') || defaults.userCountInChannelName
    this.audioBitrate = Number(load('audioBitrate')) || defaults.audioBitrate
    this.samplesPerPacket = Number(load('samplesPerPacket')) || defaults.samplesPerPacket
  }

  save() {
    const save = (key: string, val: any) => window.localStorage.setItem('mumble.' + key, val)
    save('voiceMode', this.voiceMode)
    save('pttKey', this.pttKey)
    save('vadLevel', this.vadLevel)
    save('toolbarVertical', this.toolbarVertical)
    save('showAvatars', this.showAvatars)
    save('userCountInChannelName', this.userCountInChannelName)
    save('audioBitrate', this.audioBitrate)
    save('samplesPerPacket', this.samplesPerPacket)
  }
}

class ContextMenu {
  posX: number;
  posY: number;
  target: any;

  constructor(posX: number, posY: number, target: any) {
    this.posX = posX
    this.posY = posY
    this.target = target
  }

}

class ConnectDialog {
  address: string;
  port: string;
  tokenToAdd: string;
  selectedTokens: string[];
  tokens: string[];
  username: string;
  password: string;
  channelName: string;
  joinOnly: Boolean;
  visible: any;
  show: any;
  hide: any;

  constructor() {
    this.address = ""
    this.port = ""
    this.tokenToAdd = ""
    this.selectedTokens = []
    this.tokens = []
    this.username = ""
    this.password = ""
    this.channelName = ""
    this.joinOnly = false
    this.visible = true
    this.show = this.visible.bind(this.visible, true)
    this.hide = this.visible.bind(this.visible, false)
  }

  connect() {
    this.hide()
    ui.connect(this.username, this.address, this.port, this.tokens, this.password, this.channelName)
  }

  addToken() {
    if ((this.tokenToAdd != "") && (this.tokens.indexOf(this.tokenToAdd) < 0)) {
      this.tokens.push(this.tokenToAdd)
    }
    this.tokenToAdd = ""
  }

  removeSelectedTokens() {
    this.tokens = filterArray(this.tokens, this.selectedTokens)
    this.selectedTokens = []
  }

}

class ConnectErrorDialog {
  type: number;
  reason: string;
  username: string;
  password: string;
  joinOnly: Boolean;
  visible: any;
  show: any;
  hide: any;

  constructor(connectDialog: ConnectDialog) {
    this.type = 0
    this.reason = ""
    this.username = connectDialog.username
    this.password = connectDialog.password
    this.joinOnly = connectDialog.joinOnly
    this.visible = false
    this.show = this.visible.bind(this.visible, true)
    this.hide = this.visible.bind(this.visible, false)
  }

}

class ConnectionInfo {
  _ui: GlobalBindings;
  visible: Boolean;
  serverVersion: string;
  latencyMs: number;
  latencyDeviation: number;
  remoteHost: string;
  remotePort: string;
  maxBitrate: number;
  currentBitrate: number;
  maxBandwidth: number;
  currentBandwidth: number;
  codec: string;

  constructor(ui: GlobalBindings) {
    this._ui = ui
    this.visible = false
    this.serverVersion = ""
    this.latencyMs = NaN
    this.latencyDeviation = NaN
    this.remoteHost = ""
    this.remotePort = ""
    this.maxBitrate = NaN
    this.currentBitrate = NaN
    this.maxBandwidth = NaN
    this.currentBandwidth = NaN
    this.codec = ""

  }

  show() {
    this.update()
    this.visible = true
  }

  hide() {
    this.visible = false
  }

  update() {
    let client = this._ui.client

    this.serverVersion = client.serverVersion

    let dataStats = client.dataStats
    if (dataStats) {
      this.latencyMs = dataStats.mean
      this.latencyDeviation = Math.sqrt(dataStats.variance)
    }
    this.remoteHost = this._ui.remoteHost()
    this.remotePort = this._ui.remotePort()

    let spp = this._ui.settings.samplesPerPacket
    let maxBitrate = client.getMaxBitrate(spp, false)
    let maxBandwidth = client.maxBandwidth
    let actualBitrate = client.getActualBitrate(spp, false)
    let actualBandwidth = MumbleClient.calcEnforcableBandwidth(actualBitrate, spp, false)
    this.maxBitrate = maxBitrate
    this.currentBitrate = actualBitrate
    this.maxBandwidth = maxBandwidth
    this.currentBandwidth = actualBandwidth
    this.codec = 'Opus' // only one supported for sending
  }
}

class CommentDialog {
  visible: Boolean;

  constructor() {
    this.visible = false
  }

  show() {
    this.visible = true
  }
}

ui = new GlobalBindings(window.mumbleWebConfig);

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
    // window.mumbleUi = ui
  }

  render() {
    return (
      <>
        <IndexPage/>
      </>
    )
  }
}
export default index

//**********************************/
//***                              */
//***      *************************/
//***      *************************/
//***      *************************/
//***                              */
//**********************************/
const IndexPage = () => {
  let props = {
    visible: "true",
    isMinimal: "true",
    joinOnly: "false"
  }
  return (
    <>
      <Loading />
      <Container {...props} />
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
  let stuff = {
    visible: props.visible,
    joinOnly: props.joinOnly
  }
  if (isMinimal) {
    return (
      <div id='contianer'>
        <ConnectBox {...stuff} />
      </div>
    )
  } else {
    return (
      <div id='container'>

      </div>
    )
  }
}

const ConnectBox = (props: any) => {
  const visible = props.visible
  const joinOnly = props.joinOnly
  if (visible && !joinOnly) {
    return (
      <>
        <ConnectBoxDialog />
      </>
    )
  } else if (visible && joinOnly) {
    return (
      <>
        <ConnectBoxDialog />
      </>
    )
  } else if (visible) {
    return (
      <>
      </>
    )
  } else {
    return (
      <div>Error with visible and joinonly :( fuck you</div>
    )
  }
}

class ConnectBoxDialog extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      address: '',
      port: '',
      username: '',
      password: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange = (event: any) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleSubmit(event: any) {
    event.preventDefault()
  }

  render() {
    return (
      <div className="connect-dialog dialog" >
        <div id="connect-dialog_title" className="dialog-header">
          Connect to Server
          </div>
        <form onSubmit={this.handleSubmit}>
          <table>
            <tbody>
              <tr /*data-bind="if: $root.config.connectDialog.address"*/>
                <td id="connect-dialog_input_address">Address</td>
                <td><input name="address" id="address" type="text" value={this.state.address} onChange={this.handleChange} required /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.port"*/>
                <td id="connect-dialog_input_port">Port</td>
                <td><input name="port" id="port" type="text" value={this.state.port} onChange={this.handleChange} required /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.username"*/>
                <td id="connect-dialog_input_username">Username</td>
                <td><input name="username" id="username" type="text" value={this.state.username} onChange={this.handleChange} required /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.password"*/>
                <td id="connect-dialog_input_password">Password</td>
                <td><input name="password" id="password" type="text" value={this.state.password} onChange={this.handleChange} /></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.token"*/>
                <td id="connect-dialog_input_tokens">Tokens</td>
                <td>
                  <input type="text" data-bind='value: tokenToAdd, valueUpdate: "afterkeydown"' />
                </td>
              </tr>
              <tr data-bind="if: $root.config.connectDialog.token">
                <td></td>
                <td>
                  <button id="connect-dialog_controls_remove" className="dialog-submit" type="button" data-bind="enable: selectedTokens().length > 0, click: removeSelectedTokens()">Remove</button>
                  <button id="connect-dialog_controls_add" className="dialog-submit" type="button" data-bind="enable: tokenToAdd().length > 0, click: addToken()">Add</button>
                </td>
              </tr>
              <tr data-bind="if: $root.config.connectDialog.token, visible: tokens().length > 0">
                <td></td>
                <td><select id="token" /**!multiple='true'*/ height="5" data-bind="options:tokens, selectedOptions:selectedTokens"></select></td>
              </tr>
              <tr data-bind="if: $root.config.connectDialog.channelName">
                <td>Channel</td>
                <td><input id="channelName" type="text" data-bind="value: channelName" /></td>
              </tr>
            </tbody>
          </table>
          <div className="dialog-footer">
            <input id="connect-dialog_controls_cancel" className="dialog-close" type="button" data-bind="click: hide" value="Cancel" />
            <input id="connect-dialog_controls_connect" className="dialog-submit" type="submit" value="Connect" />
          </div>
        </form>
      </div>
    )
  }
}

