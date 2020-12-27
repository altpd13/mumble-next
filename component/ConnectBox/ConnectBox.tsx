import React from "react";
import JoinDialogBox from "../JoinDialog";
import ConnectDialog from "../ConnectDialog/ConnectDialog";

// @ts-ignore
const ConnectBox = (props: any) => {
  // const visible = window.mumbleUi//TODO: make it work god damn
  // const joinOnly = window.mumbleUi
  const visible = true
  const joinOnly = false
  if (visible && !joinOnly) {
    return (
      <ConnectDialog
        hide={props.hide}
        onHide={props.onHide}
        messages={props.messages}
        setMessages={props.setMessages}
        channels={props.channels}
        setChannels={props.setChannels}
        users={props.users}
        setUsers={props.setUsers}
      />
    )
  } else if (visible && joinOnly) {
    return (
      <JoinDialogBox checkJoinOnly={joinOnly}/>
    )
  } else {
    return (
      <div>Error with visible and joinOnly :( </div>
    )
  }
}

export default ConnectBox