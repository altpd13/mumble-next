import React from 'react'

const ConnectionInfoDialog = (props:any) => {
  console.log(props)
  return (
    <div className="connection-info-dialog dialog">
      <div className="dialog-header">
        Connection Information
      </div>
      <div className="dialog-content">
        <h3>Version</h3>
        {/*// <!-- ko with: serverVersion -->*/}
        Protocol
        <span></span>
        <br/>
        <br/>
        <span data-bind="text: release"></span>
        <br/>
        <span data-bind="text: os"></span>
        <span data-bind="text: osVersion"></span>
        <br/>
        {/*// <!-- ko if: !serverVersion() -->*/}
        Unknown

        <h3>Control channel</h3>
        <span data-bind="text: latencyMs().toFixed(2)"></span> ms average latency
        (<span data-bind="text: latencyDeviation().toFixed(2)"></span> deviation)
        <br/>
        <br/>
        Remote host <span data-bind="text: remoteHost"></span>
        (port <span data-bind="text: remotePort"></span>)
        <br/>

        <h3>Audio bandwidth</h3>
        Maximum <span data-bind="text: (maxBitrate()/1000).toFixed(1)"></span> kbits/s
        (<span data-bind="text: (maxBandwidth()/1000).toFixed(1)"></span> kbits/s with overhead)
        <br/>
        Current <span data-bind="text: (currentBitrate()/1000).toFixed(1)"></span> kbits/s
        (<span data-bind="text: (currentBandwidth()/1000).toFixed(1)"></span> kbits/s with overhead)
        <br/>
        Codec: <span data-bind="text: codec"></span>
      </div>
      <div className="dialog-footer">
        <input className="dialog-close" type="button" onClick={() => {
        }} value="OK"/>
      </div>
    </div>
  )
}

export default ConnectionInfoDialog