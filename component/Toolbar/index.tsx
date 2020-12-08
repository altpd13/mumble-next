import React from 'react'

class Toolbar extends React.Component<any,any> {
  constructor(probs: any) {
    super(probs)
    this.state = {
      toolbarHorizontal: false
    }
    this.changeToolbarDir = this.changeToolbarDir.bind(this)
  }

  changeToolbarDir() {
    this.setState((state:any) => ({
      toolbarHorizontal: !state.toolbarHorizontal
    }))
  }

  render() {
    return (
      <div className={this.state.toolbarHorizontal? `toolbar toolbar-horizontal`: `toolbar toolbar-vertical`}>
        {this.state.toolbarHorizontal? <img className="handle-horizontal" src="/svg/handle_horizontal.svg" onClick={this.changeToolbarDir}/>  : <img className="handle-vertical" src="/svg/handle_vertical.svg" onClick={this.changeToolbarDir}/> }
        <img className="tb-connect" data-bind="visible: !connectDialog.joinOnly(),
                                           click: connectDialog.show"
             alt="connect" src="/svg/applications-internet.svg"/>
        <img className="tb-information" alt="information" src="/svg/information_icon.svg"
             data-bind="click: connectionInfo.show,
                        css: { disabled: !thisUser() }"/>
        <div className="divider"></div>
        <img className="tb-mute" data-bind="visible: !selfMute(),
                              click: function () { requestMute(thisUser()) }"
             alt="mute" src="/svg/audio-input-microphone.svg"/>
        <img className="tb-unmute tb-active" data-bind="visible: selfMute,
                              click: function () { requestUnmute(thisUser()) }"
             alt="unmute" src="/svg/audio-input-microphone-muted.svg"/>
        <img className="tb-deaf" data-bind="visible: !selfDeaf(),
                              click: function () { requestDeaf(thisUser()) }"
             alt="deaf" src="/svg/audio-output.svg"/>
        <img className="tb-undeaf tb-active" data-bind="visible: selfDeaf,
                              click: function () { requestUndeaf(thisUser()) }"
             alt="undeaf" src="/svg/audio-output-deafened.svg"/>
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
    )
  }
}

export default Toolbar
//