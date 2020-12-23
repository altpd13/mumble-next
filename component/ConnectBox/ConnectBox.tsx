// @ts-ignore
import React, {useEffect, useState} from "react";
// @ts-ignore
import ConnectDialog from "../ConnectDialog/ConnectDialog";
import JoinDialogBox from "../JoinDialog";
// @ts-ignore
import ConnectTestDialog from "../TestCompo/ConnectTestDialog";
// @ts-ignore
import SettingsDialog from "../SettingsDialog/SettingsDialog";
import ConnectDialog1 from "../ConnectDialog/ConnectDialog1";
import Chat from "../Chat/Chat";

// @ts-ignore
const ConnectBox = (props:any) => {
  // const visible = window.mumbleUi//TODO: make it work god damn
  // const joinOnly = window.mumbleUi
  const visible = true
  const joinOnly = false
  if (visible && !joinOnly) {
    return (
      <ConnectDialog
        hide={props.hide}
        onHide={props.onHide}
        server={props.server}
        onServer={props.onServer}
        messages={props.messages}
        setMessages={props.setMessages}
      />
      // <ConnectDialog1 hide={props.hide} onHide={props.onHide}/>
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