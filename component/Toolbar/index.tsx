import React from 'react'
import ConnectionInfoDialog from "../ConnectionInfoDialog/ConnectionInfoDialog"
import SettingsDialog from "../SettingsDialog/SettingsDialog";

class Toolbar extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = {
      toolbarHorizontal: false,
      showInfo: false,
      showSettings: false,
      mute: false,
      deaf: false
    }
    this.changeToolbarDir = this.changeToolbarDir.bind(this)
    this.hideConnectDialog = this.hideConnectDialog.bind(this)
    this.onShowInfoChange = this.onShowInfoChange.bind(this)
    this.onShowSettingsChange = this.onShowSettingsChange.bind(this)
    this.showInfoCD = this.showInfoCD.bind(this)
    this._requestDeaf = this._requestDeaf.bind(this)
    this._requestUnDeaf = this._requestUnDeaf.bind(this)
    this._requestMute = this._requestMute.bind(this)
    this._requestUnmute = this._requestUnmute.bind(this)
    this.onMuteChange = this.onMuteChange.bind(this)
    this.onDeafChange = this.onDeafChange.bind(this)
  }

  changeToolbarDir() {
    this.setState((state: any) => ({
      toolbarHorizontal: !state.toolbarHorizontal
    }))
  }

  hideConnectDialog() {
    this.props.onHide(!this.props.hide)
  }

  onShowInfoChange() {
    this.setState((state: any) => ({
      showInfo: !state.showInfo
    }))
  }

  showInfoCD() {
    if (window.mumbleUi.selfUser) {
      window.mumbleUi.connectionInfo.update()
      this.onShowInfoChange()
    } else console.log('no selfUser exists')
  }

  onShowSettingsChange() {
    window.mumbleUi.openSettings()
    this.setState((state:any) => ({
      showSettings: !state.showSettings
    }))
  }

  _requestDeaf() {
    this.setState(() => ({mute: true, deaf: true}))
  }

  _requestUnDeaf() {
    this.setState(() => ({deaf: false}))
  }

  onDeafChange() {
    if (!this.state.deaf) {
      this._requestDeaf()
      window.mumbleUi.requestDeaf(window.mumbleUi.selfUser)
    } else {
      this._requestUnDeaf()
      window.mumbleUi.requestUndeaf(window.mumbleUi.selfUser)
    }
  }

  _requestMute() {
    this.setState(()=>({mute: true}))
  }

  _requestUnmute() {
    this.setState(() => ({mute: false, deaf: false}))
  }

  onMuteChange() {
    if (!this.state.mute) {
      this._requestMute()
      window.mumbleUi.requestMute(window.mumbleUi.selfUser)
    } else {
      this._requestUnmute()
      window.mumbleUi.requestUnmute(window.mumbleUi.selfUser)
    }
  }

  render() {
    return (
      <>
        <div className={this.state.toolbarHorizontal ? `toolbar toolbar-horizontal` : `toolbar toolbar-vertical`}>
          {this.state.toolbarHorizontal ?
            <img className="handle-horizontal" src="/svg/handle_horizontal.svg" onClick={this.changeToolbarDir}/> :
            <img className="handle-vertical" src="/svg/handle_vertical.svg" onClick={this.changeToolbarDir}/>}
          <img className="tb-connect" alt="connect" src="/svg/applications-internet.svg"
               onClick={this.hideConnectDialog}/>
          <img className="tb-information" alt="information" src="/svg/information_icon.svg" onClick={this.showInfoCD}/>
          <div className="divider"/>
          {!this.state.mute ?
            <img className="tb-mute" alt="mute" src="/svg/audio-input-microphone.svg" onClick={this.onMuteChange}/> :
            <img className="tb-unmute tb-active" alt="unmute" src="/svg/audio-input-microphone-muted.svg" onClick={this.onMuteChange}/>
          }
          {!this.state.deaf ?
            <img className="tb-deaf" alt="deaf" src="/svg/audio-output.svg" onClick={this.onDeafChange}/> :
            <img className="tb-undeaf tb-active" alt="undeaf" src="/svg/audio-output-deafened.svg" onClick={this.onDeafChange}/>
          }
          <img className="tb-record" alt="record" src="/svg/media-record.svg"/>
          <div className="divider"/>
          <img className="tb-comment" alt="comment" src="/svg/toolbar-comment.svg"/>
          <div className="divider"/>
          <img className="tb-settings" alt="settings" src="/svg/config_basic.svg" onClick={this.onShowSettingsChange}/>
          <div className="divider"/>
          <img className="tb-sourcecode" data-bind="click: openSourceCode"
               alt="Source Code" src="/svg/source-code.svg" onClick={()=>{window.mumbleUi.openSourceCode()}}/>
        </div>
        <div>{this.state.showInfo ?
          <ConnectionInfoDialog show={this.state.showInfo} onShow={this.onShowInfoChange}/> : null}</div>
        <div>
          {this.state.showSettings ?
            <SettingsDialog show={this.state.showSettings} onShow={this.onShowSettingsChange}/>: null
          }
        </div>
      </>
    )
  }
}

export default Toolbar