import React from 'react'

export default class SettingsDialog extends React.Component<any, any> {
  rafID: number | undefined
  constructor(props: any) {
    super(props)
    this.state = {
      voiceMode: window.mumbleUi.settings.voiceMode,
      vadLevel: window.mumbleUi.settingsDialog.vadLevel,
      testVadActive: window.mumbleUi.settingsDialog.testVadActive
    }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.hideSettings = this.hideSettings.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.tick = this.tick.bind(this)
  }

  handleChange = (event: any) => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  componentDidMount() {
    this.rafID = requestAnimationFrame(this.tick)
  }
  componentWillUnmount() {
    if (this.rafID != null) {
      cancelAnimationFrame(this.rafID)
    }
  }

  handleSubmit(event: any) {
    event.preventDefault()
    window.mumbleUi.applySettings()
  }

  hideSettings() {
    this.props.onShow(!this.props.show)
    window.mumbleUi.closeSettings()
  }
  tick() {
    this.setState((state:any)=>({
      vadLevel: state.vadLevel,
      testVadActive: state.testVadActive
    }))
    this.rafID = requestAnimationFrame(this.tick)
  }

  render() {
    return (
      <div className="settings-dialog dialog">
        <div className="dialog-header">
          Settings
        </div>
        <form onSubmit={this.handleSubmit}>
          <table>
            <tbody>
            <tr>
              <td>Transmission</td>
              <td>
                <select name="voiceMode" value={this.state.voiceMode} onChange={this.handleChange}>
                  <option value="cont">Continuous</option>
                  <option value="vad">Voice Activity</option>
                  <option value="ptt">Push To Talk</option>
                </select>
              </td>
            </tr>

            {this.state.voiceMode === 'vad'?
              <tr data-bind="visible: voiceMode() == 'vad'">
                <td colSpan={2}>
                  <div className="mic-volume-container">
                    <div className="mic-volume" style= {{
                          width: window.mumbleUi.settingsDialog.testVadLevel*100 + '%',
                          background: window.mumbleUi.settingsDialog.testVadActive ? 'green' : 'red'
                        }}></div>
                  </div>
                  <input name='vadLevel' type="range" min="0" max="1" step="0.01"
                         value={this.state.vadLevel} onChange={this.handleChange}/>
                </td>
              </tr> : null
            }
            {this.state.voiceMode === 'ptt'?
              <tr data-bind="visible: voiceMode() == 'ptt'">
                <td>PTT Key</td>
                <td>
                  <input type="button" data-bind="value: pttKeyDisplay, click: recordPttKey"/>
                </td>
              </tr> : null
            }
            <tr>
              <td>Audio Quality</td>
              <td><span data-bind="text: (audioBitrate()/1000).toFixed(1)"></span> kbit/s</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input type="range" min="8000" max="96000" step="8"
                       data-bind="value: audioBitrate, valueUpdate: 'input'"/>
              </td>
            </tr>
            <tr>
              <td>Audio per packet</td>
              <td><span data-bind="text: msPerPacket"></span> ms</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input type="range" min="10" max="60" step="10"
                       data-bind="value: msPerPacket, valueUpdate: 'input'"/>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="bandwidth-info">
                <span data-bind="text: (totalBandwidth()/1000).toFixed(1)"></span>
                kbit/s
                (Audio
                <span data-bind="text: (audioBitrate()/1000).toFixed(1)"></span>,
                Position
                <span data-bind="text: (positionBandwidth()/1000).toFixed(1)"></span>,
                Overhead
                <span data-bind="text: (overheadBandwidth()/1000).toFixed(1)"></span>)
              </td>
            </tr>
            <tr>
              <td>Show Avatars</td>
              <td>
                <select data-bind='value: showAvatars'>
                  <option value="always">Always</option>
                  <option value="own_channel">Same Channel</option>
                  <option value="linked_channel">Linked Channels</option>
                  <option value="minimal_only">Minimal View</option>
                  <option value="never">Never</option>
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input type="checkbox" data-bind="checked: userCountInChannelName"/>
                Show user count after channel name
              </td>
            </tr>
            </tbody>
          </table>
          <div className="dialog-footer">
            <input className="dialog-close" type="button" data-bind="click: $root.closeSettings" value="Cancel"
                   onClick={this.hideSettings}/>
            <input className="dialog-submit" type="submit" value="Apply"/>
          </div>
        </form>
      </div>
    )
  }
}