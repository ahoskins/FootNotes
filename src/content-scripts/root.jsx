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

/*
- look at react patterns to refactor large root components
- remove users and just use current chrome signed in user (done)
- make toolip scrollable and not overflow on edges
*/

// make it global so the events don't go out of lexical scope
let socket = null;

export default class Root extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentTime: null,
			totalTime: null,
			annotations: [],
			userName: ''
		}
	}

	/*
	Inject interval code into youtube.com, listen for currentTime and totalTime
	*/
	componentDidMount() {

		this.mirrorStorageToState();

		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
				console.log(request.userName);
				this.setState({userName: request.userName});
				this.initForUser();
		    sendResponse({farewell: "goodbye"});
		  });

		injectYoutubePoller();

		document.addEventListener('youtube', (e) => {
			this.setState({
				currentTime: e.detail.current,
				totalTime: e.detail.total
			});
		});

		window.addEventListener('hashChange', () => {
			// let the URL actually change first
			setTimeout(function() {
				this.mirrorStorageToState();
			}, 100);
		});
	}

	/*
	can be called once the username is gotten from the background page
	(the current chrome signed in user)
	*/
	initForUser() {
		// poll DB for new results
		getMatchingAnnotations(this.state.userName).then((response) => {
			for (let annotation of response) {
				this.saveAnnotationFromServer(annotation);
				deleteAnnotationById(annotation._id);
			}
		});

		// socket io and tell server its username to watch
		socket = io.connect("https://youtube-annotate-backend.herokuapp.com/");
		socket.on('message', (mes) => {
			socket.emit('my_name', this.state.userName);
		});

		socket.on('refresh_yo', (mes) => {
			getMatchingAnnotations(this.state.userName).then((response) => {
				for (let annotation of response) {
					this.saveAnnotationFromServer(annotation);
					deleteAnnotationById(annotation._id);
				}
			})
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
	save an annotation from server into localstorage
	if it already exists (already has been shared) don't add again
	*/
	saveAnnotationFromServer(annotation) {
		console.dir(annotation);

		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			// check if already contains annotation
			// TODO: this only checks for dups in the current URL, not all urls
			// SOLUTION: only query server from annotations for the current page, when the page switches query for more
			for (let existing of this.state.annotations) {
				if (existing.time === annotation.time) {
					return;
				}
			}

			// annotation doesn't exist yet, add it to localstorage
			const UrlAnnotations = obj[annotation.url] || [];
			UrlAnnotations.push({
				'content': annotation.content,
				'time': annotation.time
			});
			obj[annotation.url] = UrlAnnotations;

			chrome.storage.sync.set({'youtubeAnnotations': obj}, () => {
				this.mirrorStorageToState();
			})
		})
	}

	/*
	Saves a annotation from locally from (not from a friend)
	*/
	save(annotation) {
		// save annotation along with currentTime in localstorage
		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			const url = window.location.href;
			const UrlAnnotations = obj[url] || [];
			UrlAnnotations.push({
				'content': annotation,
				'time': this.state.currentTime
			});
			obj[url] = UrlAnnotations;

			chrome.storage.sync.set({'youtubeAnnotations': obj}, () => {
				this.mirrorStorageToState();
			});
		});
	}

	/*
	share each annotation on the current URL with the chosen user
	*/
	share(username) {
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
