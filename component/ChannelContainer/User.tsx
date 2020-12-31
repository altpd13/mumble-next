import {useEffect, useState} from "react"
import compareUsers from "../../utils/compareUsers";
import openContextMenu from "../../utils/openContextMenu";
import vad from 'voice-activity-detection'

const BufferQueueNode = require('web-audio-buffer-queue')
const audioContext = require('audio-context')

export const User = ({user}: any) => {
  const [userinfo, setUserinfo] = useState({})
  const [userTalk, setTalk] = useState(false)
  const [userDeaf, setDeaf] = useState()
  const [userMute, setMute] = useState()
  const [isUserSelf, setUserSelf] = useState(false)

  useEffect(() => {
    console.log(window.mumbleUi.connectDialog.username)
      if (window.mumbleUi.connectDialog.username === user.username) {
        console.log('selfUser')
        setUserSelf(true)
        let level = window.mumbleUi.settings.vadLevel

        vad(audioContext(), window.mumbleUi._micStream, {
          onVoiceStart() {
            setTalk(true)
          },
          onVoiceStop() {
            setTalk(false)
          },
          noiseCaptureDuration: 0,
          minNoiseLevel: level,
          maxNoiseLevel: level
        })
      }
    setUserinfo({user})
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
      channel: null
    }
    // ui.texture = ko.pureComputed(() => {
    //   let raw = ui.rawTexture()
    //   if (!raw || raw.offset >= raw.limit) return null
    //   return 'data:image/*;base64,' + ByteBuffer.wrap(raw).toBase64()
    // })
    ui.show_avatar = () => {
      let setting = window.mumbleUi.settings.showAvatars
      switch (setting) {
        case 'always':
          break
        case 'own_channel':
          if (window.mumbleUi.selfUser.channel() !== ui.channel()) return false
          break
        case 'linked_channel':
          if (!ui.channel().linked) return false
          break
        case 'minimal_only':
          if (!window.mumbleUi.minimalView) return false
          if (window.mumbleUi.selfUser.channel() !== ui.channel()) return false
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
    ui.openContextMenu = (event: any) => openContextMenu(event, window.mumbleUi.userContextMenu, ui)

    ui.toggleMute = () => {
      if (ui.selfMute()) {
        window.mumbleUi.requestUnmute(ui)
      } else {
        window.mumbleUi.requestMute(ui)
      }
    }
    ui.toggleDeaf = () => {
      if (ui.selfDeaf()) {
        window.mumbleUi.requestUndeaf(ui)
      } else {
        window.mumbleUi.requestDeaf(ui)
      }
    }
    ui.viewAvatar = () => {
      window.mumbleUi.avatarView = ui.texture()
    }
    ui.changeAvatar = () => {
      let input = document.createElement('input')
      input.type = 'file'
      input.addEventListener('change', () => {
        let reader = new window.FileReader()
        reader.onload = () => {
          window.mumbleUi.client.setSelfTexture(reader.result)
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
    ui.state = ui.userToState
    if (user.channel) {
      ui.channel = user.channel.__ui
      ui.channel.users.push(ui)
      ui.channel.users.sort(compareUsers)
    }

    user.on('update', (actor: any, properties: any) => {
      const {selfMute, selfDeaf} = properties
      setMute(selfMute)
      setDeaf(selfDeaf)
      Object.entries(simpleProperties).forEach(key => {
        if (properties[key[0]] !== undefined) {
          ui[key[1]] = properties[key[0]]
        }
      })
      if (properties.channel !== undefined) {
        if (ui.channel) {
          ui.channel.users.remove
        }
        ui.channel = properties.channel.__ui
        ui.channel.users.push(ui)
        ui.channel.users.sort(compareUsers)
        window.mumbleUi.updateLinks()
      }
      if (properties.textureHash !== undefined) {
        // Invalidate avatar texture when its hash has changed
        // If the avatar is still visible, self will trigger a fetch of the new one.
        ui.rawTexture(null)
      }
    }).on('remove', () => {
      console.log('remove')
      if (ui.channel) {
        const itemToFind = ui.channel.users.find(function (item: any) {
          return item === ui
        })
        const idx = ui.channel.users.indexOf(itemToFind)
        if (idx > -1) ui.channel.users.splice(idx, 1)
        // ui.channel.users.remove(ui)
      }
    }).on('voice', (stream: any) => {
      let userNode: any
      userNode = new BufferQueueNode({
        audioContext: audioContext()
      })
      userNode.connect(audioContext().destination)
      if (stream.target === 'normal') {
        ui.talking = 'on'
        setTalk(true)
      } else if (stream.target === 'shout') {
        ui.talking = 'shout'
      } else if (stream.target === 'whisper') {
        ui.talking = 'whisper'
      }

      stream.on('data', (data: any) => {
        if (window.mumbleUi.webrtc) {
          // mumble-client is in WebRTC mode, no pcm data should arrive this way
        } else {
          userNode.write(data.buffer)
        }
      }).on('end', () => {
        // console.log(`User ${user.username} stopped takling`)
        ui.talking = 'off'
        setTalk(false)
        if (!window.mumbleUi.webrtc) {
          userNode.end()
        }
      })
    })
  }, [user])
  if (!isUserSelf) {
    return (
      <div className="user-wrapper">
        <div className="user">
          {userTalk ? <img className="user-talk" src="svg/talking_on.svg"/> :
            <img className="user-talk user-talk-off" src="svg/talking_off.svg"/>}
          {user.username}
          <div className="user-status">
            {userDeaf ? <img className="user-self-deaf" src="svg/deafened_self.svg"/> : null}
            {userMute ? <img className="user-self-mute" src="svg/muted_self.svg"/> : null}
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="user-wrapper">
        <div className="user">
          {userTalk && !userMute ? <img className="user-talk" src="svg/talking_on.svg"/> :
            <img className="user-talk user-talk-off" src="svg/talking_off.svg"/>}
          {user.username}
          <div className="user-status">
            {userDeaf ? <img className="user-self-deaf" src="svg/deafened_self.svg"/> : null}
            {userMute ? <img className="user-self-mute" src="svg/muted_self.svg"/> : null}
          </div>
        </div>
      </div>
    )
  }
}