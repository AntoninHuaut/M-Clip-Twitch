var increment = 1;

function downloadQueue() {
	chrome.storage.local.get({
		removeDownloadClip: false
	}, function (items) {
		let removeDownloadClip = items.removeDownloadClip;
		let removeClips = [];

		queueClips.forEach(clipInfo => {
			downloadMP4(clipInfo.slug)

			if (removeDownloadClip)
				removeClips.push(clipInfo.slug);
		});

		if (removeDownloadClip) {
			removeClips.forEach(slug => removeSlugInfo(slug));
			saveQueueClips();
		}
	});
}

function downloadMP4(slug) {
	fetchClips(slug)
		.then(js => {
			const data = js.data[0];
			const urlClip = data.thumbnail_url.split('-preview-')[0] + ".mp4";

			chrome.storage.local.get({
				formatMP4: "{STREAMER}.{GAME} {TITLE}",
				formatDate: "DD-MM-YYYY"
			}, function (items) {
				const replaces = [data.creator_name, moment(new Date(data.created_at)).format(items.formatDate),
					data.game_id, increment, data.id, data.broadcaster_name, data.title, data.view_count
				];

				let fileName = items.formatMP4.rep(replaces).replace(/[\/\\\*\?\<\>\:\"\|\~]/g, '_'); // Deleting characters that prevent the file from being saved.
				if (!fileName) fileName = data.title;

				chrome.downloads.download({
					url: urlClip,
					filename: fileName + ".mp4"
				});

				increment++;
			});
		});
}

String.prototype.rep = function (replaces) {
	let str = this.toString();

	for (let i = 0; i < getLang(lang, "formatFile").length; i++)
		str = str.replace(getLang(lang, "formatFile")[i], replaces[i]);

	return str;
};

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}