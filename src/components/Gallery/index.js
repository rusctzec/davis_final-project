import React from 'react';
import GalleryItem from '../GalleryItem';
import './style.css';

export default class Gallery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      ready: false,
      query: '1',
      private: false,
    };
  }

  render() {

    return (
      <div className="galleryContainer">
        <form onSubmit={() => this.props.history.push("/game/"+this.state.query)}>
          <div>Join or create a new game</div>
          <label>/</label><input type="text" spellcheck="false" value={this.state.query} onChange={e => {
            let str = e.target.value;
            str.replace('/', '');
            let strMatch = str.match(/^[0-9A-Za-z]{0,6}$/);
            str = strMatch ? strMatch[0] : this.state.query;
            this.setState({...this.state, query: str})
          }}/>
          <button disabled={this.state.query.length < 1}>Go</button>
          <label style={{display: 'block'}}>Private: <input type="checkbox"/></label>
        </form>
        <div className="gallery">
          {this.state.items.map((item, i) => (
            <GalleryItem key={i} data={item}/>
          ))}
        </div>
      </div>
    );
  }

  componentDidMount() {
    fetch("/api/games")
    .then(r => r.json())
    .then(r => {
      this.setState({...this.state, ready: true, items: r});
    });
  }
}