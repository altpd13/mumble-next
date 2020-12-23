import React, {useEffect, useRef} from "react";
import Message from "./Message";

import ScrollToBottom from 'react-scroll-to-bottom'

const Messages= ({ messages }:any) => {

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  return(
    <div>
      {messages.map((message:any,i:number)=><div key={i}><Message message={message} /></div>)}
      <div ref={messagesEndRef} />
    </div>
  )
}

export {Messages}