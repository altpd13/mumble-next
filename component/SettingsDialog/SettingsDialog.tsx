import React from 'react'

export default class SettingsDialog extends React.Component<any, any> {
  rafID: number | undefined
  constructor(props: any) {
    super(props)
    this.state = {
      voiceMode: window.mumbleUi.settings.voiceMode,
      vadLevel: window.mumbleUi.settingsDialog.vadLevel,
      testVadActive: window.mumbleUi.settingsDialog.testVadActive,
      testVadLevel: window.mumbleUi.settingsDialog.testVadLevel,
      audioBitrate: window.mumbleUi.settingsDialog.audioBitrate,
      msPerPacket: window.mumbleUi.settingsDialog.msPerPacket,
      showAvatar: window.mumbleUi.settingsDialog.showAvatars,
      userCount: window.mumbleUi.settingsDialog.userCountInChannelName
    }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.hideSettings = this.hideSettings.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.tick = this.tick.bind(this)
  }

  handleChange = (event: any) => {
    const name = event.target.name
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    console.log(name)
    console.log(value)
    this.setState({
      [name]: value
    })
    if(name === 'vadLevel') {
      window.mumbleUi.settingsDialog.changeVadLevel = Number(event.target.value)
    }
    if(name === 'audioBitrate') {
      window.mumbleUi.settingsDialog.audioBitrate = Number(event.target.value)
    }
    if(name === 'msPerPacket') {
      window.mumbleUi.settingsDialog.msPerPacket = Number(event.target.value)
      window.mumbleUi.settingsDialog.audioBitrate = event.target.value * 48
    }
    if(name === 'showAvatar') {
      window.mumbleUi.settingsDialog.showAvatars = event.target.value
    }
    if(name === 'userCount') {
      window.mumbleUi.settingsDialog.userCountInChannelName = value // check state so weird
    }
    // eval(`window.mumbleUi.settingsDialog.${name}`+`=`+`event.target.value`)
  }

  componentDidMount() {
    console.log(this.state.userCount)
    this.rafID = requestAnimationFrame(this.tick)
  }
  componentWillUnmount() {
    if (this.rafID != null) {
      cancelAnimationFrame(this.rafID)
    }
  }

  handleSubmit(event: any) {
    if (this.rafID != null) {
      cancelAnimationFrame(this.rafID)
    }
    event.preventDefault()
    window.mumbleUi.applySettings()
    this.props.onShow(!this.props.show)
  }

  hideSettings() {
    this.props.onShow(!this.props.show)
    window.mumbleUi.closeSettings()
  }

  tick() {
    this.setState((state:any)=>({
      testVadLevel: state.testVadLevel,
      testVadActive: state.testVadActive
    }))
    window.mumbleUi.settingsDialog.vadLevel = this.state.vadLevel
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
                  {/*keyboard combo not added*/}
                  <input type="button" data-bind="value: pttKeyDisplay, click: recordPttKey"/>
                </td>
              </tr> : null
            }
            <tr>
              <td>Audio Quality</td>
              <td><span>{(this.state.audioBitrate/1000).toFixed(1)}</span> kbit/s</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input name="audioBitrate" type="range" min="8000" max="96000" step="8"
                      value = {this.state.audioBitrate} onChange = {this.handleChange}/>
              </td>
            </tr>
            <tr>
              <td>Audio per packet</td>
              <td><span>{this.state.msPerPacket}</span> ms</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <input name = "msPerPacket" type="range" min="10" max="60" step="10"
                       value = {this.state.msPerPacket} onChange={this.handleChange}/>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="bandwidth-info">
                <span>{(window.mumbleUi.settingsDialog.totalBandwidth()/1000).toFixed(1)}</span>
                kbit/s
                (Audio
                <span>{(window.mumbleUi.settingsDialog.audioBitrate/1000).toFixed(1)}</span>,
                Position
                <span>{(window.mumbleUi.settingsDialog.positionBandwidth()/1000).toFixed(1)}</span>,
                Overhead
                <span>{(window.mumbleUi.settingsDialog.overheadBandwidth()/1000).toFixed(1)}</span>)
              </td>
            </tr>
            <tr>
              <td>Show Avatars</td>
              <td>
                <select name="showAvatar" value={this.state.showAvatar} onChange={this.handleChange}>
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
                <input name="userCount" type="checkbox" onChange={this.handleChange} checked={
                  this.state.userCount}/>
                Show user count after channel name
              </td>
            </tr>
            </tbody>
          </table>
          <div className="dialog-footer">
            <input className="dialog-close" type="button" value="Cancel"
                   onClick={this.hideSettings}/>
            <input className="dialog-submit" type="submit" value="Apply"/>
          </div>
        </form>
      </div>
    )
  }
}