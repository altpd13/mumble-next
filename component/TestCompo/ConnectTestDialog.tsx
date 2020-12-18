import React from 'react'

export default class ConnectTestDialog extends React.Component<any, any> {

  clickMe() {
    window.mumbleUi.connectDialog.address = 'voice.johni0702.de'
    window.mumbleUi.connectDialog.port = '433/demo'
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