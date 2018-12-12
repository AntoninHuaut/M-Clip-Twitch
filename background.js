moment.locale(navigator.language || navigator.userLanguage);

var delay = null;
var lang = true; // True EN - False FR

chrome.storage.local.get({
	language: false
}, function (items) {
	lang = items.language;
});

chrome.browserAction.onClicked.addListener(function (cTab) {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		let tab = tabs[0];
		let url = tab.url;
		let clipsUrl = !url.startsWith("https://clips.twitch.tv/");

		if (delay != null)
			clearTimeout(delay);

		delay = setTimeout(function () {
			chrome.browserAction.setIcon({
				path: "images/icon.png"
			});
		}, 1250);

		if (clipsUrl) {
			chrome.browserAction.setIcon({
				path: "images/icon_off.png"
			});
			return;
		}

		chrome.browserAction.setIcon({
			path: "images/icon_valid.png"
		});

		let slug = /([A-Z])\w+/.exec(url)[0];

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

chrome.commands.onCommand.addListener(function (command) {
	if (command === "download-clip") {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			let url = tabs[0].url;

			if (!url.startsWith("https://clips.twitch.tv/"))
				return;

			let slug = /([A-Z])\w+/.exec(url)[0];
			downloadMP4(slug);
		});
	}
});

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.greeting == "startDownloadMP4")
			downloadMP4(request.slug);
		else if (request.greeting == "request-lang") {
			chrome.tabs.sendMessage(sender.tab.id, {
				greeting: "get-lang",
				lang: lang
			}, function (response) {});
		}
	});

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
			formatDate: "DD-MM-YYYY"
		}, function (items) {
			let time = "-NA-";

			if (!!resClip.vod_url) {
				let tParam = getParameterByName('t', resClip.vod_url);

				if (tParam.includes('h'))
					time = moment(tParam, "hh[h]mm[m]ss[s]").format("hhmmss");
				else if (tParam.includes('m'))
					time = moment(tParam, "mm[m]ss[s]").format("[00]mmss");
				else
					time = moment(tParam, "ss[s]").format("[0000]ss");
			}

			let replaces = [resClip.curator_display_name, moment(new Date(resClip.created_at)).format(items.formatDate),
				resClip.duration, resClip.game, increment, resClip.slug, resClip.broadcaster_display_name, time, resClip.title, resClip.views
			];

			let fileName = items.formatMP4.rep(replaces).replace(/[\/\*\~\\\?]/g, '_'); // Deleting characters that prevent the file from being saved 

			chrome.downloads.download({
				url: urlClip,
				filename: fileName + ".mp4"
			});
		});
	});
}

String.prototype.rep = function (replaces) {
	let str = this.toString();

	for (let i = 0; i < fr.formatFile.length; i++)
		str = str.replace(fr.formatFile[i], replaces[i]);

	for (let i = 0; i < en.formatFile.length; i++)
		str = str.replace(en.formatFile[i], replaces[i]);

	return str;
};

chrome.runtime.onInstalled.addListener(details => {
	if (details.reason == "update" || details.reason == "install")
		chrome.tabs.create({
			url: "http://clips.maner.fr/update_" + (!lang ? "fr" : "en") + ".html"
		});
});

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}