import React from 'react'

class Toolbar extends React.Component<any,any> {
  constructor(probs: any) {
    super(probs)
    this.state = {
      toolbarHorizontal: false
    }
  }

  render() {
    return (
      <div className={this.state.toolbarHorizontal? `toolbar toolbar-horizontal`: `toolbar toolbar-vertical`}>
        <img className="handle-horizontal" src="/svg/handle_horizontal.svg"
             data-bind="click: toggleToolbarOrientation"/>
        <img className="handle-vertical" src="/svg/handle_vertical.svg"
             data-bind="click: toggleToolbarOrientation"/>
        <img className="tb-connect" data-bind="visible: !connectDialog.joinOnly(),
                                           click: connectDialog.show"
             rel="connect" src="/svg/applications-internet.svg"/>
        <img className="tb-information" rel="information" src="/svg/information_icon.svg"
             data-bind="click: connectionInfo.show,
                        css: { disabled: !thisUser() }"/>
        <div className="divider"></div>
        <img className="tb-mute" data-bind="visible: !selfMute(),
                              click: function () { requestMute(thisUser()) }"
             rel="mute" src="/svg/audio-input-microphone.svg"/>
        <img className="tb-unmute tb-active" data-bind="visible: selfMute,
                              click: function () { requestUnmute(thisUser()) }"
             rel="unmute" src="/svg/audio-input-microphone-muted.svg"/>
        <img className="tb-deaf" data-bind="visible: !selfDeaf(),
                              click: function () { requestDeaf(thisUser()) }"
             rel="deaf" src="/svg/audio-output.svg"/>
        <img className="tb-undeaf tb-active" data-bind="visible: selfDeaf,
                              click: function () { requestUndeaf(thisUser()) }"
             rel="undeaf" src="/svg/audio-output-deafened.svg"/>
        <img className="tb-record" data-bind="click: function(){}"
             rel="record" src="/svg/media-record.svg"/>
        <div className="divider"></div>
        <img className="tb-comment" data-bind="click: commentDialog.show"
             rel="comment" src="/svg/toolbar-comment.svg"/>
        <div className="divider"></div>
        <img className="tb-settings" data-bind="click: openSettings"
             rel="settings" src="/svg/config_basic.svg"/>
        <div className="divider"></div>
        <img className="tb-sourcecode" data-bind="click: openSourceCode"
             rel="Source Code" src="/svg/source-code.svg"/>
      </div>
    )
  }
}

export default Toolbar
//