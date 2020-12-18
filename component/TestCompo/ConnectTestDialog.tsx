import React from 'react'

export default class ConnectTestDialog extends React.Component<any, any> {

  clickMe() {
    window.mumbleUi.connectDialog.address = 'northamerica.mumble.com'
    window.mumbleUi.connectDialog.port = '5401'
    window.mumbleUi.connectDialog.username = 'alt'
    window.mumbleUi.connectDialog.connect(window.mumbleUi)
  }
  render() {
    return (
      <button onClick={this.clickMe}>
        Connect
      </button>
    )
  }
}