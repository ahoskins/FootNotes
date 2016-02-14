chrome.commands.onCommand.addListener(function(command) {
	queryTabs()
	.then(function(tabs) {
		if (tabs[0].url.indexOf('www.youtube.com/watch?') > -1 && command === 'activate') {
			showExtension();
		} else {
			alert('Must be watching a video on www.youtube.com to activate FootNotes.');
		}
	})
});

function showExtension() {
	executeScript()
	.then(getProfileUserInfo)
	.then(function(info) { // keep info in the closure
		queryTabs()
		.then(function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				'userName': info.email.slice(0, info.email.indexOf('@'))
			});
		})
	})
}

function executeScript() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.executeScript(null, {file: '/build/bundle.client.js'}, resolve)
	})
}

function queryTabs(info) {
	return new Promise(function(resolve, reject) {
		chrome.tabs.query({active: true, currentWindow: true}, resolve)
	})
}

function getProfileUserInfo() {
	return new Promise(function(resolve, reject) {
		chrome.identity.getProfileUserInfo(resolve)
	})
}
