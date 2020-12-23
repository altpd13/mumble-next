import React, {useState} from "react";
import ConnectTestDialog from "../TestCompo/ConnectTestDialog";

const ConnectDialog1 = (props: any) => {
  const [inputs, setInputs] = useState({
    address: '',
    port: '',
    username: '',
    password: ''
  })

  const hideDialog = () => {
    props.onHide(!props.hide)
  }

  const {address, port, username, password} = inputs

  const handleChange = (event: any) => {
    const [name, value] = event.target
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
    window.mumbleUi.connectDialog.connect(window.mumbleUi)
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
              {/*<tr /*data-bind="if: $root.config.connectDialog.token"*/}
              {/*  <td id="connect-dialog_input_tokens">Tokens</td>*/}
              {/*  <td>*/}
              {/*    <input type="text" data-bind='value: tokenToAdd, valueUpdate: "afterkeydown"'/>*/}
              {/*  </td>*/}
              {/*</tr>*/}
              {/*<tr data-bind="if: $root.config.connectDialog.token">*/}
              {/*  <td></td>*/}
              {/*  <td>*/}
              {/*    <button id="connect-dialog_controls_remove" className="dialog-submit" type="button"*/}
              {/*            data-bind="enable: selectedTokens().length > 0, click: removeSelectedTokens()">Remove*/}
              {/*    </button>*/}
              {/*    <button id="connect-dialog_controls_add" className="dialog-submit" type="button"*/}
              {/*            data-bind="enable: tokenToAdd().length > 0, click: addToken()">Add*/}
              {/*    </button>*/}
              {/*  </td>*/}
              {/*</tr>*/}
              {/*<tr data-bind="if: $root.config.connectDialog.token, visible: tokens().length > 0">*/}
              {/*  <td></td>*/}
              {/*  <td><select id="token" multiple={true} /**height="5"*/}
              {/*              data-bind="options:tokens, selectedOptions:selectedTokens"></select></td>*/}
              {/*</tr>*/}
              {/*<tr data-bind="if: $root.config.connectDialog.channelName">*/}
              {/*  <td>Channel</td>*/}
              {/*  <td><input id="channelName" type="text" data-bind="value: channelName"/></td>*/}
              {/*</tr>*/}
              </tbody>
            </table>
            <div className="dialog-footer">
              <input id="connect-dialog_controls_cancel" className="dialog-close" type="button"
                     onClick={hideDialog} value="Cancel"/>
              {/*<button className="dialog-close" >Cancel</button>*/}
              <input id="connect-dialog_controls_connect" className="dialog-submit" type="submit" value="Connect"/>
            </div>
            <ConnectTestDialog/>
          </form>
        </div>
      }
    </>
  )
}

export default ConnectDialog1