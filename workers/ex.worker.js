// import CodecsBrowser from "mumble-client-codecs-browser";
import mumbleConnect from "mumble-client-websocket";

let sampleRate
let nextClientId = 1
let clients = []

// function onMessage(data) {
//   let {reqId, method, payload} = data
//   if (method === '_init') {
//     sampleRate = data.sampleRate
//   } else if (method === '_connect') {
//     payload.args.codecs = CodecsBrowser
//     mumbleConnect(payload.host, payload.args).then((client) => {
//       let id = nextClientId++
//       clients[id] = client
//       setupClient(id, client)
//       return id
//     }).done((id) => {
//       resolve(reqId, id)
//     }, (err) => {
//       reject(reqId, err)
//     })
//   } else if (data.clientId != null) {
//     let client = clients[data.clientId]
//
//     let target
//     if (data.userId != null) {
//       target = client.getUserById(data.userId)
//       if (method === 'setChannel') {
//         payload = [client.getChannelById(payload)]
//       }
//     } else if (data.channelId != null) {
//       target = client.getChannelById(data.channelId)
//     } else {
//       target = client
//       if (method === 'createVoiceStream') {
//         let voiceId = payload.shift()
//         let samplesPerPacket = payload.shift()
//
//         let stream = target.createVoiceStream.apply(target, payload)
//
//         setupOutboundVoice(voiceId, samplesPerPacket, stream)
//         return
//       }
//       if (method === 'disconnect') {
//         delete clients[data.clientId]
//       }
//     }
//
//     target[method].apply(target, payload)
//   } else if (data.voiceId != null) {
//     let stream = voiceStreams[data.voiceId]
//     let buffer = data.chunk
//     if (buffer) {
//       stream.write(Buffer.from(buffer))
//     } else {
//       delete voiceStreams[data.voiceId]
//       stream.end()
//     }
//   }
// }

// self.addEventListener('message', (event) =>{
//   try {
//     onMessage(event.data)
//   } catch (ex) {
//     console.error('Exception Message event',event.data,ex)
//     console.log('error')
//   }
// })
function tryConnect(data) {
  let {reqId, method, payload} = data
  if (method === '_connect') {
    payload.args.codecs = 1
    mumbleConnect(payload.host, payload.args).then((client) => {
      let id = nextClientId++
      clients[id] = client
      setupClient(id, client)
      return id
    }).done((id) => {
      resolve(reqId, id)
    }, (err) => {
      reject(reqId, err)
    })
  }
}

function setupClient(id, client) {
  id = {client: id}

  registerEventProxy(id, client, 'error')
  registerEventProxy(id, client, 'newChannel', (it) => [setupChannel(id, it)])
  registerEventProxy(id, client, 'newUser', (it) => [setupUser(id, it)])
  registerEventProxy(id, client, 'message', (sender, message, users, channels, trees) => {
    return [
      sender.id,
      message,
      users.map((it) => it.id),
      channels.map((it) => it.id),
      trees.map((it) => it.id)
    ]
  })
  client.on('dataPing', () => {
    pushProp(id, client, 'dataStats')
  })

  setupChannel(id, client.root)
  for (let user of client.users) {
    setupUser(id, user)
  }

  pushProp(id, client, 'root', (it) => it.id)
  pushProp(id, client, 'self', (it) => it.id)
  pushProp(id, client, 'welcomeMessage')
  pushProp(id, client, 'serverVersion')
  pushProp(id, client, 'maxBandwidth')
}

function registerEventProxy(id, obj, event, transform) {
  obj.on(event, function (_) {
    postMessage({
      clientId: id.client,
      channelId: id.channel,
      userId: id.user,
      event: event,
      value: transform ? transform.apply(null, arguments) : Array.from(arguments)
    })
  })
}


function setupChannel(id, channel) {
  id = Object.assign({}, id, {channel: channel.id})

  registerEventProxy(id, channel, 'update', (actor, props) => {
    if (actor) {
      actor = actor.id
    }
    if (props.parent) {
      props.parent = props.parent.id
    }
    if (props.links) {
      props.links = props.links.map((it) => it.id)
    }
    return [actor, props]
  })
  registerEventProxy(id, channel, 'remove')

  pushProp(id, channel, 'parent', (it) => it ? it.id : it)
  pushProp(id, channel, 'links', (it) => it.map((it) => it.id))
  let props = [
    'position', 'name', 'description'
  ]
  for (let prop of props) {
    pushProp(id, channel, prop)
  }

  for (let child of channel.children) {
    setupChannel(id, child)
  }

  return channel.id
}

function pushProp(id, obj, prop, transform) {
  let value = obj[prop]
  postMessage({
    clientId: id.client,
    channelId: id.channel,
    userId: id.user,
    prop: prop,
    value: transform ? transform(value) : value
  })
}

self.addEventListener('message', (ev) => {
  try {
    tryConnect(ev.data)
  } catch (ex) {
    console.error('exception during message event', ev.data, ex)
  }
})

self.addEventListener('message', (event) => console.log('Worker received:', event.data))
self.postMessage('Fuck you Main Thread')