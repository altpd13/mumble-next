import React, {Component} from 'react'

// @ts-ignore
import ExampleWorker from "../../workers/ex.worker";
import TestWorker from "../../workers/test.worker"
import Promise from "promise";

export default class Test3 extends Component<any, any> {
  worker: Worker;
  testWorker: Worker;
  client: any;

  constructor(props: any) {
    super(props)
    this.state = {
      isConnected: false,
      address: '',
      port: '',
      username: '',
      password: ''

    }
    this.connectMumble = this.connectMumble.bind(this);
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange = (event: any) => {

    this.setState({
      [event.target.name]: event.target.value
    })
  }


  connectMumble(event:any) {
    event.preventDefault()
    this.setState((state: any) => ({
      isConnected: !state.isConnected
    }))
    this.worker.postMessage('from Host')
    const mc = new mumbleConnector(this.worker) //MC in da house
    mc.connect(`ws://${this.state.address}:${this.state.port}`, {
      username: this.state.username,
      password: this.state.username,
      tokens: ''
    }).done(client => {
        console.log('I guess...Connected?')
        this.client = client

        client.on('error', (err: any) => {
          console.log(`Error: ${err}`)
        })
      }, err => {
        if (err.$type && err.$type.name === 'Reject') {
        console.log(err.type)
          console.log(err.reason)
        }else console.log(`Well You got error while initializing Client LOL`)
      }
    )
  }

  componentDidMount() {
    this.worker = new ExampleWorker()
    this.testWorker = new TestWorker()
    this.testWorker.postMessage('Hello to Worker')
  }

  logWorkerMessage = (event: { data: any }) => console.log(event.data)

  render() {
    return (
      <div>
        <form onSubmit={this.connectMumble}>
          <div>
            <label>
              Address:
              <input name={'address'} type="text" value={this.state.address} onChange={this.handleChange} required={true}/>
            </label>
          </div>

          <div>
            <label>
              Port:
              <input name={'port'} type="text" value={this.state.port} onChange={this.handleChange} required={true}/>
            </label>
          </div>

          <div>
            <label>
              User Name:
              <input name={'username'} type="text" value={this.state.username} onChange={this.handleChange} required={true}/>
            </label>
          </div>

          <div>
            <label>
              Password:
              <input name={'password'} value={this.state.password} onChange={this.handleChange} type="text"/>
            </label>
          </div>

          <div>
            <input type="submit" value={this.state.isConnected ? 'Connected to Server' : 'Connect to Server'}></input>
          </div>
        </form>
      </div>
    )
  }
}

class mumbleConnector {
  _worker: any
  _requests: any
  _reqId: number

  constructor(worker: any) {
    this._worker = worker
    this._requests = {}
    this._reqId = 1
  }

  connect(host: any, args: any) {
    return this._query({}, '_connect', {host: host, args: args}, null)
  }

  _query(id: any, method: any, payload: any, transfer: any | null) {
    let reqId = this._call(id, method, payload, transfer)
    return new Promise((resolve, reject) => {
      this._requests[reqId] = [resolve, reject]
    })
  }

  _call(id: any, method: any, payload: any, transfer: any | null) {
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

  _postMessage(msg: any, transfer: any | null) {
    try {
      this._worker.postMessage(msg, transfer)
    } catch (err) {
      console.error('Failed to postMessage', msg)
      throw err
    }
  }
}
