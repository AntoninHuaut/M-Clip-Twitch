var timer = setInterval(editTwitch, 100);
var lang, urlLoc, slugAr = [];

function editTwitch() {
	let url = window.location.href.replace(/(^\w+:|^)\/\//, '');
	let typeSite = -1;

	if (url.toLowerCase().startsWith('clips.twitch.tv/')) // https://clips.twitch.tv/<clip>
		typeSite = 1;
	else if (url.toLowerCase().startsWith('www.twitch.tv/')) {
		if (url.toLowerCase().includes('/clip/')) // https://www.twitch.tv/<user>/clip/<clip>
			typeSite = 2;
		else if (url.toLowerCase().includes('/clips')) // https://www.twitch.tv/<user>/clips
			typeSite = 3;
		else
			typeSite = -1;
	} else
		return;

	let divButtons;

	if (typeSite == 1)
		divButtons = document.querySelector('div.tw-align-items-center.tw-flex.tw-justify-content-end.tw-mg-y-1.tw-relative.tw-z-above');

	else if (typeSite == 2) {
		divButtons = document.querySelector('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-nowrap.tw-justify-content-start.tw-md-flex-row');

		if (!hasShareButton(divButtons))
			return;

	} else if (typeSite == 3)
		divButtons = document.querySelectorAll('div.preview-card');

	if (divButtons == null || !chrome.runtime)
		return;

	// RESET 'CHANGE' PAGE
	if (!urlLoc)
		urlLoc = window.location.href;
	else if (urlLoc != window.location.href) {
		lang = null;
		urlLoc = window.location.href;
		slugAr = [];
	}

	let indexStartSlug = 0;

	if (typeSite == 1)
		clearInterval(timer);

	if (typeSite == 1 || typeSite == 2) {
		if (hasMTButtons())
			return;

		slugAr[0] = getSlugURL(location.href);
	} else if (typeSite == 3) {
		if (divButtons.length == 0 || (divButtons.length == slugAr.length && getMTButtons() == slugAr.length))
			return;

		indexStartSlug = getMTButtons();

		for (let i = indexStartSlug; i < divButtons.length; i++)
			slugAr[i] = getSlugURL(divButtons[i].querySelector('a.tw-interactive.tw-link').href);
	}

	if (!lang) {
		chrome.runtime.sendMessage({
			greeting: "request-lang"
		});

		chrome.runtime.onMessage.addListener(
			function (request, sender, sendResponse) {
				if (request.greeting == "get-lang") {
					lang = request.lang;
					editTwitch();
				} else if (request.greeting == "check-slug-duplicate" || request.greeting == "queue-update")
					updateButQueue(lang, request.slugEl, request.isDuplicate);
			});

	} else
		initButtons(typeSite, lang, divButtons, indexStartSlug);
}

function initButtons(typeSite, lang, divButtons, indexStartSlug) {
	for (let i = indexStartSlug; i < slugAr.length; i++) {
		let slugEl = slugAr[i];

		for (let i = 0; i < 3; i++)
			addButton(typeSite, slugEl, i, lang, divButtons);

		document.querySelector('.downloadClip.' + slugEl).addEventListener("click", function () {
			chrome.runtime.sendMessage({
				greeting: "startDownloadMP4",
				slug: slugEl
			});
		});

		document.querySelector('.addQueueClip.' + slugEl).addEventListener("click", function () {
			chrome.runtime.sendMessage({
				greeting: "addSlugQueue",
				slug: slugEl
			});
		});

		document.querySelector('.manageQueueClip.' + slugEl).addEventListener("click", function () {
			setTimeout(function () {
				window.open(chrome.runtime.getURL("/queue/queue.html"));
			}, 10); // Prevent freeze queue.html
		});
	}

	sendCheckSlug();
}

function sendCheckSlug() {
	slugAr.forEach(slugEl => {
		chrome.runtime.sendMessage({
			greeting: "checkSlugDuplicate",
			slug: slugEl
		});
	});
}

function updateButQueue(lang, slugEl, removeSlugQueue) {
	if (removeSlugQueue) {
		let infos = getLang(lang, "buttons.removeQueue");
		let element = document.querySelector(".addQueueClip." + slugEl);

		if (!!element) {
			element.classList.remove('addQueueClip');
			element.classList.add('removeQueueClip');

			document.querySelector('.removeQueueClip.' + slugEl).addEventListener("click", function () {
				chrome.runtime.sendMessage({
					greeting: "removeSlugQueue",
					slug: slugEl
				});
			});

			element.src = urlsButtons.removeQueue;

			element = element.parentNode.parentNode.parentNode.parentNode.children[1];
			element.innerHTML = infos;
		}
	} else {
		let infos = getLang(lang, "buttons.addQueue");
		let element = document.querySelector(".removeQueueClip." + slugEl);

		if (!!element) {
			element.classList.remove('removeQueueClip');
			element.classList.add('addQueueClip');
			element.src = urlsButtons.addQueue;

			element = element.parentNode.parentNode.parentNode.parentNode.children[1];
			element.innerHTML = infos;
		}
	}
}

function addButton(typeSite, slugEl, typeButton, lang, get) {
	let infos = "";
	let trigger = "";

	let button = '<a href="#">' +
		'<img class="{TRIGGER}" {IMG_WIDTH} src="{IMG_URL}" />' +
		'</a></figure>' +
		'</div>' +
		'<div class="tw-tooltip tw-tooltip--align-center tw-tooltip--down" data-a-target="tw-tooltip-label">{INFOS}</div>';
	let base = '<div class="tw-inline-block" style="{EXTRA_SD_STYLE}">' +
		'<div class="social-button"><div class="tw-inline-flex tw-tooltip-wrapper">' +
		'<div class="social-button__icon tw-align-items-center tw-flex tw-justify-content-center">' +
		'<figure class="tw-svg">{BUTTON}' +
		'</div></div></div>';

	if (typeButton == 0) {
		infos = getLang(lang, "buttons.downloadClip");
		trigger = "downloadClip";
		button = button.replace('{IMG_URL', urlsButtons.downloadClip);
	} else if (typeButton == 1) {
		infos = getLang(lang, "buttons.addQueue");
		trigger = "addQueueClip";
		button = button.replace('{IMG_URL', urlsButtons.addQueue);
	} else if (typeButton == 2) {
		infos = getLang(lang, "buttons.manageQueue");
		trigger = "manageQueueClip";
		button = button.replace('{IMG_URL', urlsButtons.manageQueue);
	}

	button = button.replace('{TRIGGER}', trigger + " " + slugEl);
	button = button.replace('{INFOS}', infos);

	let insertIndex, extraMDClass = "",
		extraMDStyle = "";

	if (typeSite == 1 || typeSite == 2) {
		button = button.replace('{IMG_WIDTH}', '');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-right: 10px;');
		extraMDClass = "tw-pd-1";

		insertIndex = 0;
	} else if (typeSite == 3) {
		button = button.replace('{IMG_WIDTH}', 'width="90%"');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-right: 5px;');
		extraMDStyle = "margin-top: 0.5vh;";

		let index = slugAr.indexOf(slugEl);
		get = get[index].querySelector("div.preview-card__titles-wrapper.tw-flex-grow-1.tw-flex-shrink-1.tw-full-width").querySelector("div");

		insertIndex = get.children.length - 1;
	}

	base = base.replace('{BUTTON}', button);

	if (typeButton == 0)
		get.children[insertIndex].insertAdjacentHTML('afterend', '<div style="' + extraMDStyle + '" class="mTwitchButtons tw-align-items-center tw-flex tw-flex-row ' + extraMDClass + '"></div>');

	get.querySelector('.mTwitchButtons').innerHTML += base;
}

var urlsButtons = {
	"downloadClip": "https://i.imgur.com/t1Le37l.png",
	"addQueue": "https://i.imgur.com/QUcfpvv.png",
	"removeQueue": "https://i.imgur.com/0HsqipO.png",
	"manageQueue": "https://i.imgur.com/aX9nHFZ.png"
}

function getSlugURL(url) {
	return /([A-Z])\w+/.exec(url)[0];
}

function hasMTButtons() {
	return getMTButtons() > 0;
}

function getMTButtons() {
	return document.querySelectorAll('.mTwitchButtons').length
}

function hasShareButton(element) {
	return !!element && !!element.querySelector("button.tw-interactive.tw-button.tw-button--hollow");
}