const SiteEnum = {
    CLIPS_TW: "CLIPS_TW",
    TW_U_CLIP: "TW_U_CLIP",
    TW_U_CLIP_LIST: "TW_U_CLIP_LIST",
    TW_U_CLIP_LIST_MENU: "TW_U_CLIP_LIST_MENU"
}

const SiteEnumList = [{
    name: SiteEnum.CLIPS_TW,
    queryReady: "div.tw-align-items-center.tw-flex.tw-justify-content-end.tw-mg-y-1.tw-relative.tw-z-above"
}, {
    name: SiteEnum.TW_U_CLIP,
    queryReady: "div.tw-align-items-baseline.tw-flex > div.tw-justify-content-end.tw-flex"
}, {
    name: SiteEnum.TW_U_CLIP_LIST,
    queryReady: "div.tw-mg-b-2"
}, {
    name: SiteEnum.TW_U_CLIP_LIST_MENU,
    queryReady: "div.tw-align-items-center > div.channel-header__right > div.tw-flex"
}];

const BouttonsEnum = {
    DOWNLOAD_CLIP: 0,
    ADD_QUEUE: 1,
    MANAGE_QUEUE: 2,
    ADD_ALL_QUEUE: 3,
    REMOVE_ALL_QUEUE: 4,
    DOWNLOAD_QUEUE_CLIP: 5
};

const urlsButtons = {
    "downloadQueueClip": "https://i.imgur.com/bQiadMo.png",
    "downloadClip": "https://i.imgur.com/t1Le37l.png",
    "addQueue": "https://i.imgur.com/QUcfpvv.png",
    "removeQueue": "https://i.imgur.com/0HsqipO.png",
    "manageQueue": "https://i.imgur.com/aX9nHFZ.png"
};
const sizeButton = 30;

const ButtonBase = '<a href="#"><img class="{TRIGGER}" {IMG_WIDTH} {IMG_HEIGHT} title="{INFOS}" src="{IMG_URL}" /></a></figure></div>';
const ButtonDiv = '<div class="tw-inline-block" style="{EXTRA_SD_STYLE}">' +
    '<div class="social-button"><div class="tw-inline-flex tw-tooltip-wrapper">' +
    '<div class="social-button__icon tw-align-items-center tw-flex tw-justify-content-center">' +
    '<figure class="tw-svg">{BUTTON}' +
    '</div></div></div>';

var lang;

chrome.runtime.sendMessage({
    greeting: "request-lang"
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.greeting == "get-lang") lang = request.lang;
});