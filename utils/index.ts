import 'stream-browserify' // see https://github.com/ericgundrum/pouch-websocket-sync-example/commit/2a4437b013092cc7b2cd84cf1499172c84a963a3
import 'subworkers' // polyfill for https://bugs.chromium.org/p/chromium/issues/detail?id=31666
import url from 'url'
import ByteBuffer from 'bytebuffer'
import MumbleClient from 'mumble-client'
import WorkerBasedMumbleConnector from './worker-client'
import BufferQueueNode from 'web-audio-buffer-queue'
import audioContext from 'audio-context'
import keyboardjs from 'keyboardjs'

const url =  require('url')
const ByteBuffer = require('bytebuffer')
const MumbleClient = require('mumble-client')
const BufferQueueNode = require('web-audio-buffer-queue')