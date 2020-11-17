import 'stream-browserify' // see https://github.com/ericgundrum/pouch-websocket-sync-example/commit/2a4437b013092cc7b2cd84cf1499172c84a963a3
import 'subworkers' // polyfill for https://bugs.chromium.org/p/chromium/issues/detail?id=31666
import WorkerBasedMumbleConnector from './worker-client'

const url =  require('url')
const ByteBuffer = require('bytebuffer')
const MumbleClient = require('mumble-client')
const BufferQueueNode = require('web-audio-buffer-queue')
const audioContext = require('audio-context')
const keyboardjs = require('keyboardjs') 

function openContextMenu (event:any, contextMenu:any, target:any) {
    contextMenu.posX(event.clientX)
    contextMenu.posY(event.clientY)
    contextMenu.target(target)
  
    const closeListener = (event:any) => {
      // Always close, no matter where they clicked
      setTimeout(() => { // delay to allow click to be actually processed
        contextMenu.target(null)
        unregister()
      })
    }
    const unregister = () => document.removeEventListener('click', closeListener)
    document.addEventListener('click', closeListener)
  
    event.stopPropagation()
    event.preventDefault()
  }