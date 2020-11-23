import React, {Component} from "react";
import AudioVisualiser from "./AudioVisualiser";
import MicrophoneStream from 'microphone-stream'

export default class AudioAnalyser extends Component <any> {
  private audioContext: any;
  private analyser: AnalyserNode | undefined;
  private dataArray: Uint8Array | undefined;
  private source: MediaStreamAudioSourceNode | undefined;
  private rafId: number | undefined;
  constructor(props: any) {
    super(props);
    this.state = {audioData: new Uint8Array(0)};
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source = this.audioContext.createMediaStreamSource(this.props.audio);
    this.source.connect(this.analyser);
    // console.log(this.props.audio)
    // console.log(this.source)
    // console.log(this.analyser)
    let micStream = new MicrophoneStream(this.source)
    // console.log(micStream)
    this.rafId = requestAnimationFrame(this.tick)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    this.source.disconnect();
  }

  tick() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    this.setState({audioData: this.dataArray});
    this.rafId = requestAnimationFrame(this.tick);
  }

  render() {
    return <AudioVisualiser audioData={this.state.audioData} />;
  }
}