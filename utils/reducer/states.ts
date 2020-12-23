function serverConnection (state:any,action:any) {
  switch(action.type) {
    case 'CONNECTED' : {
      return state = true
    }
    case 'DISCONNECTED' : {
      return state = false
    }
    default:
      return state
  }
}

function controlMessage (state:any,action:any) {
 return [state,action]
}

export {serverConnection,controlMessage}