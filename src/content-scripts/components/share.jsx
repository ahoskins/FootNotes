import React from 'react';

const styles = {
	button: {
		border: '1px solid black',
		margin: '2px',
		borderRadius: '2px',
		cursor: 'pointer',
		padding: '2px',
    backgroundColor: '#f5b83f'
	},
	input: {
		margin: '2px'
	},
  right: {
    float: 'right',
    marginRight: '10px'
  }
}

export default class Share extends React.Component {
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
				<button style={styles.button} onClick={this.props.share.bind(this, this.state.inputValue)}>Share With: </button>
        <input style={styles.input} onChange={this.updateState.bind(this)} placeholder="any google account" />
			</span>
		)
	}
}
