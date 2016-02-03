chrome.commands.onCommand.addListener(function(command) {
	if (command === 'activate') {
		chrome.tabs.executeScript(null, {file: '/build/bundle.js'}, function() {
			// wait till the content script is running
			chrome.identity.getProfileUserInfo(function(info) {
				console.log(info.email);
				sendIdentityInfo(info.email);
			});
		});
	}
});

function sendIdentityInfo(email) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, {userName: email}, function(response) {
	    console.log(response.farewell);
	  });
	});
}
