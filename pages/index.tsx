import '../styles/MetroMumbleDark/main.scss'
import '../styles/MetroMumbleDark/loading.scss'
import React, {useEffect,useState} from 'react'
import GlobalBindings, {initializeUI} from "../utils/index";
import MatrixWidget from "../utils/MatrixWidget"
// import {initVoice} from "../utils/voice";
import Loading from "../component/Loading/Loading";
import ConnectBox from "../component/ConnectBox/ConnectBox";
import {initVoice} from "../utils/voice";
import Toolbar from "../component/Toolbar";
import ChannelContainer from "../component/ChannelContainer/ChannelContainer";
import Chat from "../component/Chat/Chat";
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
        'userCountInChannelName': true,
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
        'webrtc': 'auto',
        'joinDialog': false, // replace whole dialog with single "Join Conference" button
        'matrix': false, // enable Matrix Widget support (mostly auto-detected; implies 'joinDialog')
        'avatarurl': '', // download and set the user's Mumble avatar to the image at this URL
        // General
        'theme': 'MetroMumbleDark'
      }
    }//config.js“
    window.mumbleUi = new GlobalBindings(window.mumbleWebConfig)
    async function main() {
      // await localizationInitialize(navigator.language);
      // translateEverything();
      let testVoiceHandler:any = null
      // initializeUI();
      // initVoice((data:any) => {
      //   if (testVoiceHandler) {
      //     testVoiceHandler.write(data)
      //   }
      //   if (!window.mumbleUi.client) {
      //     if (window.mumbleUi.voiceHandler) {
      //       window.mumbleUi.voiceHandler.end()
      //     }
      //     window.mumbleUi.voiceHandler = null
      //   } else if (window.mumbleUi.voiceHandler) {
      //     window.mumbleUi.voiceHandler.write(data)
      //   }
      // }, (err:any) => {
      //   log(['logentry.mic_init_error', err])
      // })
      try {
        const userMedia = await initVoice((data:any) => {
          if (testVoiceHandler) {
            console.log('testVoice Handler')
            testVoiceHandler.write(data)
          }
          if (!window.mumbleUi.client) {
            if (window.mumbleUi.voiceHandler) {
              window.mumbleUi.voiceHandler.end()
            }
            window.mumbleUi.voiceHandler = null
          } else if (window.mumbleUi.voiceHandler) {
            window.mumbleUi.voiceHandler.write(data)
          }
        })
        window.mumbleUi._micStream = userMedia
      } catch (err) {
        window.alert('Failed to initialize user media\nRefresh page to retry.\n' + err)
        return
      }
      initializeUI();
    }
    window.onload = main
  }

  save(key:string,val:any) {
    window.localStorage.setItem('mumble.'+key,val)
  }

  render() {
    return (
      <div>
        <IndexPage />
        <style global jsx>{`
      html,
      body,
      body > div:first-child,
      div#__next,
      div#__next > div,
      div#__next > div > div {
        height: 100%;
      }
    `}</style>
      </div>
    )
  }
}

export default index

//********* COMPONENTS **************//
const IndexPage = () => {
  useEffect(()=>{
  })

  return (
    <>
      <Loading/>
      <Container />
    </>
  )
}

const Container = () => {
  const isMinimal = false
  const[hide,onHideChange] = useState(false)
  if (isMinimal) {
    return (
      <div id='container' className="minimal">
        <ConnectBox />
        <Toolbar />
        <Chat/>
        <ChannelContainer/>
      </div>
    )
  } else {
    return (
      <div id='container'>
        <ConnectBox hide={hide} onHide={onHideChange}/>
        <Toolbar hide={hide} onHide={onHideChange}/>
        <Chat/>
        <ChannelContainer/>
      </div>
    )
  }
}



