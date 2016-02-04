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
		margin: '2px',
		width: '20%'
	},
	outer: {
		marginLeft: '20px'
	}
}

export default class Annotater extends React.Component {
	constructor(props) {
		super(props);
		this.state = {inputValue: ''};
	}

	updateState(e) {
		this.setState({inputValue: e.target.value});
	}

	render() {
		return (
			<span style={styles.outer}>
				<input style={styles.input} onChange={this.updateState.bind(this)} placeholder="write a comment" />
				<button style={styles.button} onClick={this.props.save.bind(this, this.state.inputValue)}>Comment</button>
			</span>
		)
	}
}
