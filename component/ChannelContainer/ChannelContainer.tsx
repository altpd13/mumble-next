import React from 'react'
import Channel from './Channel'

const ChannelContainer = ({ channels,setChannels }:any) => {

  return (
    <div className="channel-root-container">
      <div className="channel-root">
        {channels.map((channel:any,i:number) =><div key ={i} ><Channel className='channel' channel={channel} ></Channel></div>)}
      </div>
    </div>
  )
}

export default ChannelContainer