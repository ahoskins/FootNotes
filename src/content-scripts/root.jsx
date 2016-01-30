import React from 'react';
import Annotater from './components/annotater.jsx';
import Playbar from './components/playbar.jsx';

const styles = {
	outer: {
		height: '80px',
		width: '100%',
		backgroundColor: '#d3d3d3',
		padding: '3px'
	}
};

export default class Root extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentTime: null,
			totalTime: null
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
				'annotation': annotation,
				'time': self.state.currentTime
			});

			obj[url] = UrlAnnotations;

			chrome.storage.sync.set({'youtubeAnnotations': obj}, function() {
				chrome.storage.sync.get('youtubeAnnotations', function(obj) {
					console.dir(obj);
				})
			});
		});
	}

	render() {
		return (
			<div style={styles.outer}>
				<Annotater save={this.save.bind(this)} />
				<Playbar currentTime={this.state.currentTime} totalTime={this.state.totalTime} />
			</div>
		)
	}
}
