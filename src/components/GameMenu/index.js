import React from 'react';
import './style.css';

export default class GameMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      form: {
        worldWidth: 50,
        worldHeight: 50,
        topWall: false,
        bottomWall: false,
        leftWall: false,
        rightWall: false,
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

    return (
      <div className="gameMenu"
        onFocus={() => this.state.activated ? null : this.setState({...this.state, activated: true, form: {...this.state.form, worldWidth: this.props.state.width, worldHeight: this.props.state.height}})}
      >
        <form onSubmit={handleSubmit}>
          <span>Settings</span>
          <label>Width
            <input type="number" min="10" max="1000" name="worldWidth"
            value={this.state.activated ? this.state.form.worldWidth : this.props.state.width} onChange={handleChange}/>
          </label>
          <label>Height
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
          <button>Save</button>
        </form>
      </div>
    );
  }
};