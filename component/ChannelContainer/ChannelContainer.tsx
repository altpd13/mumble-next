import React, {useEffect} from 'react'
import {User} from './User'
import _newUser from "../../utils/newUser";

const ChannelContainer = ({channels, setChannels, users, setUsers}: any) => {
  return (
    <div className="channel-root-container">
      <div className={'channel-root'}>
        {users.map((user: any, i: number) => <div key={i}><User user={user} users={users} setUsers={setUsers}></User></div>)}
      </div>
    </div>
  )
}

export default ChannelContainer