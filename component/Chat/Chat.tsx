import React from 'react'
import {Messages} from "./Messages";
import getTimeString from "../../utils/getTimeString";

const Chat = (props: any) => {


  const sendMessage = (target: any, message: any) => {
    if (message.trim().length == 0) return;
    let messageChunk:any
    if (window.mumbleUi.connected()) {
      // If no target is selected, choose our own user
      if (!target) {
        target = window.mumbleUi.selfUser
      }
      // If target is our own user, send to our channel
      if (target === window.mumbleUi.selfUser) {
        target = target.channel
      }
      // Send message
      if (target.users) { // Channel
        messageChunk = {
          time: getTimeString(),
          type: 'chat-message-channel-self',
          message: message,
          channel: target,
        }
      } else { // User
        messageChunk = {
          time: getTimeString(),
          type: 'chat-message-user-self',
          message: message,
          user: target
        }
        console.log(target)
      }
      target.model.sendMessage(message)
      props.setMessages([...props.messages,messageChunk])
    }
  }

  const submitMessageBox = (message:any) => {
    sendMessage(null,message)
    props.setMessage('')
  }

  return (
    <div className="chat">
      <div className="log">
        <Messages messages={props.messages} />
      </div>
        <input id="message-box" type="text" value={props.letter}
               onChange={(event: any) => {
                 props.setMessage(event.target.value)
               }}
               onKeyPress={(event: any) => {
                 event.key === 'Enter' ? submitMessageBox(props.letter) : null
               }}
        />
    </div>
  )
}

export default Chat
