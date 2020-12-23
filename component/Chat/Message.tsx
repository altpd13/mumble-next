import React from "react";
import styles from '../../styles/MessageBox/Message.module.scss'
// const styles = require('./Message.module.scss')

const Message = ({message}:any) => {
  let isSentByCurrentUser = false;

  const messageUser = () => {
    if (message.type === 'chat-message') {
      return `${message.user}: `
    } else if (message.type === 'chat-message-channel-self') {
      return `${window.mumbleUi.connectDialog.username}: `
    } else if (message.type === 'chat-message-user-self') {
      return `${window.mumbleUi.connectDialog.username}: `
    } else if (message.type === 'welcome-message') {
      return  ``
    } else if (message.type === 'generic') {
      return  ``
    }
  }
  return (
    <div className={styles.messageContainer}>
      <span className={styles.user}>{messageUser()}</span><span className={styles.messageContext}>{message.message}</span>
    </div>
  )
}
export default Message