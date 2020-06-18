import React from 'react';
import GalleryItem from '../GalleryItem';
import { AuthContext } from '../../utils/AuthContext';
import './style.css';

export default class Gallery extends React.Component {

  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      ready: false,
      query: '1',
      private: false,
    };
    this.context = AuthContext;
  }

  render() {
    return (
      <div className="galleryContainer">
        <form onSubmit={e => { e.preventDefault(); this.props.history.push("/game/"+this.state.query)}}>
          <div>Join or create a new game</div>
          <label>/</label><input type="text" spellCheck="false" value={this.state.query} onChange={e => {
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
    this.context.onReloadNeeded();
    (async () => {

       let r2 = await fetch("/api/games")
       let games = await r2.json();

      this.setState({...this.state,
        ready: true,
        items: games,
      });

    })()
  }
}