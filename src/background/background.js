chrome.commands.onCommand.addListener(function(command) {
	if (command === 'activate') {
		chrome.tabs.executeScript(null, {file: '/build/bundle.js'});
	}
});
