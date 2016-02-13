import React from 'react';
import Annotater from './components/annotater.jsx';
import Playbar from './components/playbar.jsx';
import Share from './components/share.jsx';
import io from 'socket.io-client';
import ReactDOM from 'react-dom';

import {deleteAnnotationById, shareAnnotation, getMatchingAnnotations} from './backend.js';
import {injectYoutubePoller, injectSeekToTime, removeInjectedYoutubePoller} from './injecting.js';

const styles = {
	outer: {
		height: '100px',
		width: '100%',
		backgroundColor: '#fefefe',
		border: '1px solid #222222',
		padding: '3px'
	},
	main: {
		width: '75%',
		float: 'left'
	},
	share: {
		width: '23%',
		display: 'inline-block',
		height: '100%',
		margin: '0px 3px'
	}
};

function receiveEventsFromYoutube(e) {
	if (e.detail.location !== this.state.url) {
		this.mirrorStorageToState();
	}
	this.setState({
		currentTime: e.detail.current,
		totalTime: e.detail.total,
		url: e.detail.location
	});
}

// make it global so the events don't go out of lexical scope
let socket = null;
let receiver = null;

export default class Root extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentTime: null,
			totalTime: null,
			annotations: [],
			userName: '',
			url: '',
			shared: []
		}
	}

	componentDidMount() {
		// chrome.storage.sync.clear();
		this.mirrorStorageToState();

		// triggered when username is received from background
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
				this.setState({userName: request.userName});

				// poll DB for new results
				getMatchingAnnotations(this.state.userName)
				.then((annotations) => {
					// will not be added if already exists
					this.saveAnnotationArray(annotations);

					// always delete
					for (let a of annotations) {
						deleteAnnotationById(a._id);
					}
				});

				// socket-io connect and tell server its username to watch
				socket = io.connect("https://youtube-annotate-backend.herokuapp.com/");
				socket.on('message', (mes) => {
					socket.emit('my_name', this.state.userName);
				});

				// triggered when new entry for username put into DB (by a different user)
				// each new record will get added once here
				socket.on('new_record', (annotation) => {
					let annotations = [annotation];
					// will not be added if already exists
					this.saveAnnotationArray(annotations);
				});
		  });

		injectYoutubePoller();

		this.setState({url: window.location.href});

		receiver = receiveEventsFromYoutube.bind(this);
		document.addEventListener('youtube', receiver);

	}

	/*
	Set component state based on annotations and shared users at current url
	*/
	mirrorStorageToState() {
		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			// mirror current annotations for url if they exist
			if (obj[window.location.href] !== undefined) {
				this.setState({annotations: obj[window.location.href]});
			} else {
				this.setState({annotations: []});
			}

			if (obj['shared'] === undefined || obj['shared'][window.location.href] === undefined) {
				this.setState({shared: []});
			} else {
				this.setState({shared: obj['shared'][window.location.href]});
			}
		});
	}

	/*
	generic annotation saver (from user or server).
	check if already exits (timestamps identical).
	update state after.
	*/
	saveAnnotationArray(annotations) {
		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			for (let annotation of annotations) {
				let urlAnnotations = obj[annotation.url] || [];
				let exists = false;
				for (let existing of urlAnnotations) {
					if (existing.time === Number(annotation.time)) {
						exists = true;
					}
				}
				if (! exists) {
					urlAnnotations.push({
						'content': annotation.content,
						'time': Number(annotation.time),
						'author': annotation.author
					});
					obj[annotation.url] = urlAnnotations;
				}
			}

			chrome.storage.sync.set({'youtubeAnnotations': obj}, () => {
				this.mirrorStorageToState();
			});
		})
	}

	/*
	saves an annotation from user.
	share with all people we are sharing with
	*/
	save(content) {
		if (content === '') {
			return;
		}
		let annotation = [{
			'content': content,
			'time': this.state.currentTime,
			'author': this.state.userName,
			'url': window.location.href
		}];
		this.saveAnnotationArray(annotation);

		// update the people sharing with
		for (let person of this.state.shared) {
			shareAnnotation({
				'content': content,
				'time': this.state.currentTime,
				'author': this.state.userName
			}, person);
		}
	}

	/*
	share each annotation on the current URL with the chosen user.
	save to localstorage so it persists.
	*/
	share(username) {
		if (this.state.shared.indexOf(username) > -1) {
			return;
		}

		if (username.indexOf('@') > -1) {
			username = username.slice(0, username.indexOf('@'));
		}

		this.state.shared.push(username);
		this.setState({shared: this.state.shared});

		// share existing anootations written by current user
		for (let annotation of this.state.annotations) {
			if (annotation.author === this.state.userName) {
				shareAnnotation(annotation, username);
			}
		}

		// add shared person to localstorage
		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			let url = window.location.href;
			obj['shared'] = obj['shared'] || {};
			obj['shared'][url] = obj['shared'][url] || [];
			obj['shared'][url].push(username);

			chrome.storage.sync.set({'youtubeAnnotations': obj});
		})
	}

	/*
	respond to onclick the ticks in playbar
	*/
	seekTo(time) {
		injectSeekToTime(time);
	}

	/*
	unmount self (the root component)
	*/
	destroySelf() {
		// remove 1 second video interval
		document.removeEventListener('youtube', receiver);
		removeInjectedYoutubePoller();

		// unmount self and remove container from DOM
		let container = document.getElementById('footnotes-extension-container');
		ReactDOM.unmountComponentAtNode(container);
		container.parentNode.removeChild(container);
	}

	render() {
		return (
			<div style={styles.outer}>
					<div style={styles.main}>
						<Annotater save={this.save.bind(this)} />
						<Playbar
							currentTime={this.state.currentTime}
							totalTime={this.state.totalTime}
							annotations={this.state.annotations}
							seekTo={this.seekTo} />
					</div>
					<div style={styles.share}>
						<Share
							share={this.share.bind(this)}
							username={this.state.userName}
							shared={this.state.shared}
							destroySelf={this.destroySelf.bind(this)} />
					</div>
			</div>
		)
	}
}
