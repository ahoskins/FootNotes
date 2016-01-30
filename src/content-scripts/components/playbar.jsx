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
    backgroundColor: 'blue',
    height: '20px',
    width: '3px',
    position: 'relative',
    bottom: '12px',
    display: 'inline-block'
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
  }

  render() {
    const playedPercent = (this.props.currentTime / this.props.totalTime) * 100
    const restPercent = 100 - playedPercent;

    var self = this;
    let ticks = this.props.annotations.map(function(annotation) {
      let portion = (annotation.time / self.props.totalTime) * 100;

      return (
        <div style={m(styles.tick, {left: portion + '%'})}>
        </div>
      )
    })

    return (
      <div style={styles.outer}>
        <div style={Object.assign(styles.played, {width: playedPercent + '%' })}></div>
        <div style={Object.assign(styles.rest, {width: restPercent + '%' })}></div>
        {ticks}
      </div>
    )
  }
}
