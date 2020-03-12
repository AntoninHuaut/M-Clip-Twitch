function getButton_TypeButton(typeButton) {
    let json = {
        infos: "",
        trigger: "",
        imgURL: ""
    };

    switch (typeButton) {
        case BouttonsEnum.DOWNLOAD_CLIP:
            json.infos = getLang(lang, "buttons.downloadClip");
            json.trigger = "downloadClip";
            json.imgURL = urlsButtons.downloadClip;
            break;

        case BouttonsEnum.ADD_QUEUE:
            json.infos = getLang(lang, "buttons.addQueue");
            json.trigger = "addQueueClip";
            json.imgURL = urlsButtons.addQueue;
            break;

        case BouttonsEnum.MANAGE_QUEUE:
            json.infos = getLang(lang, "buttons.manageQueue");
            json.trigger = "manageQueueClip";
            json.imgURL = urlsButtons.manageQueue;
            break;

        case BouttonsEnum.ADD_ALL_QUEUE:
            json.infos = getLang(lang, "buttons.addAllQueue");
            json.trigger = "addAllQueue";
            json.imgURL = urlsButtons.addQueue;
            break;

        case BouttonsEnum.REMOVE_ALL_QUEUE:
            json.infos = getLang(lang, "buttons.removeAllQueue");
            json.trigger = "removeAllQueue";
            json.imgURL = urlsButtons.removeQueue;
            break;

        case BouttonsEnum.DOWNLOAD_QUEUE_CLIP:
            json.infos = getLang(lang, "queue.download_all");
            json.trigger = "downloadQueueClip";
            json.imgURL = urlsButtons.downloadQueueClip;
            break;
    }

    return json;
}

function getButton_TypeSite(typeSite, htmlInsert) {
    let json = {
        insertIndex: "",
        extraMDClass: "",
        extraMDStyle: "",
        extraSDStyle: "",
        insertIndex: 0,
        htmlInsert: undefined
    }

    json.htmlInsert = htmlInsert;

    switch (typeSite) {
        case SiteEnum.CLIPS_TW:
        case SiteEnum.TW_U_CLIP:
            json.extraMDClass = "tw-pd-1";
            json.extraSDStyle = 'margin-right: 10px;';
            break;

        case SiteEnum.TW_U_CLIP_LIST:
            json.extraSDStyle = 'margin-right: 5px;';
            json.extraMDStyle = "margin-top: 0.5vh;"
            json.htmlInsert = json.htmlInsert.querySelector("article>div>div>.tw-flex-grow-1.tw-flex-shrink-1.tw-full-width").querySelector("div.tw-media-card-meta__links");
            json.insertIndex = json.htmlInsert.children.length - 1;
            break;

        case SiteEnum.TW_U_MANAGER_CLIPS:
            json.extraSDStyle = 'margin-left: 5px;';
            json.extraMDStyle = "margin-left: 5px;";
            json.htmlInsert = json.htmlInsert.querySelector('div.tw-flex');
            json.htmlInsert.childNodes[json.htmlInsert.childNodes.length - 1].classList.remove("tw-inline-flex");
            json.htmlInsert.childNodes[json.htmlInsert.childNodes.length - 1].classList.remove("tw-tooltip-wrapper");
            json.htmlInsert.insertIndex = json.htmlInsert.children.length - 1;
            break;

        case SiteEnum.TW_U_CLIP_LIST_MENU:
            json.extraSDStyle = 'margin-left: 10px;';
            break;
    }

    return json;
}