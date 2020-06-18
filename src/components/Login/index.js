import React from 'react';
import './style.css';
export default class Login extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      username: "",
      password: "",
      response: "",
    }
  }


  render() {
    return (
      <div className="loginContainer">
        <form className="loginForm" onSubmit={this.handleSubmit.bind(this)}>
          <h1>{this.props.signup ? 'Signup' : 'Login'}</h1>
          <label>Username: <input required name="username" type="text" onChange={e => this.setState({...this.state, [e.target.name]: e.target.value})}/></label>
          <label>Password: <input required name="password" type="password" onChange={e => this.setState({...this.state, [e.target.name]: e.target.value})}/></label>
          <button>Submit</button>
        </form>
        <p>{this.state.response}</p>
      </div>
    );
  }

  handleSubmit(e) {
    e.preventDefault();
    let url = `/api/${this.props.signup ? 'signup' : 'login'}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username: this.state.username, password: this.state.password})
    })
    .then(r => {
      console.log(r.status);
      if (r.status == 200) this.props.history.push("/gallery");
      // handle server errors
      if (r.status >= 500) {
        this.setState({...this.state, response: "Server error."});
        throw r.status;
      }
      // handle client errors for login
      else if (r.status >= 400 && !this.props.signup) {this.setState({...this.state, response: "Incorrect username or password"}); throw r.status};
      // for signup client errors unpack json for more info
      return r.json();
    })
    .then(r => {
      if (r.error) this.setState({...this.state, response: r.error});
    }).catch(err => {
      // do nothing
      void err;
    });
  }

}