chrome.commands.onCommand.addListener(function(command) {
	if (command === 'activate') {
		executeScript()
		.then(getProfileUserInfo)
		.then(function(info) { // must keep 'info' in closure, don't think there's a more elegant way?
			queryTabs()
			.then(function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {userName: info.email});
			})
		})
	}
});

function executeScript() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.executeScript(null, {file: '/build/bundle.js'}, resolve)
	})
}

function getProfileUserInfo() {
	return new Promise(function(resolve, reject) {
		chrome.identity.getProfileUserInfo(resolve)
	})
}

function queryTabs(info) {
	return new Promise(function(resolve, reject) {
		chrome.tabs.query({active: true, currentWindow: true}, resolve)
	})
}
