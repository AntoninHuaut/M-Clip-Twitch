chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.greeting == "check-slug-duplicate" || request.greeting == "queue-update") updateButQueue(request.slugEl, request.isDuplicate);
});

SiteEnumList.forEach(typeSiteList => ready(typeSiteList.queryReady, (htmlElement) => onPartReady(htmlElement, typeSiteList)));

function onPartReady(htmlElement, typeSiteList) {
    let slug;
    let typeSite = SiteEnum[typeSiteList.name];

    switch (typeSite) {
        case SiteEnum.CLIPS_TW:
        case SiteEnum.TW_U_CLIP:
            slug = getSlugURL(location.href);
            break;
        case SiteEnum.TW_U_MANAGER_CLIPS:
            slug = getSlugURL(document.querySelector('.tw-aspect.tw-aspect--align-top iframe').src);
            break;
        case SiteEnum.TW_U_CLIP_LIST:
            slug = getSlugURL(htmlElement.querySelector('a.tw-interactive.tw-link').href);
            break;
        default:
            break;
    }

    if (!!slug)
        initButtons(typeSite, htmlElement, slug);

    else {
        // TW_U_CLIP_LIST_MENU
        setupButtonsClipsList(typeSite, htmlElement);
    }
}

function initButtons(typeSite, htmlElement, slugEl) {
    for (let typeButton = 0; typeButton < 3; typeButton++) {
        if (typeSite == SiteEnum.TW_U_CLIP_LIST && typeButton == 2) continue;

        setButtonData(typeSite, typeButton, slugEl, htmlElement);
    }

    document.querySelectorAll('.downloadClip.' + slugEl)
        .forEach(item =>
            item.onclick = () => {
                chrome.runtime.sendMessage({
                    greeting: "startDownloadMP4",
                    slug: slugEl
                })
            }
        );

    updateButQueue(slugEl, false);

    if (typeSite != SiteEnum.TW_U_CLIP_LIST)
        triggerButtonsClipsList('.manageQueueClip');

    sendCheckSlug(slugEl);
}

function sendCheckSlug(slugEl) {
    chrome.runtime.sendMessage({
        greeting: "checkSlugDuplicate",
        slug: slugEl
    });
}