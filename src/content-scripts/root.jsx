import React from 'react';
import Annotater from './components/annotater.jsx';
import Playbar from './components/playbar.jsx';
import Share from './components/share.jsx';

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

	// inject code into webpage and get stream of events back updating currentTime
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

	// ADD ANNOTATION TO LOCALSTORAGE THEN DELETE FROM SERVER
	// if already contain that exact timestamp that means it was send twice, so don't add again!
	insertAndDeleteAnnotationFromServer(annotation) {
		console.dir(annotation);
		// INSERT
		//
		var self = this;
		chrome.storage.sync.get('youtubeAnnotations', function(obj) {
			if (Object.keys(obj).length === 0) obj['youtubeAnnotations'] = {};
			obj = obj['youtubeAnnotations'];

			const UrlAnnotations = obj[annotation.url] || [];

			// DELETE (keep the server clean)
			//
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					console.log(xhr.responseText);
				}
			}
			xhr.open("DELETE", "https://youtube-annotate-backend.herokuapp.com/api/remove/" + annotation._id, true);
			xhr.send(null);

			// check if already contains annotation
			for (let existing of self.state.annotations) {
				if (existing.time === annotation.time) {
					return;
				}
			}

			// annotation doesn't exist yet, add it to localstorage
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

	save(annotation) {
		console.log('saving');
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

	// SHARE EACH STATE ANNOTATION (ANNOTATION AND TIME) TO THE TEXT-INPUT GIVEN USER
	share(username) {
		// for each in localstorage, do a create
		for (let annotation of this.state.annotations) {
			// {time: Number, content: String}
			// need: {}
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					console.log(xhr.responseText);
				}
			}
			xhr.open("POST", "https://youtube-annotate-backend.herokuapp.com/api/create/", true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.send('time=' + annotation.time + '&target=' + username + '&url=' + window.location.href + '&content=' + annotation.content);
		}
	}

	seekTo(time) {
		console.log('seeking');
		console.log(time);
		// inject some code
		const injectedCode = '(' + function(time) {
			document.getElementById('movie_player').seekTo(JSON.stringify(time), true);
		} + ')(' + JSON.stringify(time) + ');';

		const script = document.createElement('script');
		script.textContent = injectedCode;
		(document.head || document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);
	}

	user(username) {
		this.setState({userName: username});

		this.mirrorStorageToState();

		// GET NEW FROM SERVER THEN DELETE & SET STATE BASED ON CURRENT CONTENTS OF LOCALSTORAGE
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				for (let annotation of JSON.parse(xhr.responseText)) {
					self.insertAndDeleteAnnotationFromServer(annotation);
				}
			}
		}
		xhr.open("GET", "https://youtube-annotate-backend.herokuapp.com/api/match/" + username, true);
		xhr.send(null);
	}

	/*
	What do we want to happen?
	- on mount, update new annotations from server and delete (done)
		- since deleting, means can't have dups in localstorage (done)
	- keep annotation state in sync with current URL annotations
		- video can change without onmount happening, so need to update state every time this happens
		- requirement: state reflects currently playing videos annotations
		- updated when you SAVE and after getting from server (ONMOUNT) (done)
		- and updated when NEW VIDEO STARTS (TODO)
	- share button shares all annotations for current page with peer (done)
	- if you press the share button again with same person thats a way to get dups (done)
		- receiver checks if that exact timestamp is in localstorage yet then can't get dups (done)
	*/

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
