import React from 'react'

export default class JoinDialogBox extends React.Component<any, any> {
  construct() {
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit(event:any) {
    event.preventDefault()
  }

  render() {
    let joinOnly = false// temp
    if(joinOnly) {
      return (
        <div className="join-dialog dialog" /*data-bind="visible: visible() && joinOnly()"*/>
          <div className="dialog-header">
            Mumble Voice Conference
          </div>
          <form onSubmit = {this.handleSubmit}>
            <input className="dialog-submit" type="submit" value="Join Conference" />
          </form>
        </div>
      )
    }
  }
}