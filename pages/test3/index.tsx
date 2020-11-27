import React,{Component} from 'react'

// @ts-ignore
import ExampleWorker from "../../workers/ex.worker";
import Promise from "promise";

export default class Test3 extends Component<any,any> {
  worker: any;
  constructor(props:any) {
    super(props)
    this.state = {
      isConnected: false
    }
    this.connectMumble = this.connectMumble.bind(this);
  }

  connectMumble() {
    this.setState((state:any) => ({
      isConnected: !state.isConnected
    }))
    this.worker.postMessage('from Host')
    const mc = new mumbleConnector(this.worker)
    mc.connect(`ws://127.0.0.1:8889`,{
      username: 'a',
      password: 'a',
      tokens: 'a'
    })
  }

  componentDidMount() {
    this.worker = new ExampleWorker()
  }

  render() {
    return (
      <div>
        <button onClick={this.connectMumble}>
          {this.state.isConnected? 'Connected to Server' : 'Connect to Server'}
        </button>
      </div>
    )
  }
}

class mumbleConnector {
  _worker: any
  _requests: any
  _reqId: number
  constructor(worker:any) {
    this._worker = worker
    this._requests = {}
    this._reqId = 1
  }
  connect(host:any,args:any) {
    return this._query({},'_connect',{host:host, args: args},null)
  }
  _query(id:any, method:any, payload:any,transfer:any|null) {
    let reqId = this._call(id, method, payload,transfer)
    return new Promise((resolve, reject) => {
      this._requests[reqId] = [resolve, reject]
    })
  }
  _call(id:any, method:any, payload:any,transfer:any|null) {
    let reqId = this._reqId++
    console.debug(method, id, payload)
    this._postMessage({
      clientId: id.client,
      channelId: id.channel,
      userId: id.user,
      method: method,
      reqId: reqId,
      payload: payload
    }, transfer)
    return reqId
  }
  _postMessage(msg:any, transfer:any|null) {
    try {
      this._worker.postMessage(msg, transfer)
    } catch (err) {
      console.error('Failed to postMessage', msg)
      throw err
    }
  }
}
