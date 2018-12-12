var timer = setInterval(editTwitch, 100);

function editTwitch() {
	let url = window.location.href.replace(/(^\w+:|^)\/\//, '');
	let type = 0;
	
	if (url.toLowerCase().startsWith('clips.twitch.tv/'))
		type = 1;
	else if (url.toLowerCase().startsWith('www.twitch.tv/') && url.toLowerCase().includes('/clip/'))
		type = 2;

	if (type == 0)
		return;

	let get;

	if (type == 1)
		get = document.querySelector('div.tw-align-items-center.tw-flex.tw-justify-content-end.tw-mg-y-1.tw-relative.tw-z-above');

	else if (type == 2)
		get = document.querySelector('div.tw-flex.tw-flex-grow-0');

	if (get == null || !chrome.runtime)
		return;

	clearInterval(timer);

	slug = /([A-Z])\w+/.exec(location.href)[0];

	chrome.runtime.sendMessage({
		greeting: "request-lang"
	});

	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.greeting == "get-lang") {
				let downloadInfos = !request.lang ? "Télécharger" : "Download";
				let button = '<a href="#"><img class="mp4ClipTwitch" src="https://i.imgur.com/TPUbVyZ.png" /></a></figure></div><div class="tw-tooltip tw-tooltip--align-center tw-tooltip--down" data-a-target="tw-tooltip-label" role="tooltip" id="3647ab622ec3be445a328bb56b1ca35e">' + downloadInfos + '</div></div></div></div>';

				get.innerHTML = '<div class="tw-inline-block tw-mg-r-1"><div class="social-button"><div class="tw-inline-flex tw-tooltip-wrapper" aria-describedby="3647ab622ec3be445a328bb56b1ca35e"><div class="social-button__icon social-button__icon--facebook tw-align-items-center tw-flex tw-justify-content-center"><figure class="tw-svg">' + button + '</div></div></div></div>' + get.innerHTML;

				let trigger = document.querySelector('.mp4ClipTwitch');
				trigger.addEventListener("click", function () {
					chrome.runtime.sendMessage({
						greeting: "startDownloadMP4",
						slug: slug
					});
				});
			}
		});
}