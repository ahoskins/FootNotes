import React from 'react';
import Annotater from './components/annotater.jsx';
import Playbar from './components/playbar.jsx';
import Share from './components/share.jsx';
import {deleteAnnotationById, shareAnnotation, getMatchingAnnotations} from './network.js';

const styles = {
	outer: {
		height: '80px',
		width: '100%',
		backgroundColor: '#fefefe',
		border: '1px solid #222222',
		padding: '3px'
	},
	right: {
		float: 'right'
	}
};

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
		// will be stringified
		const injectedCode = '(' + function() {

			// http://stackoverflow.com/questions/13290456/how-to-call-functions-in-the-original-pagetab-in-chrome-extensions
			// http://stackoverflow.com/questions/9515704/building-a-chrome-extension-inject-code-in-a-page-using-a-content-script/9517879#9517879

			// event 1 second update time, and attach it to custom event, then dispatch event
			setInterval(function() {
				const current = document.getElementById('movie_player').getCurrentTime();
				const total = document.getElementById('movie_player').getDuration();
				const customEvent = new CustomEvent('youtube', {'detail': {'current': current, 'total': total}});
				document.dispatchEvent(customEvent);
			}, 1000);

		} + ')();';

		// inject
		const script = document.createElement('script');
		script.textContent = injectedCode;
		(document.head || document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);

		// listen for this event and update state
		var self = this;
		document.addEventListener('youtube', function(e) {
			self.setState({
				currentTime: e.detail.current,
				totalTime: e.detail.total
			});
		});
	}

	/*
	Set component state based on annotations at current url
	(TODO, call this when playing video changes)
	*/
	mirrorStorageToState() {
		let self = this;
		chrome.storage.sync.get('youtubeAnnotations', function(obj) {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			// mirror current annotations for url if they exist
			if (obj[window.location.href] !== undefined) {
				self.setState({annotations: obj[window.location.href]});
			}
		});
	}

	/*
	save an annotation from server into localstorage
	if it already exists (already has been shared) don't add again
	*/
	saveAnnotationFromServer(annotation) {
		console.dir(annotation);

		var self = this;
		chrome.storage.sync.get('youtubeAnnotations', function(obj) {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			// check if already contains annotation
			for (let existing of self.state.annotations) {
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

			chrome.storage.sync.set({'youtubeAnnotations': obj}, function() {
				self.mirrorStorageToState();
			})
		})
	}

	/*
	Saves a annotation from locally from (not from a friend)
	*/
	save(annotation) {
		const self = this;
		// chrome.storage.sync.clear();

		// save annotation along with currentTime in localstorage
		chrome.storage.sync.get('youtubeAnnotations', function(obj) {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			const url = window.location.href;
			const UrlAnnotations = obj[url] || [];
			UrlAnnotations.push({
				'content': annotation,
				'time': self.state.currentTime
			});
			obj[url] = UrlAnnotations;

			chrome.storage.sync.set({'youtubeAnnotations': obj}, function() {
				self.mirrorStorageToState();
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
		// inject some code
		const injectedCode = '(' + function(time) {
			document.getElementById('movie_player').seekTo(JSON.stringify(time), true);
		} + ')(' + JSON.stringify(time) + ');';

		const script = document.createElement('script');
		script.textContent = injectedCode;
		(document.head || document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);
	}

	/*
	when they "login" get the fresh annotations for this user
	*/
	user(username) {
		console.log('user');
		this.setState({userName: username});

		// might already have some in localstorage and none on the network
		// (this gets called again if there are new annotations on the network)
		this.mirrorStorageToState();

		var self = this;
		getMatchingAnnotations(username).then(function(response) {
			for (let annotation of response) {
				self.saveAnnotationFromServer(annotation);
				deleteAnnotationById(annotation._id);
			}
		})
	}

	render() {
		return (
			<div style={styles.outer}>
				<Annotater save={this.save.bind(this)} />
				<Share style={styles.right} share={this.share.bind(this)} user={this.user.bind(this)} />
				{this.state.userName};
				<Playbar
					currentTime={this.state.currentTime}
					totalTime={this.state.totalTime}
					annotations={this.state.annotations}
					seekTo={this.seekTo} />
			</div>
		)
	}
}
