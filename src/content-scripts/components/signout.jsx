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
    marginRight: '20px'
  }
}

export default class SignOut extends React.Component {
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
			<span style={styles.right}>
        <button style={styles.button} onClick={this.props.signout.bind(this, this.state.inputValue)}>Sign out <b>{this.props.user}</b></button>
			</span>
		)
	}
}
