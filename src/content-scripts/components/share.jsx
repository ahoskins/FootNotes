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
		backgroundColor: 'grey',
		float: 'right'
	},
	outer: {
		borderLeft: '1px solid black',
		height: '100%'
	},
	input: {
		margin: '2px'
	},
	sharedList: {
		marginLeft: '10px'
	},
	heading: {
		fontWeight: 'bold',
		textAlign: 'center'
	},
	scroll: {
		overflow: 'scroll',
		height: '60px'
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
				<input style={styles.input} onChange={this.updateState.bind(this)} placeholder="any google account" />
				<button style={styles.button} onClick={this.props.share.bind(this, this.state.inputValue)}>Share</button>
				<button style={styles.buttonClose} onClick={this.props.destroySelf.bind(this)}>Close</button>

				<div style={styles.sharedList}>
					<div style={styles.heading}>
						Sharing With:
					</div>
					<ul style={styles.scroll}>
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
