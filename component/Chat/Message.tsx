import React from "react";
import '../../styles/MessageBox/Message.module.scss'
// const styles = require('./Message.module.scss')

const Message = ({message}: any) => {

  const messageContext = () => {

    switch (message.type) {
      case 'chat-message': {
        return (
          <div className={`messageContainer`}>
            {message.time}
            <span className={`sender`}>{message.user} : </span><span
            className={`messageContext`}>{message.message}</span>
          </div>
        )
      }
      case 'chat-message-channel-self': {
        return (
          <div className={`messageContainer_Self`}>
            {message.time}
            <span className={`self`}>{window.mumbleUi.connectDialog.username} : </span><span
            className={`messageContext`}>{message.message}</span>
          </div>
        )
      }
      case 'chat-message-user-self':
        return (
          <div className={`messageContainer_Self`}>
            <span className={`self`}>{message.user.username}</span><span
            className={`messageContext`}>{message.message}</span>
          </div>
        )
      case 'welcome-message':
        return (
          <div className={`messageContainer_Welcome`}>
            {message.time}
            <span className={`messageContext`}>{message.message}</span>
          </div>
        )
      case `generic` : {
        return (
          <div className={`generic`}>
            {message.time}
            {message.message}
          </div>
        )
      }
    }
  }
  return (
    <>
      {messageContext()}
    </>
  )
}
export default Message