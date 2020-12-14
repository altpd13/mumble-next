// @ts-ignore
import React, {useEffect, useState} from "react";
import ConnectDialog from "../ConnectDialog/ConnectDialog";
import JoinDialogBox from "../JoinDialog";
import ConnectTestDialog from "../TestCompo/ConnectTestDialog";

const ConnectBox = (props:any) => {
  // const visible = window.mumbleUi//TODO: make it work god damn
  // const joinOnly = window.mumbleUi
  const visible = true
  const joinOnly = false
  if (visible && !joinOnly) {
    return (
      // <ConnectDialog hide={props.hide} onHide={props.onHide}/>
      <ConnectTestDialog/>
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