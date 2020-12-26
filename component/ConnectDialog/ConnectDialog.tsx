import React, {useState} from "react";
import GlobalBindings, {log} from "../../utils";
import compareUsers from "../../utils/compareUsers";
import connect from "../../utils/connect";
import openContextMenu from "../../utils/openContextMenu";
// @ts-ignore
// import audioContext from 'audio-context'
const audioContext = require('audio-context')
const BufferQueueNode = require('web-audio-buffer-queue')

const ConnectDialog = (props: any) => {
  const [inputs, setInputs] = useState({
    address: `voice.johni0702.de`,
    port: '433/demo',
    username: '',
    password: ''
  })

  const hideDialog = () => {
    props.onHide(!props.hide)
  }

  function connectToServer(ui: GlobalBindings) {
    if (ui.detectWebRTC) {
      ui.webrtc = true
    }
    connect(window.mumbleUi.connectDialog.username,
      window.mumbleUi.connectDialog.address,
      window.mumbleUi.connectDialog.port,
      window.mumbleUi.connectDialog.tokens,
      window.mumbleUi.connectDialog.password,
      window.mumbleUi.connectDialog.channelName,
      props.setMessages, props.messages, props.channels, props.setChannels)
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

export default ConnectDialog