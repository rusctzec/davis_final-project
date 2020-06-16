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
    };
  }

  render() {

    return (
      <div className="galleryContainer">
        <form onSubmit={() => this.props.history.push("/game/"+this.state.query)}>
          <div>Join or create a new game</div>
          <label>/</label><input type="text" /*value={this.state.query}*/ onChange={e => {
            return
            let str = e.target.value;
            str.replace('/', '');
            str = str.match(/^[0-9A-Za-z]*/)[0] || "";
            //this.setState({...this.state, query: str})
          }}/>
          <button>Go</button>
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