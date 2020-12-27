import {useEffect,useState} from "react";

const User = ({user}: any) => {
  useEffect(()=>{

  },[user])

  return (
    <>
      {user.id}
    </>
  )
}

export default User