import { Transform } from 'stream'

const mumbleConnect = require('mumble-client-websocket')
const toArrayBuffer = require('to-arraybuffer')
const chunker = require('stream-chunker')
const Resampler = require('libsamplerate.js')
const CodecBrowser = require('mumble-client-codecs-browser')

export class Worker {
  sampleRate:number
  nextClientId:number
  nextVoiceId:number
  voiceStreams: any[]
  clients: any[]
  constructor() {
    this.sampleRate = 48000
    this.nextClientId = 1
    this.nextVoiceId = 1
    this.voiceStreams = []
    this.clients = []

  }

  postMessage (msg:any, transfer:any = null) {
    try {
      self.postMessage(msg, transfer)
    } catch (err) {
      console.error('Failed to postMessage', msg)
      throw err
    }
  }

  resolve (reqId:any, value:any, transfer:any = null) {
    postMessage({
      reqId: reqId,
      result: value
    }, transfer)
  }

  reject (reqId:any, value:any, transfer:any = null) {
    console.error(value)
    let jsonValue = JSON.parse(JSON.stringify(value))
    if (value.$type) {
      jsonValue.$type = { name: value.$type.name }
    }
    postMessage({
      reqId: reqId,
      error: jsonValue
    }, transfer)
  }

  registerEventProxy (id:any, obj:any, event:any, transform: any = null) {
    obj.on(event, function (_: any) {
      postMessage({
        clientId: id.client,
        channelId: id.channel,
        userId: id.user,
        event: event,
        value: transform ? transform.apply(null, arguments) : Array.from(arguments)
      }, _)
    })
  }

  pushProp (id:any, obj:any, prop:any, transform:any = null) {
    let value = obj[prop]
    this.postMessage({
      clientId: id.client,
      channelId: id.channel,
      userId: id.user,
      prop: prop,
      value: transform ? transform(value) : value
    },null)
  }

  setupOutboundVoice (voiceId:any, samplesPerPacket:any, stream:any) {
    let resampler = new Resampler({
      unsafe: true,
      type: Resampler.Type.SINC_FASTEST,
      ratio: 48000 / this.sampleRate
    })

    let buffer2Float32Array = new Transform({
      transform (data, _, callback) {
        callback(null, new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4))
      },
      readableObjectMode: true
    })

    resampler
      .pipe(chunker(4 * samplesPerPacket))
      .pipe(buffer2Float32Array)
      .pipe(stream)

    this.voiceStreams[voiceId] = resampler
  }

  setupChannel (id: any, channel:any) {
    id = Object.assign({}, id, { channel: channel.id })

    this.registerEventProxy(id, channel, 'update', (props: any) => {
      if (props.parent) {
        props.parent = props.parent.id
      }
      if (props.links) {
        props.links = props.links.map((it:any) => it.id)
      }
      return [props]
    })
    this.registerEventProxy(id, channel, 'remove')

    this.pushProp(id, channel, 'parent', (it:any) => it ? it.id : it)
    this.pushProp(id, channel, 'links', (it:any) => it.map((it:any) => it.id))
    let props = [
      'position', 'name', 'description'
    ]
    for (let prop of props) {
      this.pushProp(id, channel, prop)
    }

    for (let child of channel.children) {
      this.setupChannel(id, child)
    }

    return channel.id
  }

  setupUser (id: any, user:any) {
    id = Object.assign({}, id, { user: user.id })

    this.registerEventProxy(id, user, 'update', (actor:any, props:any) => {
      if (actor) {
        actor = actor.id
      }
      if (props.channel != null) {
        props.channel = props.channel.id
      }
      return [actor, props]
    })
    this.registerEventProxy(id, user, 'voice', (stream:any) => {
      let voiceId = this.nextVoiceId++

      let target: any

      // We want to do as little on the UI thread as possible, so do resampling here as well
      var resampler = new Resampler({
        unsafe: true,
        type: Resampler.Type.ZERO_ORDER_HOLD,
        ratio: this.sampleRate / 48000
      })

      // Pipe stream into resampler
      stream.on('data', (data:any) => {
        // store target so we can pass it on after resampling
        target = data.target
        resampler.write(Buffer.from(data.pcm.buffer))
      }).on('end', () => {
        resampler.end()
      })

      // Pipe resampler into output stream on UI thread
      resampler.on('data', (data:any) => {
        data = toArrayBuffer(data) // postMessage can't transfer node's Buffer
        this.postMessage({
          voiceId: voiceId,
          target: target,
          buffer: data
        }, [data])
      }).on('end', () => {
        this.postMessage({
          voiceId: voiceId
        })
      })

      return [voiceId]
    })
    this.registerEventProxy(id, user, 'remove')

    this.pushProp(id, user, 'channel', (it:any) => it ? it.id : it)
    let props = [
      'uniqueId', 'username', 'mute', 'deaf', 'suppress', 'selfMute', 'selfDeaf',
      'texture', 'textureHash', 'comment'
    ]
    for (let prop of props) {
      this.pushProp(id, user, prop)
    }

    return user.id
  }

  setupClient (id:any, client:any) {
    id = { client: id }

    this.registerEventProxy(id, client, 'error')
    this.registerEventProxy(id, client, 'denied', (it:any) => [it])
    this.registerEventProxy(id, client, 'newChannel', (it:any) => [this.setupChannel(id, it)])
    this.registerEventProxy(id, client, 'newUser', (it:any) => [this.setupUser(id, it)])
    this.registerEventProxy(id, client, 'message', (sender:any, message:any, users:any, channels:any, trees:any) => {
      return [
        sender.id,
        message,
        users.map((it:any) => it.id),
        channels.map((it:any) => it.id),
        trees.map((it:any) => it.id)
      ]
    })
    client.on('dataPing', () => {
      this.pushProp(id, client, 'dataStats')
    })

    this.setupChannel(id, client.root)
    for (let user of client.users) {
      this.setupUser(id, user)
    }

    this.pushProp(id, client, 'root', (it:any) => it.id)
    this.pushProp(id, client, 'self', (it:any) => it.id)
    this.pushProp(id, client, 'welcomeMessage')
    this.pushProp(id, client, 'serverVersion')
    this.pushProp(id, client, 'maxBandwidth')
  }

  onMessage (data:any) {
    let { reqId, method, payload } = data
    if (method === '_init') {
      this.sampleRate = data.sampleRate
    } else if (method === '_connect') {
      payload.args.codecs = CodecBrowser
      mumbleConnect(payload.host, payload.args).then((client:any) => {
        let id = this.nextClientId++
        this.clients[id] = client
        this.setupClient(id, client)
        return id
      }).done((id:any) => {
        this.resolve(reqId, id)
      }, (err:any) => {
        this.reject(reqId, err)
      })
    } else if (data.clientId != null) {
      let client = this.clients[data.clientId]

      let target
      if (data.userId != null) {
        target = client.getUserById(data.userId)
        if (method === 'setChannel') {
          payload = [client.getChannelById(payload)]
        }
      } else if (data.channelId != null) {
        target = client.getChannelById(data.channelId)
      } else {
        target = client
        if (method === 'createVoiceStream') {
          let voiceId = payload.shift()
          let samplesPerPacket = payload.shift()

          let stream = target.createVoiceStream.apply(target, payload)

          this.setupOutboundVoice(voiceId, samplesPerPacket, stream)
          return
        }
        if (method === 'disconnect') {
          delete this.clients[data.clientId]
        }
      }

      target[method].apply(target, payload)
    } else if (data.voiceId != null) {
      let stream = this.voiceStreams[data.voiceId]
      let buffer = data.chunk
      if (buffer) {
        stream.write(Buffer.from(buffer))
      } else {
        delete this.voiceStreams[data.voiceId]
        stream.end()
      }
    }
  }
}

self.addEventListener('message', (ev:any) => {
  try {
    const w = new Worker()
    w.onMessage(ev.data)
  } catch (ex) {
    console.error('exception during message event', ev.data, ex)
  }
})