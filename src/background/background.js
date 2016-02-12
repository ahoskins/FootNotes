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
		getToken()
		.then(getContacts)
		.then(function(contacts) { // keep contacts in the closure
			let processedContacts = processContacts(contacts);
			queryTabs()
			.then(function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					'userName': info.email.slice(0, info.email.indexOf('@')),
					'contacts': processedContacts
				});
			})
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

function getToken() {
  return new Promise(function(resolve, reject) {
    chrome.identity.getAuthToken({'interactive': true}, resolve);
  });
}

function getContacts(token) {
  return new Promise(function(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.google.com/m8/feeds/contacts/default/full', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
		xhr.setRequestHeader('GData-Version', 3.0);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    xhr.onload = resolve;
  });
}

function getProfileUserInfo() {
	return new Promise(function(resolve, reject) {
		chrome.identity.getProfileUserInfo(resolve)
	})
}

function processContacts(raw) {
  let children = (new DOMParser()).parseFromString(raw.currentTarget.response,"text/xml").documentElement.children;
  let emails = [];
  for (let i = 0; i < children.length; i++) {
    if (children[i].nodeName !== 'entry') continue;
    let grandchildren = children[i].children;
    for (let j = 0; j < grandchildren.length; j++) {
      if (grandchildren[j].nodeName !== 'gd:email') continue;
      emails.push(grandchildren[j].attributes.getNamedItem('address').nodeValue);
    }
  }

  return emails;
}
