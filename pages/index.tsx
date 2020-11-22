import '../styles/MetroMumbleDark/main.scss'
import '../styles/MetroMumbleDark/loading.scss'
import React from 'react'
import GlobalBindings, {initializeUI, log} from "../utils/index";
import MatrixWidget from "../utils/MatrixWidget"
import {initVoice} from "../utils/voice";


//************ INDEX ****************/
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
    }//config.js“
    window.mumbleUi = new GlobalBindings(window.mumbleWebConfig)
    async function main() {
      // await localizationInitialize(navigator.language);
      // translateEverything();
      initializeUI();
      initVoice((data:any) => {
        // if (testVoiceHandler) {
        //   testVoiceHandler.write(data)
        // }
        if (!window.mumbleUi.client) {
          if (window.mumbleUi.voiceHandler) {
            window.mumbleUi.voiceHandler.end()
          }
          window.mumbleUi.voiceHandler = null
        } else if (window.mumbleUi.voiceHandler) {
          window.mumbleUi.voiceHandler.write(data)
        }
      }, (err:any) => {
        log(['logentry.mic_init_error', err])
      })
    }
    window.onload = main
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

//********* COMPONENTS **************//
const IndexPage = () => {
  let props = {
    visible: "true",
    isMinimal: "true",
    joinOnly: "false"
  }
  return (
    <>
      <Loading/>
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
        <ConnectBoxDialog/>
      </>
    )
  } else if (visible && joinOnly) {
    return (
      <>
        <ConnectBoxDialog/>
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
      <div className="connect-dialog dialog">
        <div id="connect-dialog_title" className="dialog-header">
          Connect to Server
        </div>
        <form onSubmit={this.handleSubmit}>
          <table>
            <tbody>
            <tr /*data-bind="if: $root.config.connectDialog.address"*/>
              <td id="connect-dialog_input_address">Address</td>
              <td><input name="address" id="address" type="text" value={this.state.address} onChange={this.handleChange}
                         required/></td>
            </tr>
            <tr /*data-bind="if: $root.config.connectDialog.port"*/>
              <td id="connect-dialog_input_port">Port</td>
              <td><input name="port" id="port" type="text" value={this.state.port} onChange={this.handleChange}
                         required/></td>
            </tr>
            <tr /*data-bind="if: $root.config.connectDialog.username"*/>
              <td id="connect-dialog_input_username">Username</td>
              <td><input name="username" id="username" type="text" value={this.state.username}
                         onChange={this.handleChange} required/></td>
            </tr>
            <tr /*data-bind="if: $root.config.connectDialog.password"*/>
              <td id="connect-dialog_input_password">Password</td>
              <td><input name="password" id="password" type="text" value={this.state.password}
                         onChange={this.handleChange}/></td>
            </tr>
            <tr /*data-bind="if: $root.config.connectDialog.token"*/>
              <td id="connect-dialog_input_tokens">Tokens</td>
              <td>
                <input type="text" data-bind='value: tokenToAdd, valueUpdate: "afterkeydown"'/>
              </td>
            </tr>
            <tr data-bind="if: $root.config.connectDialog.token">
              <td></td>
              <td>
                <button id="connect-dialog_controls_remove" className="dialog-submit" type="button"
                        data-bind="enable: selectedTokens().length > 0, click: removeSelectedTokens()">Remove
                </button>
                <button id="connect-dialog_controls_add" className="dialog-submit" type="button"
                        data-bind="enable: tokenToAdd().length > 0, click: addToken()">Add
                </button>
              </td>
            </tr>
            <tr data-bind="if: $root.config.connectDialog.token, visible: tokens().length > 0">
              <td></td>
              <td><select id="token" /**!multiple='true'*/ /**height="5"*/
                          data-bind="options:tokens, selectedOptions:selectedTokens"></select></td>
            </tr>
            <tr data-bind="if: $root.config.connectDialog.channelName">
              <td>Channel</td>
              <td><input id="channelName" type="text" data-bind="value: channelName"/></td>
            </tr>
            </tbody>
          </table>
          <div className="dialog-footer">
            <input id="connect-dialog_controls_cancel" className="dialog-close" type="button" data-bind="click: hide"
                   value="Cancel"/>
            <input id="connect-dialog_controls_connect" className="dialog-submit" type="submit" value="Connect"/>
          </div>
        </form>
      </div>
    )
  }
}

