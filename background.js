moment.locale(navigator.language || navigator.userLanguage);

var delay = null;
var lang;
var queueClips = [];

chrome.storage.local.get({
	language: "en"
}, function (items) {
	if (typeof (items.language) == "boolean") // CONVERSION ANCIENNE VERSION EXTENSION
		chrome.storage.local.set({
			language: "en"
		}, function () {
			lang = "en";
		});
	else
		lang = items.language;
});

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

		chrome.storage.local.get({
			redirection: false
		}, function (items) {
			if (items.redirection)
				downloadMP4(slug);
			else
				chrome.tabs.update(tab.id, {
					url: 'http://clips.maner.fr/?clips=' + slug
				});
		});
	});
});

function isInQueue(slug) {
	for (let i = 0; i < queueClips.length; i++)
		if (queueClips[i].slug == slug)
			return true;

	return false;
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.greeting == "startDownloadMP4")
			downloadMP4(request.slug);

		// queue.js
		else if (request.greeting == "queue-delete-clip") {
			sendToAllTabs({
				greeting: "queue-update",
				slugEl: request.slug,
				isDuplicate: isInQueue(request.slug)
			});
		}
		
		// twitch.js
		else if (request.greeting == "checkSlugDuplicate") {
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
				let resClip;

				$.when($.ajax({
					type: "GET",
					url: "https://clips.twitch.tv/api/v2/clips/" + request.slug,
					cache: false,
					async: true,
					success: function (res) {
						resClip = res;
					}
				})).then(function () {
					queueClips[queueClips.length] = {
						"slug": request.slug,
						"url": resClip.preview_image,
						"title": resClip.title
					};

					sendToAllTabs({
						greeting: "queue-update",
						slugEl: request.slug,
						isDuplicate: true
					});
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
				for (let i = 0; i < queueClips.length; i++)
					if (queueClips[i].slug == request.slug) {
						queueClips.splice(queueClips.indexOf(queueClips[i]), 1);
						break;
					}

				sendToAllTabs({
					greeting: "queue-update",
					slugEl: request.slug,
					isDuplicate: false
				});
			}
		} else if (request.greeting == "request-lang") {
			sendToAllTabs({
				greeting: "get-lang",
				lang: lang
			});
		}
	});

function sendToAllTabs(json) {
	chrome.tabs.query({}, function (tabs) {
		for (let i = 0; i < tabs.length; ++i)
			chrome.tabs.sendMessage(tabs[i].id, json);
	});
}

var increment = 1;

function downloadMP4(slug) {
	let urlClip;
	let resClip;
	increment++;

	$.when(
		$.ajax({
			type: "GET",
			url: "https://clips.twitch.tv/api/v2/clips/" + slug + "/status",
			cache: false,
			async: true,
			success: function (res) {
				urlClip = res.quality_options[0].source;
			}
		}),
		$.ajax({
			type: "GET",
			url: "https://clips.twitch.tv/api/v2/clips/" + slug,
			cache: false,
			async: true,
			success: function (res) {
				resClip = res;
			}
		})
	).then(function () {
		chrome.storage.local.get({
			formatMP4: "{STREAMER}.{GAME} {TITLE}",
			formatDate: "DD-MM-YYYY",
			formatTempsVOD: "-NA-"
		}, function (items) {
			let time = items.formatTempsVOD;

			if (!!resClip.vod_url) {
				let tParam = getParameterByName('t', resClip.vod_url);

				if (tParam.includes('h')) {
					time = tParam.split('h')[0];
					tParam = tParam.split('h')[1];
					time += moment(tParam, "mm[m]ss[s]").format("mmss");
				} else if (tParam.includes('m'))
					time = moment(tParam, "mm[m]ss[s]").format("[00]mmss");
				else
					time = moment(tParam, "ss[s]").format("[0000]ss");
			}

			let replaces = [resClip.curator_display_name, moment(new Date(resClip.created_at)).format(items.formatDate),
				resClip.duration, resClip.game, increment, resClip.slug, resClip.broadcaster_display_name, time, resClip.title, resClip.views
			];

			let fileName = items.formatMP4.rep(replaces).replace(/[\/\\\*\?\<\>\:\"\|\~]/g, '_'); // Deleting characters that prevent the file from being saved.

			chrome.downloads.download({
				url: urlClip,
				filename: fileName + ".mp4"
			});
		});
	});
}

String.prototype.rep = function (replaces) {
	let str = this.toString();

	for (let i = 0; i < getLang(lang, "formatFile").length; i++)
		str = str.replace(getLang(lang, "formatFile")[i], replaces[i]);

	return str;
};

chrome.runtime.onInstalled.addListener(details => {
	if (compareVersion(details.previousVersion, chrome.runtime.getManifest().version))
		return;

	if (details.reason == "update") {
		chrome.tabs.create({
			url: "http://clips.maner.fr/update.html"
		});
	}
});

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function compareVersion(previous, actual) {
	if (!previous)
		return true;

	previous = previous.split('.');
	actual = actual.split('.');

	previous = previous[0] + '.' + previous[1];
	actual = actual[0] + '.' + actual[1];

	return previous == actual;
}