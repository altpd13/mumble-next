import React from 'react'

export default class ConnectErrorDialog extends React.Component<any, any> {
  render() {
    let visible = true
    if (visible) {
      return (
        <div className="connect-dialog error-dialog dialog" /*data-bind="visible: visible()"*/>
          <div className="dialog-header">
            Failed to connect
          </div>
          <form>
            <table>
              <tr className="reason">
                <td colSpan={2}>
                  <span className="refused">
                      The connection has been refused.
                  </span>
                  <span className="version">
                      The server uses an incompatible version.
                    </span>
                  <span className="username">
                      Your user name was rejected. Maybe try a different one?
                    </span>
                  <span className="userpassword">
                      The given password is incorrect.
                      The user name you have chosen requires a special one.
                    </span>
                  <span className="serverpassword">
                      The given password is incorrect.
                    </span>
                  <span className="username-in-use">
                      The user name you have chosen is already in use.
                    </span>
                  <span className="full">
                      The server is full.
                    </span>
                  <span className="clientcert">
                      The server requires you to provide a client certificate
                      which is not supported by this web application.
                    </span>
                  <br/>
                  <span className="server">
                      The server reports:
                    </span>
                  <br/>
                  "<span className="connect-error-reason" data-bind="text: reason"></span>"
                </td>
              </tr>
            </table>
            <div className="dialog-footer">
              <input className="dialog-close" type="button" value="Cancel"
                     data-bind="click: hide, visible: !joinOnly()"/>
              <input className="dialog-submit" type="submit" value="Retry"/>
            </div>
          </form>
        </div>
      )
    }
  }
}