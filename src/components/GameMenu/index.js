import React from 'react';
import './style.css';

export default class GameMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      form: {
        owner: "",
        worldWidth: 50,
        worldHeight: 50,
        topWall: false,
        bottomWall: false,
        leftWall: false,
        rightWall: false,
        allowGuests: true,
        private: false,
        allow: "",
        unrestrictedSettings: false,
        disableProjectiles: false,
        restrictDrawing: false,
        drawers: "",
        exclude: "",
        admins: "",
      },
      activated: false,
    }
  }

  handleChange = e => {
    let val = e.target.type == "checkbox" ? e.target.checked : e.target.value
    this.setState({...this.state, form: {...this.state.form, [e.target.name]: val}});
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.onSubmit(this.state.form)
  };

  takeOwnership = e => {
    this.setState({...this.state, form: {...this.state.form, owner: this.props.auth.user.username}}, () => {
      this.props.onSubmit(this.state.form);
    });
  }

  componentDidMount() {
    this.setState({...this.state, form: {...this.state.form, ...this.props.roomSettings}});
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps.roomSettings) != JSON.stringify(this.props.roomSettings)) {
      this.setState({...this.state, form: {...this.state.form, ...this.props.roomSettings}});
    }
  }

  render() {
    let handleSubmit = this.handleSubmit;
    let handleChange = this.handleChange;
    let takeOwnership = this.takeOwnership;

    let username = this.props.auth.user.username;
    let isOwner = this.state.form.owner == username;
    let isAdmin = isOwner || this.state.form.unrestrictedSettings || this.state.form.admins.includes(username);

    let placeholderText = "user1, user2, user3, ..."
    return (
      <div className="gameMenu"
        onFocus={() => {this.state.activated ? null : this.setState({...this.state, activated: true, form: {...this.state.form, worldWidth: this.props.state.width, worldHeight: this.props.state.height}}); this.props.onFocus()}}
        onBlur={() => {this.props.onBlur();}}
      >
        { isAdmin ? <form onSubmit={handleSubmit}>
          <button type="button" onClick={e => {window.location.href = "/gallery"}}>Return to Gallery</button>
          <span>Settings</span>

          { this.state.form.owner ? <p>This room is owned by <strong>{this.state.form.owner}</strong></p> : <p>This room has no owner { true ? <button type="button" onClick={takeOwnership}>Take Ownership</button> : null}</p> }

          <label>Width:
            <input type="number" min="10" max="1000" name="worldWidth"
            value={this.state.activated ? this.state.form.worldWidth : this.props.state.width} onChange={handleChange}/>
          </label>
          <label>Height:
            <input type="number" min="10" max="1000" name="worldHeight"
            value={this.state.activated ? this.state.form.worldHeight : this.props.state.height} onChange={handleChange}/>
          </label>
          <div>
          <label>Walls:</label>
          <div style={{justifyContent: "space-between"}}>
            <label><input type="checkbox" name="topWall" checked={this.state.form.topWall} onChange={handleChange}/>Top</label>
            <label><input type="checkbox" name="bottomWall" checked={this.state.form.bottomWall} onChange={handleChange}/>Bottom</label>
            <label><input type="checkbox" name="leftWall" checked={this.state.form.leftWall} onChange={handleChange}/>Left</label>
            <label><input type="checkbox" name="rightWall" checked={this.state.form.rightWall} onChange={handleChange}/>Right</label>
          </div>
          </div>
          <label title="If this is unchecked, only logged-in users will be able to access this room">Allow Guests:<input disabled={this.state.form.private} type="checkbox" name="allowGuests" checked={!this.state.form.private && this.state.form.allowGuests} onChange={handleChange}/></label>
          <div>
            <label>Private Room:<input type="checkbox" name="private" checked={this.state.form.private} onChange={handleChange}/></label>
            {this.state.form.private ? <div><label title="Only the users in the list will be able to join this room">Members List:<br/>
              <input placeholder={placeholderText} type="text" name="allow" value={this.state.form.allow} onChange={handleChange}/>
            </label></div> : null}
          </div>
          <div>
            <label>Disable Projectiles:<input type="checkbox" name="disableProjectiles" checked={this.state.form.disableProjectiles} onChange={handleChange}/></label>
          </div>
          <div>
            <label>Restrict Drawing:<input type="checkbox" name="restrictDrawing" checked={this.state.form.restrictDrawing} onChange={handleChange}/></label>
            {this.state.form.restrictDrawing ? <div><label title="Only the users in this list will be able to draw">Drawers:<br/>
              <input placeholder={placeholderText} type="text" name="drawers" value={this.state.form.drawers} onChange={handleChange}/>
            </label></div> : null}
          </div>
          <label>Anyone Can Edit Settings:
            <input disabled={!isOwner} type="checkbox" name="unrestrictedSettings" checked={this.state.form.unrestrictedSettings} onChange={handleChange}/>
          </label>
          { isOwner ? <label title="Users in this list can change the room's settings">Admins:<br/>
            <input placeholder={placeholderText} type="text" name="admins" value={this.state.form.admins} onChange={handleChange}/>
          </label> : null}
          <label title="Users in this list will be blocked from joining the room">Ban List:<br/>
            <input placeholder={placeholderText} type="text" name="exclude" value={this.state.form.exclude} onChange={handleChange}/>
          </label>
          <button>Save</button>
          <p>Players:</p>
          <ul>
            {this.props.state.playerList.map(p => {
              return (p.username ? <li key={p.playerId}>{p.username}</li> : <li key={p.playerId}>Guest {p.playerId}</li>)
            })}
          </ul>
        </form> :
        // form shown to non-admins:
        <form>
          <button type="button" onClick={() => {window.location.href = "/gallery"}}>Return to Gallery</button>
          <span>Settings</span>
          { this.state.form.owner ? <p>This room is owned by <strong>{this.state.form.owner}</strong></p> : <p>This room has no owner { username ? <button type="button" onClick={takeOwnership}>Take Ownership</button> : null}</p> }
          { this.state.form.disableProjectiles ? <p>Projectiles disabled</p> : null}
          { this.state.form.restrictDrawing ? <p>Drawing is restricted</p> : null}
          { this.state.form.private ? <p>Room is private</p> : null}
          { this.state.form.allowGuests ? null : <p>Guests not allowed</p>}
          <p>Size: {this.state.form.worldWidth}x{this.state.form.worldHeight}</p>
          <p>Players:</p>
          <ul>
            {this.props.state.playerList.map(p => {
              return (p.username ? <li key={p.playerId}>{p.username}</li> : <li key={p.playerId}>Player {p.playerId} <em>(Guest)</em></li>)
            })}
          </ul>
        </form>
        }
      </div>
    );
  }
};