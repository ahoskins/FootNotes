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
	buttonClose: {
		border: '1px solid black',
		margin: '2px',
		borderRadius: '2px',
		cursor: 'pointer',
		padding: '2px',
		backgroundColor: 'grey'
	},
	outer: {
		backgroundColor: '#d3d3d3',
		height: '100%',
		borderRadius: '4px'
	},
	input: {
		margin: '2px'
	},
	center: {
		textAlign: 'center'
	},
	sharedList: {
		marginLeft: '10px'
	}
}

// do something with username
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
			<div style={styles.outer}>
				<div style={styles.center}>
					{this.props.username}
					<input style={styles.input} onChange={this.updateState.bind(this)} placeholder="any google account" />
					<button style={styles.button} onClick={this.props.share.bind(this, this.state.inputValue)}>Share</button>
					<button style={styles.buttonClose} onClick={this.props.destroySelf.bind(this)}>x</button>
				</div>

				<div style={styles.sharedList}>
					<div style={styles.heading}>
						Currently sharing with:
					</div>
					<ul>
						{this.props.shared.map((user) => {
							return (
								<li key={user}>
									{user}
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		)
	}
}
