import React from 'react'

// @ts-ignore
import ExampleWorker from '../../workers/ex.worker';

export default class extends React.Component {
  state = {latestMessage: null}
  worker: any;

  componentDidMount() {
    // Instantiate the Worker
    this.worker = new ExampleWorker()
    this.worker.postMessage('from Host')
    this.worker.addEventListener('message', this.onWorkerMessage)
    this.worker.addEventListener('message',this.logWorkerMessage)
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