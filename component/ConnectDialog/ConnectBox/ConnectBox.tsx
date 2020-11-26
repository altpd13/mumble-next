import React from "react";
import ConnectBoxDialog from "../ConnectBoxDialog/ConnectBoxDialog";

const ConnectBox = (props: any) => {
  const visible = props.visible
  const joinOnly = props.joinOnly
  //Since window is undefined in this scope fucking shit i did this stupid shit, dunno :P
  if(visible !== undefined && joinOnly !== undefined ) {
    if (visible && !joinOnly) {
      return (
          <ConnectBoxDialog/>
      )
    } else if (visible && joinOnly) {
      return (
          <ConnectBoxDialog/>
      )
    } else if (visible) {
      return (
        <>
        </>
      )
    } else {
      return (
        <div>Error with visible and joinonly :( fuck you</div>
      )
    }
  }else {
    // console.log(visible, joinOnly)
    return <ConnectBoxDialog />
  }
}

export default ConnectBox