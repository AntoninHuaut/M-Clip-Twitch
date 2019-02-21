var increment = 1;

function downloadMP4(slug) {
	let index = [slug + "/status", slug]
	let proms = index.map(data => fetch("https://clips.twitch.tv/api/v2/clips/" + data));

	Promise.all(proms)
		.then(ps => Promise.all(ps.map(p => p.json())))
		.then(js => {
			let urlClip = js[0].quality_options[0].source;
			let resClip = js[1];

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