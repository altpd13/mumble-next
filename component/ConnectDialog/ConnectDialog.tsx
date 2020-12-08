import React from "react";



export default class ConnectDialog extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = {
      address: '',
      port: '',
      username: '',
      password: '',
      placeholderA: 'northamerica.mumble.com',
      placeholderP: '5401',
      placeholderU: 'alt',
      hide: false
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.hideDialog = this.hideDialog.bind(this)
  }

  handleChange = (event: any) => {

    this.setState({
      [event.target.name]: event.target.value
    })
  }

  handleSubmit(event: any) {
    alert(`
      Address ${this.state.address}
      Port ${this.state.port}
      UserName ${this.state.username}
      PassWord ${this.state.password}
    `)
    window.mumbleUi.connectDialog.address = this.state.address
    window.mumbleUi.connectDialog.port = this.state.port
    window.mumbleUi.connectDialog.username = this.state.username
    window.mumbleUi.connectDialog.password = this.state.password
    window.mumbleUi.connectDialog.connect(window.mumbleUi)
    this.hideDialog()
    event.preventDefault()
  }
  hideDialog() {
    this.setState((state:any) => ({
      hide : !state.hide
    }))
  }
  render() {
    if(!this.state.hide) {
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
                <td><input name="address" id="address" type="text" value={this.state.address}
                           onChange={this.handleChange}
                           placeholder={this.state.placeholderA}
                           required/></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.port"*/>
                <td id="connect-dialog_input_port">Port</td>
                <td><input name="port" id="port" type="text" value={this.state.port} onChange={this.handleChange}
                           placeholder={this.state.placeholderP}
                           required/></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.username"*/>
                <td id="connect-dialog_input_username">Username</td>
                <td><input name="username" id="username" type="text" value={this.state.username}
                           onChange={this.handleChange}
                           placeholder={this.state.placeholderU}
                           required/></td>
              </tr>
              <tr /*data-bind="if: $root.config.connectDialog.password"*/>
                <td id="connect-dialog_input_password">Password</td>
                <td><input name="password" id="password" type="text" value={this.state.password}
                           onChange={this.handleChange}/></td>
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
                     onClick={this.hideDialog} value="Cancel"/>
              {/*<button className="dialog-close" >Cancel</button>*/}
              <input id="connect-dialog_controls_connect" className="dialog-submit" type="submit" value="Connect"/>
            </div>
          </form>
        </div>
      )
    } else {
      return <></>
    }
  }
}
