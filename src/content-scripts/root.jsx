import React from 'react';
import Annotater from './components/annotater.jsx';
import Playbar from './components/playbar.jsx';
import Share from './components/share.jsx';
import io from 'socket.io-client';

import {deleteAnnotationById, shareAnnotation, getMatchingAnnotations} from './network.js';
import {injectYoutubePoller, injectSeekToTime} from './injecting.js';

const styles = {
	outer: {
		height: '80px',
		width: '100%',
		backgroundColor: '#fefefe',
		border: '1px solid #222222',
		padding: '3px'
	},
	right: {
		float: 'right',
		marginRight: '10px',
		fontSize: '0.8em'
	}
};

// make it global so the events don't go out of lexical scope
let socket = null;

export default class Root extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentTime: null,
			totalTime: null,
			annotations: [],
			userName: '',
			url: ''
		}
	}

	/*
	Inject interval code into youtube.com, listen for currentTime and totalTime
	*/
	componentDidMount() {
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
					console.log('new record from socket');
					let annotations = [annotation];
					console.dir(annotation);
					// will not be added if already exists
					this.saveAnnotationArray(annotations);
				});
		  });

		injectYoutubePoller();

		this.setState({url: window.location.href});

		document.addEventListener('youtube', (e) => {
			if (e.detail.location !== this.state.url) {
				this.mirrorStorageToState();
			}
			this.setState({
				currentTime: e.detail.current,
				totalTime: e.detail.total,
				url: e.detail.location
			});
		});
	}

	/*
	Set component state based on annotations at current url
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
		});
	}

	/*
	generic annotation server (from user or server).
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
	Saves an annotation from user
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
	}

	/*
	share each annotation on the current URL with the chosen user
	*/
	share(username) {
		// remove @gmail.com if they put it
		if (username.indexOf('@') > -1) {
			username = username.slice(0, username.indexOf('@'));
		}
		for (let annotation of this.state.annotations) {
			shareAnnotation(annotation, username);
		}
	}

	/*
	respond to onclick the ticks in playbar
	*/
	seekTo(time) {
		injectSeekToTime(time);
	}

	render() {
		return (
			<div style={styles.outer}>
					<Annotater save={this.save.bind(this)} />
					<span style={styles.right}>User: <b>{this.state.userName}</b></span>
					<Share share={this.share.bind(this)} />
					<Playbar
						currentTime={this.state.currentTime}
						totalTime={this.state.totalTime}
						annotations={this.state.annotations}
						seekTo={this.seekTo} />
			</div>
		)
	}
}
