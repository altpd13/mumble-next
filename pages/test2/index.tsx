import React from 'react'
const mumbleConnect = require("mumble-client-websocket")

// @ts-ignore
import ExampleWorker from '../../workers/test.worker';

export default class extends React.Component {
  state = {latestMessage: null}
  worker: any;

  componentDidMount() {
    // Instantiate the Worker
    this.worker = new ExampleWorker()
    this.worker.postMessage('from Host')
    this.worker.addEventListener('message', this.onWorkerMessage)
    this.worker.addEventListener('message',this.logWorkerMessage)
    mumbleConnect('wss://voice.johni0702.de:433/demo', {
      username: 'Test',
    }, function (err, client) {
      if (err) throw err;

      // Connection established
      console.log('Welcome message:', client.welcomeMessage)
      console.log('Actual username:', client.self.username)
    })
  }

  componentWillUnmount() {
    // Close the Worker thread
    this.worker.terminate()
  }

  logWorkerMessage = (event: { data: any }) => console.log(event.data)
  onWorkerMessage = (event: { data: any; }) => this.setState({latestMessage: event.data})

  render() {
    return <h1>Message from Worker: {this.state.latestMessage}</h1>
    // return <h1>Fuck you</h1>
  }
}