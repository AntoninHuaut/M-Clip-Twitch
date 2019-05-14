var SiteEnum = {
	NONE: -1,
	CLIPS_TW: 1,
	TW_U_CLIP: 2,
	TW_U_CLIP_LIST: 3,
	TW_U_CLIP_LIST_MENU: 4,
	TW_U_MANAGER_CLIPS: 5
};

var BouttonsEnum = {
	DOWNLOAD_CLIP: 0,
	ADD_QUEUE: 1,
	MANAGE_QUEUE: 2,
	ADD_ALL_QUEUE: 3,
	REMOVE_ALL_QUEUE: 4,
	DOWNLOAD_QUEUE_CLIP: 5
};

var urlsButtons = {
	"downloadQueueClip": "https://i.imgur.com/bQiadMo.png",
	"downloadClip": "https://i.imgur.com/t1Le37l.png",
	"addQueue": "https://i.imgur.com/QUcfpvv.png",
	"removeQueue": "https://i.imgur.com/0HsqipO.png",
	"manageQueue": "https://i.imgur.com/aX9nHFZ.png"
};

var timer = setInterval(editTwitch, 100);
var lang, urlLoc, slugAr = [];

function editTwitch() {
	let url = window.location.href.replace(/(^\w+:|^)\/\//, '');
	let typeSite = SiteEnum.NONE;

	// DETECT FAKE CHANGE PAGE TWITCH
	if (!urlLoc)
		urlLoc = window.location.href;
	else if (urlLoc != window.location.href) {
		lang = null;
		urlLoc = window.location.href;
		slugAr = [];
		removeButtonsClipsList();
	}

	if (url.toLowerCase().startsWith('clips.twitch.tv/')) // https://clips.twitch.tv/<slug>
		typeSite = SiteEnum.CLIPS_TW;
	else if (url.toLowerCase().startsWith('www.twitch.tv/')) {
		if (url.toLowerCase().includes('/clip/')) // https://www.twitch.tv/<user>/clip/<slug>
			typeSite = SiteEnum.TW_U_CLIP;
		else if (url.toLowerCase().includes('/manager/clips')) // https://www.twitch.tv/<user>/manager/clips
			typeSite = SiteEnum.TW_U_MANAGER_CLIPS;
		else if (url.toLowerCase().includes('/clips')) // https://www.twitch.tv/<user>/clips
			typeSite = SiteEnum.TW_U_CLIP_LIST;
	}

	if (typeSite == SiteEnum.NONE)
		return;

	let divButtons;

	if (typeSite == SiteEnum.CLIPS_TW)
		divButtons = document.querySelector('div.tw-align-items-center.tw-flex.tw-justify-content-end.tw-mg-y-1.tw-relative.tw-z-above');

	else if (typeSite == SiteEnum.TW_U_CLIP) {
		divButtons = document.querySelector('div.tw-align-items-center.tw-flex.tw-flex-column.tw-flex-nowrap.tw-justify-content-start.tw-md-flex-row');

		if (!hasShareButton(divButtons))
			return;

	} else if (typeSite == SiteEnum.TW_U_CLIP_LIST)
		divButtons = document.querySelectorAll('div.preview-card');
	else if (typeSite == SiteEnum.TW_U_MANAGER_CLIPS)
		divButtons = document.querySelector('div.tw-align-items-center.tw-border-b.tw-c-background-alt.tw-flex.tw-justify-content-between.tw-pd-1');

	if (divButtons == null || !chrome.runtime)
		return;

	let indexStartSlug = 0;

	if (typeSite == SiteEnum.CLIPS_TW)
		clearInterval(timer);

	if ([SiteEnum.CLIPS_TW, SiteEnum.TW_U_CLIP, SiteEnum.TW_U_MANAGER_CLIPS].includes(typeSite)) {
		if (hasMTButtons())
			return;

		if ([SiteEnum.CLIPS_TW, SiteEnum.TW_U_CLIP].includes(typeSite))
			slugAr[0] = getSlugURL(location.href);
		else if (typeSite == SiteEnum.TW_U_MANAGER_CLIPS)
			slugAr[0] = getSlugURL(document.querySelector('.tw-aspect.tw-aspect--align-top iframe').src);
	} else if (typeSite == SiteEnum.TW_U_CLIP_LIST) {
		if (divButtons.length == 0 || (divButtons.length == slugAr.length && getMTButtons() == slugAr.length))
			return;

		setupButtonsClipsList();
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

		for (let j = 0; j < 3; j++) {
			if (typeSite == SiteEnum.TW_U_CLIP_LIST && j == 2)
				continue;

			addButton(typeSite, slugEl, j, lang, divButtons);
		}

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

		if (typeSite == SiteEnum.TW_U_CLIP_LIST)
			continue;

		triggerButtonsClipsList('.manageQueueClip');
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
	let infos, element;

	if (removeSlugQueue) {
		infos = getLang(lang, "buttons.removeQueue");
		element = document.querySelector(".addQueueClip." + slugEl);

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
		}
	} else {
		infos = getLang(lang, "buttons.addQueue");
		element = document.querySelector(".removeQueueClip." + slugEl);

		if (!!element) {
			element.classList.remove('removeQueueClip');
			element.classList.add('addQueueClip');

			element.src = urlsButtons.addQueue;
		}
	}

	if (!element)
		return;

	resetSlugClass(element, slugEl);
	element = element.parentNode.parentNode.parentNode.parentNode.children[1];
	element.innerHTML = infos;
}

// Reset slug at the last position in the element classList
function resetSlugClass(element, slugEl) {
	element.classList.remove(slugEl);
	element.classList.add(slugEl);
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

	if (typeButton == BouttonsEnum.DOWNLOAD_CLIP) {
		infos = getLang(lang, "buttons.downloadClip");
		trigger = "downloadClip";
		button = button.replace('{IMG_URL', urlsButtons.downloadClip);
	} else if (typeButton == BouttonsEnum.ADD_QUEUE) {
		infos = getLang(lang, "buttons.addQueue");
		trigger = "addQueueClip";
		button = button.replace('{IMG_URL', urlsButtons.addQueue);
	} else if (typeButton == BouttonsEnum.MANAGE_QUEUE) {
		infos = getLang(lang, "buttons.manageQueue");
		trigger = "manageQueueClip";
		button = button.replace('{IMG_URL', urlsButtons.manageQueue);
	} else if (typeButton == BouttonsEnum.ADD_ALL_QUEUE) {
		infos = getLang(lang, "buttons.addAllQueue");
		trigger = "addAllQueue";
		button = button.replace('{IMG_URL', urlsButtons.addQueue);
	} else if (typeButton == BouttonsEnum.REMOVE_ALL_QUEUE) {
		infos = getLang(lang, "buttons.removeAllQueue");
		trigger = "removeAllQueue";
		button = button.replace('{IMG_URL', urlsButtons.removeQueue);
	} else if (typeButton == BouttonsEnum.DOWNLOAD_QUEUE_CLIP) {
		infos = getLang(lang, "queue.download_all");
		trigger = "downloadQueueClip";
		button = button.replace('{IMG_URL', urlsButtons.downloadQueueClip);
	}

	button = button.replace('{TRIGGER}', trigger + " " + slugEl);
	button = button.replace('{INFOS}', infos);

	let insertIndex, extraMDClass = "",
		extraMDStyle = "";

	if ([SiteEnum.CLIPS_TW, SiteEnum.TW_U_CLIP].includes(typeSite)) {
		button = button.replace('{IMG_WIDTH}', '');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-right: 10px;');
		extraMDClass = "tw-pd-1";

		insertIndex = 0;
	} else if (typeSite == SiteEnum.TW_U_CLIP_LIST) {
		button = button.replace('{IMG_WIDTH}', 'width="90%"');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-right: 5px;');
		extraMDStyle = "margin-top: 0.5vh;";

		let index = slugAr.indexOf(slugEl);
		get = get[index].querySelector("div.preview-card__titles-wrapper.tw-flex-grow-1.tw-flex-shrink-1.tw-full-width").querySelector("div");

		insertIndex = get.children.length - 1;
	} else if (typeSite == SiteEnum.TW_U_MANAGER_CLIPS) {
		button = button.replace('{IMG_WIDTH}', 'width="90%"');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-left: 5px;');
		extraMDStyle = "margin-left: 5px;";

		get = get.querySelector('div.tw-flex');
		get.childNodes[get.childNodes.length - 1].classList.remove("tw-inline-flex");
		get.childNodes[get.childNodes.length - 1].classList.remove("tw-tooltip-wrapper");

		insertIndex = get.children.length - 1;
	} else if (typeSite == SiteEnum.TW_U_CLIP_LIST_MENU) {
		button = button.replace('{IMG_WIDTH}', '');
		base = base.replace('{EXTRA_SD_STYLE}', 'margin-left: 10px;');
	}

	base = base.replace('{BUTTON}', button);

	let htmlMainDiv = '<div style="' + extraMDStyle + '" class="mTwitchButtons tw-align-items-center tw-flex tw-flex-row ' + extraMDClass + '"></div>';

	if (typeButton == BouttonsEnum.DOWNLOAD_CLIP)
		get.children[insertIndex].insertAdjacentHTML('afterend', htmlMainDiv);

	if (typeSite == SiteEnum.TW_U_CLIP_LIST_MENU)
		get.innerHTML += base;
	else
		get.querySelector('.mTwitchButtons').innerHTML += base;
}

function removeButtonsClipsList() {
	let manageQueue = document.querySelector('div.ButtonsClipsList');
	if (!!manageQueue)
		manageQueue.parentNode.removeChild(manageQueue);
}

function setupButtonsClipsList() {
	if (!lang || document.querySelectorAll(".ButtonsClipsList").length > 0)
		return;

	removeButtonsClipsList();

	let navBar = document.querySelector('div.channel-header__right.tw-align-items-center.tw-flex.tw-flex-nowrap.tw-flex-shrink-0');
	navBar.innerHTML = '<div class="ButtonsClipsList"></div>' + navBar.innerHTML;
	navBar = navBar.querySelector('div.ButtonsClipsList');
	addButton(SiteEnum.TW_U_CLIP_LIST_MENU, "addAllQueue", 3, lang, navBar);
	addButton(SiteEnum.TW_U_CLIP_LIST_MENU, "removeAllQueue", 4, lang, navBar);
	addButton(SiteEnum.TW_U_CLIP_LIST_MENU, "downloadQueueClip", 5, lang, navBar);
	addButton(SiteEnum.TW_U_CLIP_LIST_MENU, "manageQueue", 2, lang, navBar);
	triggerButtonsClipsList('.addAllQueue');
	triggerButtonsClipsList('.removeAllQueue');
	triggerButtonsClipsList('.manageQueueClip');
	triggerButtonsClipsList('.downloadQueueClip');
}

function triggerButtonsClipsList(className) {
	let func;

	if (className == ".addAllQueue" || className == ".removeAllQueue") {
		func = function () {
			let trigger = className == ".addAllQueue" ? ".addQueueClip" : ".removeQueueClip";
			let slugsEl = document.querySelectorAll("img" + trigger);

			for (let i = 0; i < slugsEl.length; i++) {
				let slug = slugsEl[i].classList[1];
				let greetingMsg = className == ".addAllQueue" ? "addSlugQueue" : "removeSlugQueue";

				chrome.runtime.sendMessage({
					greeting: greetingMsg,
					slug: slug
				});

				updateButQueue(lang, slug, className == ".removeAllQueue");
			}
		};
	} else if (className == ".manageQueueClip") {
		func = function () {
			setTimeout(function () {
				window.open(chrome.runtime.getURL("/queue/queue.html"));
			}, 50); // Prevent freeze queue.html
		};
	} else if (className == ".downloadQueueClip") {
		func = function () {
			chrome.runtime.sendMessage({
				greeting: "downloadQueueClip"
			});
		};
	}

	document.querySelector(className).addEventListener("click", func);
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
	return !!element && !!element.querySelector("button.tw-interactive.tw-core-button--hollow");
}