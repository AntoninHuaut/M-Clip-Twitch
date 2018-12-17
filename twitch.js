var timer = setInterval(editTwitch, 100);
var lang, slug;

function editTwitch() {
	let url = window.location.href.replace(/(^\w+:|^)\/\//, '');
	let type = -1;

	if (url.toLowerCase().startsWith('clips.twitch.tv/'))
		type = 1;
	else if (url.toLowerCase().startsWith('www.twitch.tv/')) {
		if (url.toLowerCase().includes('/clip/'))
			type = 2;
		else {
			type = -1;
			removeMTButtons();
		}
	} else
		return;

	let get;

	if (type == 1)
		get = document.querySelector('div.tw-align-items-center.tw-flex.tw-justify-content-end.tw-mg-y-1.tw-relative.tw-z-above');

	else if (type == 2) {
		get = document.querySelector('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-nowrap.tw-justify-content-start.tw-md-flex-row');

		if (!hasShareButton(get))
			return;
	}

	if (get == null || !chrome.runtime)
		return;

	if (type == 1)
		clearInterval(timer);
	else if (hasMTButtons())
		return;

	if (type == 1 || type == 2)
		slug = /([A-Z])\w+/.exec(location.href)[0];

	chrome.runtime.sendMessage({
		greeting: "request-lang"
	});

	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.greeting == "get-lang") {
				lang = request.lang;

				for (let i = 0; i < 3; i++)
					addButton(type, i, lang, get);

				let tempTriggers = document.querySelectorAll('.downloadClip');
				tempTriggers.forEach(function (triggerValue) {
					slug = triggerValue.parentNode.getAttribute('id');
					triggerValue.addEventListener("click", function () {
						chrome.runtime.sendMessage({
							greeting: "startDownloadMP4",
							slug: slug
						});
					});
				});

				tempTriggers = document.querySelectorAll('.addQueueClip');
				tempTriggers.forEach(function (triggerValue) {
					slug = triggerValue.parentNode.getAttribute('id');
					triggerValue.addEventListener("click", function () {
						chrome.runtime.sendMessage({
							greeting: "addSlugQueue",
							slug: slug
						});
					});
				});

				tempTriggers = document.querySelectorAll('.manageQueueClip');
				tempTriggers.forEach(function (triggerValue) {
					slug = triggerValue.parentNode.getAttribute('id');
					triggerValue.addEventListener("click", function () {
						setTimeout(function () {
							window.open(chrome.runtime.getURL("/queue/queue.html"));
						}, 10); // Prevent freeze queue.html
					});
				});

				sendCheckSlug();
			} else if (request.greeting == "check-slug-duplicate" ||
				request.greeting == "queue-update") {
				updateButQueue(lang, request.isDuplicate);
			} else if (request.greeting == "tab-update")
				sendCheckSlug();
		});
}

function sendCheckSlug() {
	chrome.runtime.sendMessage({
		greeting: "checkSlugDuplicate",
		slug: slug
	});
}

function updateButQueue(lang, removeSlugQueue) {
	let infos;
	let element;

	if (removeSlugQueue) {
		infos = getLang(lang, "buttons.removeQueue");
		element = document.querySelector(".addQueueClip");

		if (!!element) {
			element.classList.remove('addQueueClip');
			element.classList.add('removeQueueClip');

			document.querySelector('.removeQueueClip').addEventListener("click", function () {
				chrome.runtime.sendMessage({
					greeting: "removeSlugQueue",
					slug: slug
				});
			});

			element.src = urlsButtons.removeQueue;

			element = element.parentNode.parentNode.parentNode.parentNode.children[1];
			element.innerHTML = infos;
		}
	} else {
		infos = getLang(lang, "buttons.addQueue");
		element = document.querySelector(".removeQueueClip");

		if (!!element) {
			element.classList.remove('removeQueueClip');
			element.classList.add('addQueueClip');
			element.src = urlsButtons.addQueue;

			element = element.parentNode.parentNode.parentNode.parentNode.children[1];
			element.innerHTML = infos;
		}
	}
}

function addButton(typeSite, typeButton, lang, get) {
	let infos = "";
	let button = '<a id="{SLUG}" href="#">' +
		'<img class="{TRIGGER}" src="{IMG_URL}" />' +
		'</a></figure>' +
		'</div>' +
		'<div class="tw-tooltip tw-tooltip--align-center tw-tooltip--down" data-a-target="tw-tooltip-label">{INFOS}</div>';
	let base = '<div class="tw-inline-block tw-mg-r-1">' +
		'<div class="social-button"><div class="tw-inline-flex tw-tooltip-wrapper">' +
		'<div class="social-button__icon tw-align-items-center tw-flex tw-justify-content-center">' +
		'<figure class="tw-svg">{BUTTON}' +
		'</div></div></div>';

	if (typeButton == 0) {
		infos = getLang(lang, "buttons.downloadClip");
		button = button.replace('{IMG_URL', urlsButtons.downloadClip).replace('{TRIGGER}', 'downloadClip');
	} else if (typeButton == 1) {
		infos = getLang(lang, "buttons.addQueue");
		button = button.replace('{IMG_URL', urlsButtons.addQueue).replace('{TRIGGER}', 'addQueueClip');
	} else if (typeButton == 2) {
		infos = getLang(lang, "buttons.manageQueue");
		button = button.replace('{IMG_URL', urlsButtons.manageQueue).replace('{TRIGGER}', 'manageQueueClip');
	}

	if (typeSite == 1 || typeSite == 2)
		button = button.replace('{SLUG}', slug);

	button = button.replace('{INFOS}', infos);
	base = base.replace('{BUTTON}', button);

	if (typeButton == 0)
		get.children[0].insertAdjacentHTML('afterend', '<div class="mTwitchButtons tw-align-items-center tw-flex tw-flex-row tw-flex-shrink-0 tw-full-height tw-pd-1 video-info-bar__action-container"></div>');

	get.querySelector('.mTwitchButtons').innerHTML += base;
}

var urlsButtons = {
	"downloadClip": "https://i.imgur.com/t1Le37l.png",
	"addQueue": "https://i.imgur.com/QUcfpvv.png",
	"removeQueue": "https://i.imgur.com/0HsqipO.png",
	"manageQueue": "https://i.imgur.com/aX9nHFZ.png"
}

function removeMTButtons() {
	if (!hasMTButtons())
		return;

	let el = document.querySelector('.mTwitchButtons');
	el.parentNode.removeChild(el);
}

function hasMTButtons() {
	return !!document.querySelector('.mTwitchButtons');
}

function hasShareButton(element) {
	return !!element && !!element.querySelector("button.tw-interactive.tw-button.tw-button--hollow");
}