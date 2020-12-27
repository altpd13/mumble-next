import React from 'react'
import Channel from './Channel'
import User from './User'

const ChannelContainer = ({ channels,setChannels,users,setUsers }:any) => {
  return (
    <div className="channel-root-container">
      {/*<div className="channel-root">*/}
      {/*  {channels.map((channel:any,i:number) =><div key ={i} ><Channel className='channel' channel={channel} ></Channel></div>)}*/}
      {/*</div>*/}
      <div className={'channel-root'}>
        {users.map((user:any,i:number)=> <div className={'user'} key={i}><User user={user}></User></div>)}
      </div>
    </div>
  )
}

export default ChannelContainer