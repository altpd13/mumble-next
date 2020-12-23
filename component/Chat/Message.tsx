import React, {useEffect, useRef} from "react";

const Message = ({message}:any) => {
  let isSentByCurrentUser = false;

  const trimmedName = () => {
    if (message.type === 'chat-message') {
      return message.user.name.trim().toLowerCase()
    } else if (message.type === 'chat-message-channel-self') {
      return
    } else if (message.type === 'chat-message-user-self') {
      return
    } else if (message.type === 'welcome-message') {
      return
    } else if (message.type === 'generic') {
      return
    }
  }

  return (
    <div>
      {message.message}
    </div>
  )

}
export default Message