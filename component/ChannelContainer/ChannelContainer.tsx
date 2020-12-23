import React from 'react'

export default class ChannelContainer extends React.Component <any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <>
        <script type="text/html" id="channel">
          <div className="channel" data-bind="
            click: $root.select,
            event: {
              contextmenu: openContextMenu,
              dblclick: $root.requestMove.bind($root, $root.thisUser())
            },
            css: {
              selected: $root.selected() === $data,
              currentChannel: users.indexOf($root.thisUser()) !== -1
            }">
            <div className="channel-status">
              <img className="channel-description" data-bind="visible: description"
                   alt="description" src="/svg/comment.svg"/>
            </div>
            <div data-bind="if: description">
              <div className="channel-description tooltip" data-bind="html: description"></div>
            </div>
            <img className="channel-icon" src="/svg/channel.svg"
                 data-bind="visible: !linked() && $root.thisUser().channel() !== $data"/>
            <img className="channel-icon-active" src="/svg/channel_active.svg"
                 data-bind="visible: $root.thisUser().channel() === $data"/>
            <img className="channel-icon-linked" src="/svg/channel_linked.svg"
                 data-bind="visible: linked() && $root.thisUser().channel() !== $data"/>
            <div className="channel-name">
              <span data-bind="text: name"></span>
              {/*// <!-- ko if: $root.settings.userCountInChannelName() && userCount() !== 0 -->*/}
              &nbsp;(<span data-bind="text: userCount()"></span>)
              {/*// <!-- /ko -->*/}
            </div>
          </div>
          {/*// <!-- ko if: expanded -->*/}
          {/*// <!-- ko foreach: users -->*/}
          <div className="user-wrapper">
            <div className="user-tree"></div>
            <div className="user" data-bind="
                click: $root.select,
                event: {
                  contextmenu: openContextMenu
                },
                css: {
                  thisClient: $root.thisUser() === $data,
                  selected: $root.selected() === $data
                }">
              <div className="user-status" data-bind="attr: { title: state }">
                <img className="user-comment" data-bind="visible: comment"
                     alt="comment" src="/svg/comment.svg"/>
                <img className="user-server-mute" data-bind="visible: mute"
                     alt="server mute" src="/svg/muted_server.svg"/>
                <img className="user-suppress-mute" data-bind="visible: suppress"
                     alt="suppressed" src="/svg/muted_suppressed.svg"/>
                <img className="user-self-mute" data-bind="visible: selfMute"
                     alt="self mute" src="/svg/muted_self.svg"/>
                <img className="user-server-deaf" data-bind="visible: deaf"
                     alt="server deaf" src="/svg/deafened_server.svg"/>
                <img className="user-self-deaf" data-bind="visible: selfDeaf"
                     alt="self deaf" src="/svg/deafened_self.svg"/>
                <img className="user-authenticated" data-bind="visible: uid"
                     alt="authenticated" src="/svg/authenticated.svg"/>
              </div>
              <div data-bind="if: comment">
                <div className="user-comment tooltip" data-bind="html: comment"></div>
              </div>
              {/*// <!-- ko if: show_avatar() -->*/}
              <img className="user-avatar" alt="avatar"
                   data-bind="attr: { src: texture },
                            css: { 'user-avatar-talk-off': talking() == 'off',
                                   'user-avatar-talk-on': talking() == 'on',
                                   'user-avatar-talk-whisper': talking() == 'whisper',
                                   'user-avatar-talk-shout': talking() == 'shout' }"/>
              {/*// <!-- /ko -->*/}
              {/*// <!-- ko ifnot: show_avatar() -->*/}
              <img className="user-talk user-talk-off" data-bind="visible: talking() == 'off'"
                   alt="talk off" src="/svg/talking_off.svg"/>
              <img className="user-talk user-talk-on" data-bind="visible: talking() == 'on'"
                   alt="talk on" src="/svg/talking_on.svg"/>
              <img className="user-talk user-talk-whisper" data-bind="visible: talking() == 'whisper'"
                   alt="whisper" src="/svg/talking_whisper.svg"/>
              <img className="user-talk user-talk-shout" data-bind="visible: talking() == 'shout'"
                   alt="shout" src="/svg/talking_alt.svg"/>
              {/*// <!-- /ko -->*/}
              <div className="user-name" data-bind="text: name"></div>
            </div>
          </div>
          {/*// <!-- /ko -->*/}
          {/*// <!-- ko foreach: channels -->*/}
          <div className="channel-wrapper">
            {/*// <!-- ko ifnot: users().length || channels().length -->*/}
            <div className="channel-tree"></div>
            {/*// <!-- /ko -->*/}
            <div className="branch" data-bind="if: users().length || channels().length">
              <img className="branch-open" src="/svg/branch_open.svg"
                   data-bind="click: expanded.bind($data, false), visible: expanded()"/>
              <img className="branch-closed" src="/svg/branch_closed.svg"
                   data-bind="click: expanded.bind($data, true), visible: !expanded()"/>
            </div>
            <div className="channel-sub" data-bind="template: {name: 'channel', data: $data}"></div>
          </div>
          {/*// <!-- /ko -->*/}
          {/*// <!-- /ko -->*/}
        </script>
        <div className="channel-root-container" data-bind="if: root, visible: !minimalView()">
          <div className="channel-root" data-bind="template: {name: 'channel', data: root}"></div>
        </div>
      </>
    )
  }
}