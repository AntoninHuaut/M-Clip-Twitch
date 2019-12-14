moment.locale(navigator.language || navigator.userLanguage);

var delay = null;
var lang;
var queueClips = [];

// Load storage
chrome.storage.local.get({
	language: "en",
	queueClips: []
}, function (items) {
	if (typeof (items.language) == "boolean") // CONVERSION ANCIENNE VERSION EXTENSION
		chrome.storage.local.set({
			language: "en"
		}, function () {
			lang = "en";
		});
	else
		lang = items.language;

	queueClips = items.queueClips;
});

function saveQueueClips() {
	chrome.storage.local.set({
		queueClips: queueClips
	});
}

// Click on the extension icon
chrome.browserAction.onClicked.addListener(function (cTab) {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		let tab = tabs[0];
		let url = tab.url.replace(/(^\w+:|^)\/\//, '');
		let clipsUrl = !(url.toLowerCase().startsWith('clips.twitch.tv/') || (url.toLowerCase().startsWith('www.twitch.tv/') && url.toLowerCase().includes('/clip/')));

		if (delay != null)
			clearTimeout(delay);

		delay = setTimeout(function () {
			chrome.browserAction.setIcon({
				path: "images/icon.png"
			});
		}, 1250);

		let slug = /([A-Z])\w+/.exec(url);

		if (clipsUrl || !slug) {
			chrome.browserAction.setIcon({
				path: "images/icon_off.png"
			});
			return;
		}

		slug = slug[0];

		chrome.browserAction.setIcon({
			path: "images/icon_valid.png"
		});

		downloadMP4(slug);
	});
});

// Content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.greeting == "startDownloadMP4")
		downloadMP4(request.slug);

	// twitch.js
	else if (request.greeting == "downloadQueueClip") {
		downloadQueue();
	} else if (request.greeting == "checkSlugDuplicate") {
		sendToAllTabs({
			greeting: "check-slug-duplicate",
			slugEl: request.slug,
			isDuplicate: isInQueue(request.slug)
		});
	} else if (request.greeting == "addSlugQueue") {
		if (isInQueue(request.slug)) {
			sendToAllTabs({
				greeting: "check-slug-duplicate",
				slugEl: request.slug,
				isDuplicate: true
			});
		} else {
			fetchClips(request.slug)
				.then(js => {
					const data = js.data[0];
					queueClips[queueClips.length] = {
						"slug": data.id,
						"url": data.thumbnail_url,
						"mp4": data.thumbnail_url.split('-preview-')[0] + ".mp4",
						"title": data.title
					};

					sendToAllTabs({
						greeting: "queue-update",
						type: "add",
						slugEl: data.id,
						isDuplicate: true
					});

					saveQueueClips();
				});
		}
	} else if (request.greeting == "removeSlugQueue") {
		if (!isInQueue(request.slug)) {
			sendToAllTabs({
				greeting: "check-slug-duplicate",
				slugEl: request.slug,
				isDuplicate: false
			});
		} else {
			removeSlugInfo(request.slug);
			saveQueueClips();
		}
	} else if (request.greeting == "request-lang") {
		sendToAllTabs({
			greeting: "get-lang",
			lang: lang
		});
	}
});

async function fetchClips(slug) {
	const headers = new Headers();
	headers.append("Client-ID", "klilujwcw6vkdkyyukc4kmptfevkil");

	return fetch(`https://api.twitch.tv/helix/clips?id=${slug}`, {
		method: 'GET',
		headers: headers
	}).then(res => res.json());
}

function removeSlugInfo(slugValue) {
	for (let i = 0; i < queueClips.length; i++)
		if (queueClips[i].slug == slugValue) {
			queueClips.splice(queueClips.indexOf(queueClips[i]), 1);
			break;
		}

	sendToAllTabs({
		greeting: "queue-update",
		type: "remove",
		slugEl: slugValue,
		isDuplicate: false
	});
}

function isInQueue(slug) {
	for (let i = 0; i < queueClips.length; i++)
		if (queueClips[i].slug == slug)
			return true;

	return false;
}

function sendToAllTabs(json) {
	chrome.tabs.query({}, function (tabs) {
		for (let i = 0; i < tabs.length; ++i)
			chrome.tabs.sendMessage(tabs[i].id, json);
	});
}

// Update
chrome.runtime.onInstalled.addListener(details => {
	if (compareVersion(details.previousVersion, chrome.runtime.getManifest().version))
		return;

	if (details.reason == "update") {
		chrome.tabs.create({
			url: "http://clips.maner.fr/update.html"
		});
	}
});

function compareVersion(previous, actual) {
	if (!previous)
		return true;

	previous = previous.split('.');
	actual = actual.split('.');

	previous = previous[0] + '.' + previous[1];
	actual = actual[0] + '.' + actual[1];

	return previous == actual;
}