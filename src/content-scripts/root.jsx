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
- add author of each annotatation
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
			userName: '',
			url: ''
		}
	}

	/*
	Inject interval code into youtube.com, listen for currentTime and totalTime
	*/
	componentDidMount() {
		this.mirrorStorageToState();

		// listen for background page to tell who the user is.
		// then get new results from DB
		// also handles listening for a change of account
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
				this.setState({userName: request.userName});
				this.initForUser();
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
	can be called once the username is gotten from the background page
	(the current chrome signed in user)
	*/
	initForUser() {
		let saveNewAnnotations = (response) => {
			for (let annotation of response) {
				this.saveAnnotationFromServer(annotation);
				deleteAnnotationById(annotation._id);
			}
		}
		// poll DB for new results
		getMatchingAnnotations(this.state.userName)
		.then(saveNewAnnotations);

		// socket-io connect and tell server its username to watch
		socket = io.connect("https://youtube-annotate-backend.herokuapp.com/");
		socket.on('message', (mes) => {
			socket.emit('my_name', this.state.userName);
		});

		// triggered when new entry for username put into DB (by a different user)
		socket.on('refresh_yo', (mes) => {
			getMatchingAnnotations(this.state.userName)
			.then(saveNewAnnotations);
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
	saveAnnotation(content, time, url, author) {
		chrome.storage.sync.get('youtubeAnnotations', (obj) => {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			// each annotation has a target URL, check if it already exists in localstorage
			let urlAnnotations = obj[url] || [];
			for (let existing in urlAnnotations) {
				// timestamp is the unique ID (it's a couple digits, very unique)
				if (existing.time === time) {
					return;
				}
			}

			// annotation doesn't exist yet, add it to localstorage
			urlAnnotations.push({
				'content': content,
				'time': time,
				'author': author
			});
			obj[url] = urlAnnotations;

			chrome.storage.sync.set({'youtubeAnnotations': obj}, () => {
				this.mirrorStorageToState();
			})
		})
	}

	/*
	save an annotation from server
	*/
	saveAnnotationFromServer(annotation) {
		this.saveAnnotation(annotation.content, annotation.time, annotation.url, annotation.author);
	}

	/*
	Saves an annotation from user
	*/
	save(content) {
		this.saveAnnotation(content, this.state.currentTime, window.location.href, this.state.userName);
	}

	/*
	share each annotation on the current URL with the chosen user
	*/
	share(username) {
		for (let annotation of this.state.annotations) {
			shareAnnotation(annotation, username, this.state.userName);
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
