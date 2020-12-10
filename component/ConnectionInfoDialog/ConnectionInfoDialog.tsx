import React from 'react'

const ConnectionInfoDialog = (props:any) => {
  const info = window.mumbleUi.connectionInfo
  return (
    <div className="connection-info-dialog dialog">
      <div className="dialog-header">
        Connection Information
      </div>
      <div className="dialog-content">
        <h3>Version</h3>
        {/*// <!-- ko with: serverVersion -->*/}
        Protocol
        <span>{` ${info.serverVersion.major} . ${info.serverVersion.minor} . ${info.serverVersion.patch}`}</span>
        <br/>
        <br/>
        <span>{info.serverVersion.release}</span>
        <br/>
        <span>{info.serverVersion.os}</span>
        <span> {info.serverVersion.osVersion}</span>
        <br/>
        {/*// <!-- ko if: !serverVersion() -->*/}
        Unknown

        <h3>Control channel</h3>
        <span>{info.latencyMs.toFixed(2)}</span> ms average latency
        (<span>{info.latencyDeviation.toFixed(2)}</span> deviation)
        <br/>
        <br/>
        Remote host <span>{info.remoteHost}</span>
        (port <span>{info.remotePort}</span>)
        <br/>

        <h3>Audio bandwidth</h3>
        Maximum <span>{(info.maxBitrate/1000).toFixed(1)}</span> kbits/s
        (<span>{(info.maxBandwidth/1000).toFixed(1)}</span> kbits/s with overhead)
        <br/>
        Current <span>{(info.currentBitrate/1000).toFixed(1)}</span> kbits/s
        (<span>{(info.currentBandwidth/1000).toFixed(1)}</span> kbits/s with overhead)
        <br/>
        Codec: <span>{window.mumbleUi.connectionInfo.codec}</span>
      </div>
      <div className="dialog-footer">
        <input className="dialog-close" type="button" onClick={() => {
          props.onShow(!props.show)
        }} value="OK"/>
      </div>
    </div>
  )
}

export default ConnectionInfoDialog