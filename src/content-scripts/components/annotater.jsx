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
			<span>
				<input style={styles.input} onChange={this.updateState.bind(this)} />
				<button style={styles.button} onClick={this.props.save.bind(this, this.state.inputValue)}>Annotater</button>
			</span>
		)
	}
}
