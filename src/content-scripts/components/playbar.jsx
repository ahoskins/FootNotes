import React from 'react';

const styles = {
  outer: {
    width: '100%'
  },
  played: {
    display: 'inline-block',
    backgroundColor: 'red',
    height: '5px'
  },
  rest: {
    display: 'inline-block',
    backgroundColor: 'black',
    height: '5px'
  },
  tick: {
    backgroundColor: '#f3b61f',
    height: '22px',
    width: '5px',
    position: 'relative',
    bottom: '16px',
    display: 'inline-block'
  },
  tooltip: {
    backgroundColor: '#bbd8b3',
    height: '20px',
    width: '10%',
    position: 'absolute',
    marginTop: '10px'
  }
}

// combine arbitrary number of objects. immutable version of ES6 Object.assign().
let m = function() {
  let result = {};
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      for (let k in arguments[i]) {
        result[k] = arguments[i][k];
      }
    }
  }
  return result;
}

// takes in as props: currentTime and totalTime and annoations object for this URL
//
// render a tick (for an existing annotation) at a certain portion of the total size
// render a tick (for the currentTime), same rule
//
// get outerWidth and totalTime
// currentTime/totalTime * outerWidth = location-of-current-time

// two divs, both inline.  left div is as wide as the curent play time, right div fills the rest
export default class Playbar extends React.Component {
  constructor(props) {
    super(props);
    // each annotation time gets a boolean saying if its currently hovered
    this.state = {
      hovered: {}
    }
  }

  setTrue(time) {
    this.state.hovered[time] = true;
    this.setState({hovered: this.state.hovered});
  }

  setFalse(time) {
    this.state.hovered[time] = false;
    this.setState({hovered: this.state.hovered});
  }

  componentWillMount() {
    this.initAllToolTipsNotActive()
  }

  initAllToolTipsNotActive() {
    let self = this;
    this.props.annotations.forEach(function(annotation) {
      self.state.hovered[annotation.time] = false;
    })
    this.setState({hovered: this.state.hovered});
  }

  componentWillReceiveProps(newProps) {
    // this.initAllToolTipsNotActive();
  }

  seekTo(time) {
    console.log(time);
    this.props.seekTo(time);
  }

  render() {
    const playedPercent = (this.props.currentTime / this.props.totalTime) * 100
    const restPercent = 100 - playedPercent;

    var self = this;
    let ticks = this.props.annotations.map(function(annotation) {
      let portion = (annotation.time / self.props.totalTime) * 100;

      // if not set then display none
      let d = {display: 'none'};
      if (self.state.hovered[annotation.time] === true) {
        d.display = 'inline-block';
      }

      return (
        <span>
          <div
            style={m(styles.tick, {left: portion + '%'})}
            onMouseOver={self.setTrue.bind(self, annotation.time)}
            onMouseOut={self.setFalse.bind(self, annotation.time)}
            onClick={self.seekTo.bind(self, annotation.time)}>
          </div>
          <div style={m(styles.tooltip, {left: (portion - 5) + '%'}, d)}>
              contents here
          </div>
        </span>
      )
    })


    // hover tick and see tooltip with annotation
    // click tick and jump to that part of the video

    return (
      <div style={styles.outer}>
        <div style={Object.assign(styles.played, {width: playedPercent + '%' })}></div>
        <div style={Object.assign(styles.rest, {width: restPercent + '%' })}></div>
        {ticks}
      </div>
    )
  }
}
