function setButtonData(typeSite, typeButton, slugEl, elInsert) {
    const jsonButtonType = getButton_TypeButton(typeButton);
    const jsonSiteType = getButton_TypeSite(typeSite, elInsert);
    let button = ButtonBase;

    button = button.replace('{TRIGGER}', jsonButtonType.trigger + " " + slugEl);
    button = button.replace('{INFOS}', jsonButtonType.infos);
    button = button.replace('{IMG_URL}', jsonButtonType.imgURL);
    button = button.replace('{IMG_WIDTH}', `width="${sizeButton}"`);
    button = button.replace('{IMG_HEIGHT}', `height="${sizeButton}"`);

    let mTwitchClass = "mTwitchButtons";

    if (typeSite == SiteEnum.TW_U_CLIP_LIST_MENU) mTwitchClass = "";

    let htmlMainDiv = `<div style="${jsonSiteType.extraMDStyle}" class="${mTwitchClass} tw-align-items-center tw-flex tw-flex-row ${jsonSiteType.extraMDClass}"></div>`;

    if (typeButton == BouttonsEnum.DOWNLOAD_CLIP)
        jsonSiteType.htmlInsert.children[jsonSiteType.insertIndex].insertAdjacentHTML('afterend', htmlMainDiv);

    button = ButtonDiv.replace('{BUTTON}', button);
    button = button.replace('{EXTRA_SD_STYLE}', jsonSiteType.extraSDStyle);

    if (typeSite == SiteEnum.TW_U_CLIP_LIST_MENU)
        jsonSiteType.htmlInsert.innerHTML += button;
    else
        jsonSiteType.htmlInsert.querySelector('.mTwitchButtons').innerHTML += button;
}

function updateButQueue(slugEl, removeSlugQueue) {
    let infos;

    if (removeSlugQueue) {
        infos = getLang(lang, "buttons.removeQueue");
        document.querySelectorAll(".addQueueClip." + slugEl)
            .forEach(element => {
                element.classList.remove('addQueueClip');
                element.classList.add('removeQueueClip');

                resetSlugClass(element, slugEl);
                element.title = infos;
                element.width = sizeButton;
                element.height = sizeButton;
                element.src = urlsButtons.removeQueue;
            });

        document.querySelectorAll('.removeQueueClip.' + slugEl)
            .forEach(item => {
                item.onclick = () =>
                    chrome.runtime.sendMessage({
                        greeting: "removeSlugQueue",
                        slug: slugEl
                    })
            });
    } else {
        infos = getLang(lang, "buttons.addQueue");
        document.querySelectorAll(".removeQueueClip." + slugEl)
            .forEach(element => {
                element.classList.remove('removeQueueClip');
                element.classList.add('addQueueClip');

                resetSlugClass(element, slugEl);
                element.title = infos;
                element.width = sizeButton;
                element.height = sizeButton;
                element.src = urlsButtons.addQueue;
            });

        document.querySelectorAll('.addQueueClip.' + slugEl)
            .forEach(item =>
                item.onclick = () => {
                    chrome.runtime.sendMessage({
                        greeting: "addSlugQueue",
                        slug: slugEl
                    })
                }
            );
    }
}

// Reset slug at the last position in the element classList
function resetSlugClass(element, slugEl) {
    element.classList.remove(slugEl);
    element.classList.add(slugEl);
}