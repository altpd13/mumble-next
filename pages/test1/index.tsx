import React from "react";
import AudioAnalyser from "../../component/Audio/AudioAnalyser";

declare global {
  interface Window {
    webkitAudioContext: string;
  }
}

export default class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      audio: null
    };
    this.toggleMicrophone = this.toggleMicrophone.bind(this);
  }

  async getMicrophone() {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    }).catch((err: any) => console.log(err))
    console.log(audio)
    this.setState({audio})
  }

  stopMicrophone() {
    this.state.audio.getTracks().forEach((track: any) => track.stop());
    this.setState({audio: null});
  }

  toggleMicrophone() {
    if (this.state.audio) {
      this.stopMicrophone();
    } else {
      this.getMicrophone();
    }
  }

  render() {
    return (
      <div className="App">
        <div className="controls">
          <button onClick={this.toggleMicrophone}>
            {this.state.audio ? 'Stop microphone' : 'Get microphone input'}
          </button>
        </div>
        {this.state.audio ? <AudioAnalyser audio={this.state.audio}/> : ''}
      </div>
    );
  }
}

