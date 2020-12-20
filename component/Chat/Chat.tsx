import React, {useEffect, useRef, useState} from 'react'
import {Message} from "./Message";

const Chat = () => {

  const messageBox = useRef()
  const getMessage = () => {
    messageBox.current.addEventListener('message',console.log('?'))
  }

  useEffect(()=>{

  })

  return (
    <div className="chat">
      <script type="text/html" id="log-generic">
        <span data-bind="text: value"></span>
      </script>
      <script type="text/html" id="log-welcome-message">
        Welcome message: <span data-bind="html: message"></span>
      </script>
      <script type="text/html" id="log-chat-message">
          <span data-bind="visible: channel">
            (Channel)
          </span>
        <span data-bind="template: { name: 'user-tag', data: user }"></span>:
        <span className="message-content" data-bind="html: message"></span>
      </script>
      <script type="text/html" id="log-chat-message-self">
        To
        <span data-bind="template: { if: $data.channel, name: 'channel-tag', data: $data.channel }">
          </span><span data-bind="template: { if: $data.user, name: 'user-tag', data: $data.user }">
          </span>:
        <span className="message-content" data-bind="html: message"></span>
      </script>
      <script type="text/html" id="log-disconnect">
      </script>
      {/*<div className="log" data-bind="foreach: {*/}
      {/*    data: log,*/}
      {/*    afterRender: function (e) {*/}
      {/*      [].forEach.call(e[1].getElementsByTagName('a'), function(e){e.target = '_blank'})*/}
      {/*    }*/}
      {/*  }">*/}
      <div className="log" ref={messageBox}>
        <button onClick={getMessage}>Click Me!</button>
      </div>
      {/*<div className="log-entry">*/}
      {/*  <span className="log-timestamp" data-bind="text: $root.getTimeString()"></span>*/}
      {/*// <!-- ko template: { data: $data, name: function(l) { return 'log-' + l.type; } } -->*/}
      {/*// <!-- /ko -->*/}
      {/*</div>*/}
      {/*</div>*/}
      <form data-bind="submit: submitMessageBox">
        <input id="message-box" type="text" data-bind="
              attr: { placeholder: messageBoxHint }, textInput: messageBox"/>
      </form>
    </div>
  )
}

export default Chat
