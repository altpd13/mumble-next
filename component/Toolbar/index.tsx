import React from 'react'
import ConnectionInfoDialog from "../ConnectionInfoDialog/ConnectionInfoDialog";
import GlobalBindings from "../../utils";

class Toolbar extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = {
      toolbarHorizontal: false,
      show: false,
      showInfo: false,
      mute:true,
      deaf:true
    }
    this.changeToolbarDir = this.changeToolbarDir.bind(this)
    this.hideConnectDialog = this.hideConnectDialog.bind(this)
    this.onShowChange = this.onShowChange.bind(this)
    this.showInfoCD = this.showInfoCD.bind(this)
    this._setDeaf = this._setDeaf.bind(this)
    this._setMute = this._setMute.bind(this)
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

  onShowChange() {
    this.setState((state: any) => ({
      showInfo: !state.showInfo
    }))
  }
  showInfoCD() {
    if(window.mumbleUi.selfUser) {
      window.mumbleUi.connectionInfo.update()
      this.onShowChange()
    } else console.log('no selfUser exists')
  }



  _setDeaf() {
    this.setState((state:any) => ({
      deaf: !state.deaf
    }))
  }
  onDeafChange() {
    if(this.state.deaf){
      this._setDeaf()
      window.mumbleUi.requestUndeaf(window.mumbleUi)
    } else {
      this._setDeaf()
      window.mumbleUi.requestDeaf(window.mumbleUi)
    }
  }

  _setMute() {
    this.setState((state:any) => ({
      mute: !state.mute
    }))
  }
  onMuteChange() {
    if(this.state.mute) {
      this._setMute()
      window.mumbleUi.requestMute(window.mumbleUi.selfUser)
    } else {
      this._setMute()
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
          <img className="tb-connect" alt="connect" src="/svg/applications-internet.svg" onClick={this.hideConnectDialog}/>
          <img className="tb-information" alt="information" src="/svg/information_icon.svg" onClick={this.showInfoCD}/>
          <div className="divider"/>
          {/*mute and deaf*/}
          { this.state.mute?
            <img className="tb-mute" data-bind="visible: !selfMute(),
                              click: function () { requestMute(thisUser()) }"
                 alt="mute" src="/svg/audio-input-microphone.svg" onClick={this.onMuteChange}/> :
            <img className="tb-unmute tb-active" data-bind="visible: selfMute,
                              click: function () { requestUnmute(thisUser()) }"
            alt="unmute" src="/svg/audio-input-microphone-muted.svg" onClick={this.onMuteChange}/>
          }
          { this.state.deaf?
            <img className="tb-deaf" data-bind="visible: !selfDeaf(),
                              click: function () { requestDeaf(thisUser()) }"
                 alt="deaf" src="/svg/audio-output.svg" onClick={this.onDeafChange}/> :
            <img className="tb-undeaf tb-active" data-bind="visible: selfDeaf,
                              click: function () { requestUndeaf(thisUser()) }"
            alt="undeaf" src="/svg/audio-output-deafened.svg" onClick={this.onDeafChange}/>
          }
          {/*mute and deaf*/}
          <img className="tb-record" data-bind="click: function(){}"
               alt="record" src="/svg/media-record.svg"/>
          <div className="divider"></div>
          <img className="tb-comment" data-bind="click: commentDialog.show"
               alt="comment" src="/svg/toolbar-comment.svg"/>
          <div className="divider"></div>
          <img className="tb-settings" data-bind="click: openSettings"
               alt="settings" src="/svg/config_basic.svg"/>
          <div className="divider"></div>
          <img className="tb-sourcecode" data-bind="click: openSourceCode"
               alt="Source Code" src="/svg/source-code.svg"/>
        </div>
        <div>{this.state.showInfo? <ConnectionInfoDialog show={this.state.showInfo} onShow={this.onShowChange}/> : null }</div>
      </>
    )
  }
}

export default Toolbar