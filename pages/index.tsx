import '../styles/MetroMumbleDark/main.scss'
import '../styles/MetroMumbleDark/loading.scss'
import React from 'react'
import GlobalBindings, {initializeUI, log} from "../utils/index";
import MatrixWidget from "../utils/MatrixWidget"
// import {initVoice} from "../utils/voice";
import Loading from "../component/Loading/Loading";
import ConnectBox from "../component/ConnectDialog/ConnectBox/ConnectBox";
//************ STUFF ****************/
// async function main() {
  //   await localizationInitialize(navigator.language);
  //   translateEverything();
  //   initializeUI();
  //   initVoice((data: any) => {
  //     if (testVoiceHandler) {
  //       testVoiceHandler.write(data)
  //     }
  //     if (!window.mumbleUi.client) {
  //       if (window.mumbleUi.voiceHandler) {
  //         window.mumbleUi.voiceHandler.end()
  //       }
  //       window.mumbleUi.voiceHandler = null
  //     } else
  //     if (window.mumbleUi.voiceHandler) {
  //       window.mumbleUi.voiceHandler.write(data)
  //     }
  //   }, (err: any) => {
  //     log(['logentry.mic_init_error', err])
  //   })
  // }
  // window.onload = main
//************ INDEX ****************/
declare global {
  interface Window {
    matrixWidget: any;
    mumbleWebConfig: any;
    mumbleUi: any;
  }
}

class index extends React.Component {
  stuff: any;

  componentDidMount() {
    window.matrixWidget = new MatrixWidget()
    window.mumbleWebConfig = {
      // Which fields to show on the Connect to Server dialog
      'connectDialog': {
        'address': true,
        'port': true,
        'token': true,
        'username': true,
        'password': true,
        'channelName': false
      },
      // Default values for user settings
      // You can see your current value by typing `localStorage.getItem('mumble.$setting')` in the web console.
      'settings': {
        'voiceMode': 'vad', // one of 'cont' (Continuous), 'ptt' (Push-to-Talk), 'vad' (Voice Activity Detection)
        'pttKey': 'ctrl + shift',
        'vadLevel': 0.3,
        'toolbarVertical': false,
        'showAvatars': 'always', // one of 'always', 'own_channel', 'linked_channel', 'minimal_only', 'never'
        'userCountInChannelName': false,
        'audioBitrate': 40000, // bits per second
        'samplesPerPacket': 960
      },
      // Default values (can be changed by passing a query parameter of the same name)
      'defaults': {
        // Connect Dialog
        'address': window.location.hostname,
        'port': '443',
        'token': '',
        'username': '',
        'password': '',
        'joinDialog': false, // replace whole dialog with single "Join Conference" button
        'matrix': false, // enable Matrix Widget support (mostly auto-detected; implies 'joinDialog')
        'avatarurl': '', // download and set the user's Mumble avatar to the image at this URL
        // General
        'theme': 'MetroMumbleLight'
      }
    }//config.js“
    window.mumbleUi = new GlobalBindings(window.mumbleWebConfig)

  }

  render() {
    if (typeof window === "undefined"){
      global.window = {}
    }
    return (
      <IndexPage settings={window.mumbleUi}/>
    )
  }
}

export default index

//********* COMPONENTS **************//
const IndexPage = (settings:any) => {
  let props = {
    visible: settings.visible,
    isMinimal: settings.Minimal,
    joinOnly: settings.joinOnly
  }
  return (
    <>
      <Loading/>
      <Container {...props} />
    </>
  )
}


const Container = (props: any) => {
  const isMinimal = props.isMinimal
  let stuff = {
    visible: props.visible,
    joinOnly: props.joinOnly
  }
  if (isMinimal) {
    return (
      <div id='container'>
        <ConnectBox {...stuff} />
      </div>
    )
  } else {
    return (
      <div id='container'>
        <ConnectBox {...stuff} />
      </div>
    )
  }
}



