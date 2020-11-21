export default class MatrixWidget {
  widgetId: null
  constructor() {
    this.widgetId = null
    window.addEventListener('message', this.onMessage.bind(this))
  }

  onMessage(event: any) {
    this.widgetId = this.widgetId || event.data.widgetId

    switch (event.data.api) {
      case 'fromWidget':
        break
      case 'toWidget':
        switch (event.data.action) {
          case 'capabilities':
            this.sendResponse(event, {
              capabilities: ['m.always_on_screen']
            })
            break
        }
        break
      default:
        break
    }
  }

  sendContentLoaded() {
    this.sendMessage({
      action: 'content_loaded'
    })
  }

  setAlwaysOnScreen(value: any) {
    // Extension of main spec, see https://github.com/matrix-org/matrix-doc/issues/1354
    this.sendMessage({
      action: 'set_always_on_screen',
      value: value, // once for spec compliance
      data: { value: value } // and once for Riot
    })
  }

  sendMessage(message: any) {
    if (!this.widgetId) return
    message.api = message.api || 'fromWidget'
    message.widgetId = message.widgetId || this.widgetId
    message.requestId = message.requestId || Math.random().toString(36)
    window.parent.postMessage(message, '*')
  }

  sendResponse(event: any, response: any) {
    event.data.response = response
    event.source.postMessage(event.data, event.origin)
  }
}