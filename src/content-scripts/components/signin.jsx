import React from 'react';

const styles = {
	button: {
		border: '1px solid black',
		margin: '2px',
		borderRadius: '2px',
		cursor: 'pointer',
		padding: '2px',
    backgroundColor: '#d3d3d3'
	},
	input: {
		margin: '2px'
	},
  right: {
    float: 'right',
    padding: '5px'
  },
  welcome: {
    fontSize: '1.5em'
  },
  welcomeWrapper: {
    textAlign: 'center'
  }
}

export default class SignIn extends React.Component {
  constructor(props) {
		super(props);
		this.state = {
      inputValue: ''
    };
	}

	updateState(e) {
		this.setState({inputValue: e.target.value});
	}

	render() {
		return (
			<div>
        <span style={styles.right}>
          <input style={styles.input} onChange={this.updateState.bind(this)} />
          <button style={styles.button} onClick={this.props.signIn.bind(this, this.state.inputValue)}>Sign In</button>
        </span>
        <br />
        <div style={styles.welcomeWrapper}>
          <div style={styles.welcome}><b>Footnote: </b>soundcloud-style time-tied comments for youtube</div>
        </div>
			</div>
		)
	}
}
