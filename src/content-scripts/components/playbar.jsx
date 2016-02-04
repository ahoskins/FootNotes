import React from 'react';

const styles = {
  outer: {
    width: '100%'
  },
  played: {
    display: 'inline-block',
    backgroundColor: 'red',
    height: '5px',
    cursor: 'pointer'
  },
  rest: {
    display: 'inline-block',
    backgroundColor: 'black',
    height: '5px',
    cursor: 'pointer'
  },
  tick: {
    backgroundColor: 'black',
    height: '22px',
    width: '0.4%',
    position: 'absolute',
    display: 'inline-block',
    cursor: 'pointer'
  },
  tooltip: {
    width: '12%',
    position: 'absolute',
    marginTop: '15px',
    lineHeight: '30px',
    padding: '3px'
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

/*
component that takes in currentTime, totalTime and annotations for current URL
outputs the clone of the youtube player with annotion ticks and tooltip annotation content
*/
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
    this.props.annotations.forEach((annotation) => {
      this.state.hovered[annotation.time] = false;
    })
    this.setState({hovered: this.state.hovered});
  }

  seekTo(time) {
    this.props.seekTo(time);
  }

  playbarClickPlayed(widthInPercent, e) {
    const ne = e.nativeEvent;
    const portionIntoLeft = ne.clientX / ne.target.clientWidth;
    const totalPortion = portionIntoLeft * (widthInPercent / 100);

    this.props.seekTo(this.props.totalTime * totalPortion);
  }

  playbarClickRest(restPercent, e) {
    const ne = e.nativeEvent;
    const restPortion = restPercent / 100;
    const playedPortion = 1 - restPortion;
    const contributingPercent = ((ne.clientX - ne.target.offsetLeft) / ne.target.clientWidth) * restPortion;

    this.props.seekTo((playedPortion + contributingPercent) * this.props.totalTime);
  }

  render() {
    const playedPercent = (this.props.currentTime / this.props.totalTime) * 100
    const restPercent = 100 - playedPercent;

    /*
    Tooltip showing algorithm rules:
    - only one is shown at once
    - hovered always wins
    - if none hovered, find the closest within +-2 seconds
    */
    let ticks = [];
    let shownAnnotation = null
    if (this.props.annotations.length >= 1) {
      // if hovered, show this and we're done
      for (let annotation of this.props.annotations) {
        if (this.state.hovered[annotation.time] === true) {
          shownAnnotation = annotation;
        }
      }

      // only look for closed within 2 if none hovered
      if (! shownAnnotation) {
        for (let annotation of this.props.annotations) {
          // is it within range to be shown?
          if (this.props.currentTime > (annotation.time - 2) && this.props.currentTime < (annotation.time + 2)) {
            // is it closer than an already found candidate
            if (! shownAnnotation) {
              shownAnnotation = annotation;
            } else {
              // is it closer than the current?
              if (Math.abs(annotation.time - this.props.currentTime) < Math.abs(shownAnnotation.time - this.props.currentTime)) {
                shownAnnotation = annotation;
              }
            }
          }
        }
      }

      // shownAnnotation may or may not be null, depends if one should be shown
      // create the ticks and if any of them === shownAnnotation, then show it!
      ticks = this.props.annotations.map((annotation) => {
        let portion = (annotation.time / this.props.totalTime) * 100;

        let d = {display: 'none'};
        // are you the chosen one?
        if (annotation === shownAnnotation) {
          d.display = 'inline-block';
        }

        let orientation = null;
        if (portion > 50) {
          // tooltip go to the left
          let r = 100 - portion - 0.4; // compensate for tick width
          orientation = {
            right: r + '%',
            textAlign: 'right',
            borderRight: '1px solid #f3b61f',
          }
        } else {
          // tooltip go to the right
          orientation = {
            left: portion + '%',
            textAlign: 'left',
            borderLeft: '1px solid #f3b61f'
          }
        }

        return (
          <span key={annotation.time}>
            <div
              style={m(styles.tick, {left: portion + '%'})}
              onMouseOver={this.setTrue.bind(this, annotation.time)}
              onMouseOut={this.setFalse.bind(this, annotation.time)}
              onClick={this.seekTo.bind(this, annotation.time)}>
            </div>
            <div
              style={m(styles.tooltip, orientation, d)}
              onMouseOver={this.setTrue.bind(this, annotation.time)}
              onMouseOut={this.setFalse.bind(this, annotation.time)}>
                {annotation.content}
            </div>
          </span>
        )
      })

    }

    return (
      <div style={styles.outer}>
        <div
          style={m(styles.played, {width: playedPercent + '%' })}
          onClick={this.playbarClickPlayed.bind(this, playedPercent)}>
        </div>
        <div
          style={m(styles.rest, {width: restPercent + '%' })}
          onClick={this.playbarClickRest.bind(this, restPercent)}></div>
        {ticks}
      </div>
    )
  }
}
