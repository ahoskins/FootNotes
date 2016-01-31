import React from 'react';

const styles = {
	button: {
		border: '1px solid black',
		margin: '2px',
		borderRadius: '2px',
		cursor: 'pointer',
		padding: '2px'
	},
	input: {
		margin: '2px'
	}
}

export default class Share extends React.Component {
  constructor(props) {
		super(props);
		this.state = {
      inputValue: '',
      userName: ''
    };
	}

	updateState(e) {
		this.setState({inputValue: e.target.value});
	}

  updateUser(e) {
    this.setState({userName: e.target.value});
  }

	render() {
		return (
			<span>
				<input style={styles.input} onChange={this.updateState.bind(this)} />
				<button style={styles.button} onClick={this.props.share.bind(this, this.state.inputValue)}>Share Video Annotations</button>
        <input style={styles.input} onChange={this.updateUser.bind(this)} />
        <button style={styles.button} onClick={this.props.user.bind(this, this.state.userName)}>Set UserName</button>
			</span>
		)
	}
}
