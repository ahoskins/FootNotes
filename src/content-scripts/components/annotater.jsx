import React from 'react'

export default class Annotate extends React.Component {
	constructor(props) {
		super(props);
		this.state  = {inputValue: ''};
	}

	updateState(e) {
		this.setState({inputValue: e.target.value});
	}

	save() {
		this.props.save(this.state.inputValue);
	}

	render() {
		return (
			<div>
				<input onClick={this.updateState} />
				<button onClick={this.save}>Annotater</button>
			</div>
		)
	}
}
