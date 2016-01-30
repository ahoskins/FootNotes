import React from 'react';

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
			<div>
				<input onChange={this.updateState.bind(this)} />
				<button onClick={this.props.save.bind(this, this.state.inputValue)}>Annotater</button>
			</div>
		)
	}
}
