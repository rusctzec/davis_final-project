import React from 'react';
import './style.css';

export default class GameMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      form: {
        worldWidth: props.state.width,
        worldHeight: props.state.height,
        floor: true,
        walls: false,
        active: false,
      },
      lastForm: {},
      activated: false,
    }
  }

  handleChange = e => {
    console.log(e.target.type);
    let val = e.target.type == "checkbox" ? e.target.checked : e.target.value
    this.setState({...this.state, form: {...this.state.form, [e.target.name]: val}});
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.onSubmit(this.state.form)
  };

  render() {

    let handleSubmit = this.handleSubmit;
    let handleChange = this.handleChange;

    return (
      <div className="gameMenu"
        onFocus={() => this.state.activated ? null : this.setState({...this.state, activated: true, form: {...this.state.form, worldWidth: this.props.state.width, worldHeight: this.props.state.height}})}
      >
        {/*
        <li>
          {Object.keys(props.state).map(v => <ul key={v}>{v}: {props.state[v]}</ul>)}
          <p>---</p>
          {props.settings ? Object.keys(props.settings).map(v => <ul key={v}>{v}: {JSON.stringify(props.settings[v])}</ul>) : null}
        </li>
          */}
        <form onSubmit={handleSubmit}>
          <input type="number" min="10" max="1000" name="worldWidth"
          value={this.state.activated ? this.state.form.worldWidth : this.props.state.width} onChange={handleChange}/>
          <input type="number" min="10" max="1000" name="worldHeight"
          value={this.state.activated ? this.state.form.worldHeight : this.props.state.height} onChange={handleChange}/>
          <input type="checkbox" name="floor" checked={this.state.form.floor} onChange={handleChange}/>
          <input type="checkbox" name="walls" checked={this.state.form.walls} onChange={handleChange}/>
          <button>Submit</button>
        </form>
      </div>
    );
  }
};