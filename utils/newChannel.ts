import openContextMenu from "./openContextMenu";

const newChannel = (channel: any,channels:any,setChannels:any) => {
  const simpleProperties = {
    position: 'position',
    name: 'name',
    description: 'description'
  }
  let ui: any = channel.__ui = {
    model: channel,
    expanded: true,
    parent: null,
    channels: [],
    users: [],
    linked: false
  }

  ui.userCount = () => {
    return ui.channels().reduce((acc: number, c: any) => acc + c.userCount(), ui.users().length)
  }
  ui.openContextMenu = (event: any) => openContextMenu(event, window.mumbleUi.channelContextMenu, ui)

  Object.entries(simpleProperties).forEach(key => {
    ui[key[1]] = channel[key[0]]
  })
  if (channel.parent) {
    ui.parent = channel.parent.__ui
    ui.parent.channels.push(ui)
    ui.parent.channels.sort(sortChannels)
  }
  setChannels(channels => [...channels,channel])
  updateLinks()

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
      updateLinks()
    }
  }).on('remove', () => {
    if (ui.parent()) {
      ui.parent().channels.remove(ui)
    }
    updateLinks()
  })
}

function sortChannels(c1: any, c2: any) {
  if (c1.position === c2.position) {
    return c1.name === c2.name ? 0 : c1.name < c2.name ? -1 : 1
  }
  return c1.position - c2.position
}


function updateLinks() {
  if (!window.mumbleUi.selfUser) {
    return
  }

  let allChannels = getAllChannels(window.mumbleUi.root, [])
  let ownChannel = window.mumbleUi.selfUser.channel.model
  let allLinked = findLinks(ownChannel, [])
  allChannels.forEach(channel => {
    channel.linked = allLinked.indexOf(channel.model) !== -1
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
    channel.channels.forEach((next: any) => getAllChannels(next, channels))
    return channels
  }
}

export default newChannel