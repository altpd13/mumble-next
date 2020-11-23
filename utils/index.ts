import 'stream-browserify' // see https://github.com/ericgundrum/pouch-websocket-sync-example/commit/2a4437b013092cc7b2cd84cf1499172c84a963a3
import WorkerBasedMumbleConnector from './worker-client'
import {ContinuousVoiceHandler, PushToTalkVoiceHandler, VADVoiceHandler, VoiceHandler} from './voice'
import {filterArray} from "./filterArray";

const url = require('url')
// const ByteBuffer = require('bytebuffer')
const MumbleClient = require('mumble-client')
const BufferQueueNode = require('web-audio-buffer-queue')
const audioContext = require('audio-context')
// const keyboardjs = require('keyboardjs')

// const mumbleWebConfig = {
//   // Which fields to show on the Connect to Server dialog
//   'connectDialog': {
//     'address': true,
//     'port': true,
//     'token': true,
//     'username': true,
//     'password': true,
//     'channelName': false
//   },
//   // Default values for user settings
//   // You can see your current value by typing `localStorage.getItem('mumble.$setting')` in the web console.
//   'settings': {
//     'voiceMode': 'vad', // one of 'cont' (Continuous), 'ptt' (Push-to-Talk), 'vad' (Voice Activity Detection)
//     'pttKey': 'ctrl + shift',
//     'vadLevel': 0.3,
//     'toolbarVertical': false,
//     'showAvatars': 'always', // one of 'always', 'own_channel', 'linked_channel', 'minimal_only', 'never'
//     'userCountInChannelName': false,
//     'audioBitrate': 40000, // bits per second
//     'samplesPerPacket': 960
//   },
//   // Default values (can be changed by passing a query parameter of the same name)
//   'defaults': {
//     // Connect Dialog
//     'address': window.location.hostname,
//     'port': '443',
//     'token': '',
//     'username': '',
//     'password': '',
//     'joinDialog': false, // replace whole dialog with single "Join Conference" button
//     'matrix': false, // enable Matrix Widget support (mostly auto-detected; implies 'joinDialog')
//     'avatarurl': '', // download and set the user's Mumble avatar to the image at this URL
//     // General
//     'theme': 'MetroMumbleLight'
//   }
// }

// interface mumbleWebConfig {
//   'connectDialog': {
//     'address': boolean,
//     'port': boolean,
//     'token': boolean,
//     'username': boolean,
//     'password': boolean,
//     'channelName': boolean
//   },
//   'settings': {
//     'voiceMode': string,
//     'pttKey': string,
//     'vadLevel': number,
//     'toolbarVertical': boolean,
//     'showAvatars': string,
//     'userCountInChannelName': boolean,
//     'audioBitrate': number, // bits per second
//     'samplesPerPacket': number
//   },
//   'defaults': {
//     // Connect Dialog
//     'address': string,
//     'port': number,
//     'token': string,
//     'username': string,
//     'password': string,
//     'joinDialog': boolean, // replace whole dialog with single "Join Conference" button
//     'matrix': boolean, // enable Matrix Widget support (mostly auto-detected; implies 'joinDialog')
//     'avatarUrl': string, // download and set the user's Mumble avatar to the image at self URL
//     // General
//     'theme': string
//   }
// }

function openContextMenu(event: any, contextMenu: any, target: any) {
  contextMenu.posX = event.clientX
  contextMenu.posY = event.clientY
  contextMenu.target = target

  const closeListener = () => {
    // Always close, no matter where they clicked
    setTimeout(() => { // delay to allow click to be actually processed
      contextMenu.target = null
      unregister()
    })
  }
  const unregister = () => document.removeEventListener('click', closeListener)
  document.addEventListener('click', closeListener)

  event.stopPropagation()
  event.preventDefault()
}

export class Settings {
  voiceMode: string;
  pttKey: string;
  vadLevel: number;
  toolbarVertical: Boolean;
  showAvatars: string;
  userCountInChannelName: Boolean;
  audioBitrate: number;
  samplesPerPacket: number;

  constructor(defaults: any) {
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

export class ContextMenu {
  posX: number;
  posY: number;
  target: any;

  constructor(posX: number, posY: number, target: any) {
    this.posX = posX
    this.posY = posY
    this.target = target
  }

}

export class ConnectDialog {
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
    this.show = this.visible = true
    this.hide = this.visible = false
  }

  connect() {
    this.hide()
    // ui.connect(this.username, this.address, this.port, this.tokens, this.password, this.channelName)
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

export class ConnectErrorDialog {
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
    this.show = this.visible = true
    this.hide = this.visible = false
  }

}

export class ConnectionInfo {
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
    this.remoteHost = this._ui.remoteHost
    this.remotePort = this._ui.remotePort

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

export class CommentDialog {
  visible: Boolean;

  constructor() {
    this.visible = false
  }

  show() {
    this.visible = true
  }
}

export class SettingsDialog {
  voiceMode: any;
  pttKey: any;
  pttKeyDisplay: any;
  vadLevel: any;
  testVadLevel: number;
  testVadActive: boolean;
  showAvatars: any;
  userCountInChannelName: any;
  audioBitrate: number;
  samplesPerPacket: any;
  // msPerPacket: PureComputed<number>;
  _testVad: VADVoiceHandler | null;

  constructor(settings: any) {
    this._testVad = null
    this.voiceMode = settings.voiceMode
    this.pttKey = settings.pttKey
    this.pttKeyDisplay = settings.pttKey
    this.vadLevel = settings.vadLevel
    this.testVadLevel = 0
    this.testVadActive = false
    this.showAvatars = settings.showAvatars
    this.userCountInChannelName = settings.userCountInChannelName
    // Need to wrap self in a pureComputed to make sure it's always numeric
    this.audioBitrate = settings.audioBitrate
    this.samplesPerPacket = settings.samplesPerPacket
    // this.msPerPacket = ko.pureComputed({
    //   read: () => this.samplesPerPacket() / 48,
    //   write: (value) => this.samplesPerPacket = value * 48
    // })//msperPacket ㅇㅣ 바뀌면 samplePerPacket 도 바뀜 ㅋㅋ 루삥뽕

    this._setupTestVad()
    // this.vadLevel.subscribe(() => this._setupTestVad())
  }

  _setupTestVad() {
    if (this._testVad) {
      this._testVad.end()
    }
    let dummySettings = new Settings(<any>{})
    this.applyTo(dummySettings)
    this._testVad = new VADVoiceHandler(null, dummySettings)
    this._testVad.on('started_talking', () => this.testVadActive = true)
      .on('stopped_talking', () => this.testVadActive = false)
      .on('level', (level: number) => this.testVadLevel = level)
  }

  applyTo(settings: Settings) {
    settings.voiceMode = this.voiceMode
    settings.pttKey = this.pttKey
    settings.vadLevel = this.vadLevel
    settings.showAvatars = this.showAvatars
    settings.userCountInChannelName = this.userCountInChannelName
    settings.audioBitrate = this.audioBitrate
    settings.samplesPerPacket = this.samplesPerPacket
  }

  end() {
    this._testVad.end()
    // testVoiceHandler = null
  }

  // recordPttKey() {
  //   let combo: string[] = []
  //   const keydown = (e: any) => {
  //     combo = e.pressedKeys
  //     let comboStr = combo.join(' + ')
  //     this.pttKeyDisplay('> ' + comboStr + ' <')
  //   }
  //   const keyup = () => {
  //     keyboardjs.unbind('', keydown, keyup)
  //     let comboStr = combo.join(' + ')
  //     if (comboStr) {
  //       this.pttKey(comboStr).pttKeyDisplay(comboStr)
  //     } else {
  //       this.pttKeyDisplay(this.pttKey())
  //     }
  //   }
  //   keyboardjs.bind('', keydown, keyup)
  //   this.pttKeyDisplay('> ? <')
  // }

  totalBandwidth() {
    return MumbleClient.calcEnforcableBandwidth(
      this.audioBitrate,
      this.samplesPerPacket(),
      true
    )
  }

  positionBandwidth() {
    return this.totalBandwidth() - MumbleClient.calcEnforcableBandwidth(
      this.audioBitrate,
      this.samplesPerPacket(),
      false
    )
  }

  overheadBandwidth() {
    return MumbleClient.calcEnforcableBandwidth(
      0,
      this.samplesPerPacket(),
      false
    )
  }
}


export default class GlobalBindings {
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
  settingsDialog: SettingsDialog;
  minimalView: boolean;
  log: any[];
  remoteHost: string;
  remotePort: string;
  selfUser: any;
  root: string;
  avatarView: string;
  messageBox: string;
  toolbarHorizontal: boolean;
  selected: any;
  selfDeaf: boolean;
  selfMute: boolean;
  voiceHandler: VoiceHandler;
  thisUser: any;


  constructor(config: any) {
    this.config = config
    this.settings = new Settings(config.settings)
    this.connector = new WorkerBasedMumbleConnector()
    this.client = null
    this.userContextMenu = new ContextMenu(0, 0, null)
    this.channelContextMenu = new ContextMenu(0, 0, null)
    this.connectDialog = new ConnectDialog()
    this.connectErrorDialog = new ConnectErrorDialog(this.connectDialog)
    this.connectionInfo = new ConnectionInfo(this)
    this.commentDialog = new CommentDialog()
    this.settingsDialog = new SettingsDialog(this.settings)
    this.minimalView = false
    this.log = []
    this.remoteHost = ""
    this.remotePort = ""
    this.selfUser = ""
    this.root = ""
    this.avatarView = ""
    this.messageBox = ""
    this.toolbarHorizontal = !this.settings.toolbarVertical
    this.selected = ""
    this.selfDeaf = false
    this.selfMute = false
    this.voiceHandler = new ContinuousVoiceHandler()
  }

  select(element: any) {
    this.selected = element
  }

  openSettings() {
    this.settingsDialog = new SettingsDialog(this.settings)
  }

  applySettings() {
    const settingsDialog = this.settingsDialog

    settingsDialog.applyTo(this.settings)

    this.updateVoiceHandler()

    this.settings.save()
    this.closeSettings()
  }

  closeSettings() {
    if (this.settingsDialog) {
      this.settingsDialog.end()
    }
    // this.settingsDialog = null
  }

  // getTimestring() {
  //   return '[' + new Date().toLocaleTimeString('en-US') + ']'
  // }
  // username:string, host:string, port:string, tokens:string[], password:string, channelName:string

  connect(username: string, host: string, port: string, tokens: string[], password: string, channelName: string) {
    this.resetClient()

    this.remoteHost = host
    this.remotePort = port

    log(['logentry.connecting', host])

    // Note: self call needs to be delayed until the user has interacted with
    // the page in some way (which at self point they have), see: https://goo.gl/7K7WLu
    this.connector.setSampleRate(audioContext().sampleRate)

    // TODO: token
    this.connector.connect(`wss://${host}:${port}`, {
      username: username,
      password: password,
      tokens: tokens
    }).done(client => {
      // log(translate('logentry.connected'))

      this.client = client
      // Prepare for connection errors
      client.on('error', () => {
        // log(translate('logentry.connection_error'), err)
        this.resetClient()
      })

      // Make sure we stay open if we're running as Matrix widget
      window.matrixWidget.setAlwaysOnScreen(true)

      // Register all channels, recursively
      if (channelName.indexOf("/") != 0) {
        channelName = "/" + channelName;
      }

      const registerChannel = (channel: any, channelPath: string) => {
        this.newChannel(channel)
        if (channelPath === channelName) {
          client.this.setChannel(channel)
        }
        channel.children.forEach((ch: { name: string }) => registerChannel(ch, channelPath + "/" + ch.name))
      }
      registerChannel(client.root, "")

      // Register all users
      client.users.forEach((user: any) => this.newUser(user))

      // Register future channels
      client.on('newChannel', (channel: any) => this.newChannel(channel))
      // Register future users
      client.on('newUser', (user: any) => this.newUser(user))

      // Handle messages
      client.on('message', (sender: any, message: any, channels: string | any[]) => {
        sender = sender || {__ui: 'Server'}
        this.log.push({
          type: 'chat-message',
          user: sender.__ui,
          channel: channels.length > 0,
          message: message
        })
      })

      // Log permission denied error messages
      client.on('denied', (type: string) => {
        this.log.push({
          type: 'generic',
          value: 'Permission denied : ' + type
        })
      })

      // Set own user and root channel
      this.selfUser = client.this.__ui
      this.root = client.root.__ui
      // Upate linked channels
      this.updateLinks()
      // Log welcome message
      if (client.welcomeMessage) {
        this.log.push({
          type: 'welcome-message',
          message: client.welcomeMessage
        })
      }

      // Startup audio input processing
      this.updateVoiceHandler()
      // Tell server our mute/deaf state (if necessary)
      if (this.selfDeaf) {
        this.client.setselfDeaf(true)
      } else if (this.selfMute) {
        this.client.setselfMute(true)
      }
    }, err => {
      if (err.$type && err.$type.name === 'Reject') {
        this.connectErrorDialog.type = err.type
        this.connectErrorDialog.reason = err.reason
        this.connectErrorDialog.show()
      } else {
        // log(translate('logentry.connection_error'), err)
      }
    })
  }

  newUser(user: any) {
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
    let ui: any = user.__ui = {
      model: user,
      talking: 'off',
      channel: ""
    }
    // ui.texture = ko.pureComputed(() => {
    //   let raw = ui.rawTexture()
    //   if (!raw || raw.offset >= raw.limit) return null
    //   return 'data:image/*;base64,' + ByteBuffer.wrap(raw).toBase64()
    // })
    ui.show_avatar = () => {
      let setting = this.settings.showAvatars
      switch (setting) {
        case 'always':
          break
        case 'own_channel':
          if (this.selfUser().channel() !== ui.channel()) return false
          break
        case 'linked_channel':
          if (!ui.channel().linked) return false
          break
        case 'minimal_only':
          if (!this.minimalView) return false
          if (this.selfUser().channel() !== ui.channel()) return false
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
    ui.openContextMenu = (event: any) => openContextMenu(event, this.userContextMenu, ui)

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
      this.avatarView = ui.texture()
    }
    ui.changeAvatar = () => {
      let input = document.createElement('input')
      input.type = 'file'
      input.addEventListener('change', () => {
        let reader = new window.FileReader()
        reader.onload = () => {
          this.client.setselfTexture(reader.result)
        }
        if (input.files) {
          reader.readAsArrayBuffer(input.files[0])
        }
      })
      input.click()
    }
    ui.removeAvatar = () => {
      user.clearTexture()
    }
    Object.entries(simpleProperties).forEach(key => {
      ui[key[1]] = user[key[0]]
    })
    ui.state = ui.userToState()
    if (user.channel) {
      ui.channel(user.channel.__ui)
      ui.channel().users.push(ui)
      ui.channel().users.sort(compareUsers)
    }

    user.on('update', (properties: any) => {
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
        this.updateLinks()
      }
      if (properties.textureHash !== undefined) {
        // Invalidate avatar texture when its hash has changed
        // If the avatar is still visible, self will trigger a fetch of the new one.
        ui.rawTexture(null)
      }
    }).on('remove', () => {
      if (ui.channel()) {
        ui.channel().users.remove(ui)
      }
    }).on('voice', (stream: any) => {
      console.log(`User ${user.username} started takling`)
      let userNode = new BufferQueueNode({
        audioContext: audioContext()
      })
      userNode.connect(audioContext().destination)

      stream.on('data', (data: any) => {
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

  newChannel = (channel: any) => {
    const simpleProperties = {
      position: 'position',
      name: 'name',
      description: 'description'
    }
    let ui: any = channel.__ui = {
      model: channel,
      expanded: true,
      parent: "",
      channels: [],
      users: [],
      linked: false
    }

    ui.userCount = () => {
      return ui.channels().reduce((acc: number, c: any) => acc + c.userCount(), ui.users().length)
    }
    ui.openContextMenu = (event: any) => openContextMenu(event, this.channelContextMenu, ui)

    Object.entries(simpleProperties).forEach(key => {
      ui[key[1]] = channel[key[0]]
    })
    if (channel.parent) {
      ui.parent(channel.parent.__ui)
      ui.parent().channels.push(ui)
      ui.parent().channels.sort(sortChannels)
    }
    this.updateLinks()

    channel.on('update', (properties: any) => {
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
        ui.parent().channels.sort(sortChannels)
      }
      if (properties.links !== undefined) {
        this.updateLinks()
      }
    }).on('remove', () => {
      if (ui.parent()) {
        ui.parent().channels.remove(ui)
      }
      this.updateLinks()
    })
  }

  resetClient = () => {
    if (this.client) {
      this.client.disconnect()
    }
    this.client = null
    this.selected(null).root(null).selfUser(null)
  }

  connected = () => this.selfUser() != null

  updateVoiceHandler = () => {
    if (!this.client) {
      return
    }
    if (this.voiceHandler) {
      this.voiceHandler.end()
      // this.voiceHandler = null
    }
    let mode = this.settings.voiceMode
    if (mode === 'cont') {
      this.voiceHandler = new ContinuousVoiceHandler(this.client, this.settings)
    } else if (mode === 'ptt') {
      this.voiceHandler = new PushToTalkVoiceHandler(this.client, this.settings)
    } else if (mode === 'vad') {
      this.voiceHandler = new VADVoiceHandler(this.client, this.settings)
    } else {
      // log(translate('logentry.unknown_voice_mode'), mode)
      return
    }
    this.voiceHandler.on('started_talking', () => {
      if (this.selfUser()) {
        this.selfUser().talking('on')
      }
    })
    this.voiceHandler.on('stopped_talking', () => {
      if (this.selfUser()) {
        this.selfUser().talking('off')
      }
    })
    if (this.selfMute) {
      this.voiceHandler.setMute(true)
    }

    this.client.setAudioQuality(
      this.settings.audioBitrate,
      this.settings.samplesPerPacket
    )
  }

  // messageBoxHint = ko.pureComputed(() => {
  //   if (!this.selfUser()) {
  //     return '' // Not yet connected
  //   }
  //   var target = this.selected()
  //   if (!target) {
  //     target = this.selfUser()
  //   }
  //   if (target === this.selfUser()) {
  //     target = target.channel()
  //   }
  //   if (target.users) { // Channel
  //     return translate('chat.channel_message_placeholder')
  //       .replace('%1', target.name())
  //   } else { // User
  //     return translate('chat.user_message_placeholder')
  //       .replace('%1', target.name())
  //   }
  // })

  submitMessageBox = () => {
    this.sendMessage(this.selected(), this.messageBox)
    this.messageBox = ''
  }

  sendMessage = (target: any, message: any) => {
    if (this.connected()) {
      // If no target is selected, choose our own user
      if (!target) {
        target = this.selfUser()
      }
      // If target is our own user, send to our channel
      if (target === this.selfUser()) {
        target = target.channel()
      }
      // Send message
      target.model.sendMessage(message)
      if (target.users) { // Channel
        this.log.push({
          type: 'chat-message-self',
          message: message,
          channel: target
        })
      } else { // User
        this.log.push({
          type: 'chat-message-self',
          message: message,
          user: target
        })
      }
    }
  }

  requestMove = (user: any, channel: any) => {
    if (this.connected()) {
      user.model.setChannel(channel.model)

      let currentUrl = url.parse(document.location.href, true)
      // delete search param so that query one can be taken into account
      delete currentUrl.search

      // get full channel path
      if (channel.parent()) { // in case self channel is not Root
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

      // reflect self change in URL
      window.history.pushState(null, channel.name(), url.format(currentUrl))
    }
  }

  requestMute = (user: any) => {
    if (user === this.selfUser()) {
      this.selfMute = true
    }
    if (this.connected()) {
      if (user === this.selfUser()) {
        this.client.setselfMute(true)
      } else {
        user.model.setMute(true)
      }
    }
  }

  requestDeaf = (user: any) => {
    if (user === this.selfUser()) {
      this.selfMute = true
      this.selfDeaf = true
    }
    if (this.connected()) {
      if (user === this.selfUser()) {
        this.client.setselfDeaf(true)
      } else {
        user.model.setDeaf(true)
      }
    }
  }

  requestUnmute = (user: any) => {
    if (user === this.selfUser()) {
      this.selfMute = false
      this.selfDeaf = false
    }
    if (this.connected()) {
      if (user === this.selfUser()) {
        this.client.setselfMute(false)
      } else {
        user.model.setMute(false)
      }
    }
  }

  requestUndeaf = (user: any) => {
    if (user === this.selfUser()) {
      this.selfDeaf = false
    }
    if (this.connected()) {
      if (user === this.selfUser()) {
        this.client.setselfDeaf(false)
      } else {
        user.model.setDeaf(false)
      }
    }
  }

  updateLinks() {
    if (!this.selfUser) {
      return
    }

    let allChannels = getAllChannels(this.root, [])
    let ownChannel = this.selfUser().channel().model
    let allLinked = findLinks(ownChannel, [])
    allChannels.forEach(channel => {
      channel.linked(allLinked.indexOf(channel.model) !== -1)
    })

    function findLinks(channel: any, knownLinks: any[]) {
      knownLinks.push(channel)
      channel.links.forEach((next: any) => {
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

    function getAllChannels(channel: any, channels: any[]) {
      channels.push(channel)
      channel.channels().forEach((next: any) => getAllChannels(next, channels))
      return channels
    }
  }

  openSourceCode = () => {
    let homepage = require('../package.json').homepage
    window.open(homepage, '_blank')?.focus()
  }

  updateSize = () => {
    this.minimalView = window.innerWidth < 320
    if (this.minimalView) {
      this.toolbarHorizontal = window.innerWidth < window.innerHeight
    } else {
      this.toolbarHorizontal = !this.settings.toolbarVertical
    }
  }


  muteSelf(mute: boolean) {
    if (this.voiceHandler) {
      this.voiceHandler.setMute(mute)
    }
  }

  toggleToolbarOrientation() {
    this.toolbarHorizontal = !this.toolbarHorizontal
    this.settings.toolbarVertical = !this.toolbarHorizontal
    this.settings.save()
  }
}

function sortChannels(c1: any, c2: any) {
  if (c1.position() === c2.position()) {
    return c1.name() === c2.name() ? 0 : c1.name() < c2.name() ? -1 : 1
  }
  return c1.position() - c2.position()
}

function compareUsers(u1: any, u2: any) {
  return u1.name() === u2.name() ? 0 : u1.name() < u2.name() ? -1 : 1
}

export function initializeUI() {
  let queryParams = url.parse(document.location.href, true).query
  queryParams = Object.assign({}, window.mumbleWebConfig.defaults, queryParams)
  let useJoinDialog = queryParams.joinDialog
  if (queryParams.matrix) {
    useJoinDialog = true
  }
  if (queryParams.address) {
    window.mumbleUi.connectDialog.address = queryParams.address
  } else {
    useJoinDialog = false
  }
  if (queryParams.port) {
    window.mumbleUi.connectDialog.port = queryParams.port
  } else {
    useJoinDialog = false
  }
  if (queryParams.token) {
    let tokens = queryParams.token
    if (!Array.isArray(tokens)) {
      tokens = [tokens]
    }
    window.mumbleUi.connectDialog.tokens = tokens
  }
  if (queryParams.username) {
    window.mumbleUi.connectDialog.username = queryParams.username
  } else {
    useJoinDialog = false
  }
  if (queryParams.password) {
    window.mumbleUi.connectDialog.password = queryParams.password
  }
  if (queryParams.channelName) {
    window.mumbleUi.connectDialog.channelName = queryParams.channelName
  }
  if (queryParams.avatarurl) {
    // Download the avatar and upload it to the mumble server when connected
    let url = queryParams.avatarurl
    console.log('Fetching avatar from', url)
    let req = new window.XMLHttpRequest()
    req.open('GET', url, true)
    req.responseType = 'arraybuffer'
    req.onload = () => {
      let upload = () => {
        if (req.response) {
          console.log('Uploading user avatar to server')
          window.mumbleUi.client.setSelfTexture(req.response)
        }
      }
      // On any future connections
      // window.mumbleUi.thisUser.subscribe((thisUser:any) => {
      //   if (thisUser) {
      //     upload()
      //   }
      // })
      // And the current one (if already connected)
      if (window.mumbleUi.thisUser()) {
        upload()
      }
    }
    req.send()
  }
  window.mumbleUi.connectDialog.joinOnly = useJoinDialog

  window.onresize = () => window.mumbleUi.updateSize()
  window.mumbleUi.updateSize()
}


export function log (argList:string[]) {
  console.log.apply(console, argList)
  let args = []
  for (let i = 0; i < argList.length; i++) {
    args.push(argList[i])
  }
  window.mumbleUi.log.push({
    type: 'generic',
    value: args.join(' ')
  })
}