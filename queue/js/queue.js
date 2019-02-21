var lang, prevScaleVal;
var queueClips = chrome.extension.getBackgroundPage().queueClips;

document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.local.get({
        previewScale: 1.0
    }, function (items) {
        prevScaleVal = items.previewScale;
        setTimeout(loadPage, 10);
    });
});

function loadPage() {
    let list = document.getElementsByClassName("lang");
    lang = chrome.extension.getBackgroundPage().lang;

    for (let i = 0; i < list.length; i++) {
        let element = list[i];
        element.innerText = getLang(lang, "queue." + element.id);
    }

    let menuList = ["remove_all", "back", "download_all"];

    for (let i = 0; i < menuList.length; i++)
        document.querySelector("#" + menuList[i]).addEventListener("click", () => {
            actionButton(i);
        });

    loadAllClips();

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.greeting == "queue-update")
                loadClips(request.slugEl, request.type);
        });
}

function actionButton(type) {
    switch (type) {
        case 0:
            queueClips.forEach(get => sendRequestDelete(get.slug));
            break;

        case 1:
            window.location.href = "../options/options.html";
            break;

        case 2:
            queueClips.forEach(get => chrome.extension.getBackgroundPage().downloadMP4(get.slug));
            break;
    }
}

function loadAllClips() {
    if (!checkMessageLength())
        queueClips.forEach(clips => loadClips(clips.slug, "add"));
}

function loadClips(slug, type) {
    if (type == "add")
        for (let i = 0; i < queueClips.length; i++) {
            if (queueClips[i].slug != slug)
                continue;

            let clip = queueClips[i];
            let newTitle = clip.title;
            if (newTitle.length >= 50)
                newTitle = newTitle.substring(0, 49) + "...";

            let clipPreview = template.replace('{TITLE_C}', newTitle).replace(new RegExp('{SLUG_C}', 'g'), clip.slug).replace('{URL_C}', clip.url);
            clipPreview = clipPreview.replace('{H3_CSS}', (1.05 * prevScaleVal) + "vw").replace('{IMG_CSS}', (30 * prevScaleVal) + "vw");

            let clipDiv = document.createElement('div');
            document.getElementById('clipsList').appendChild(clipDiv);
            clipDiv.outerHTML = clipPreview.trim();

            setTimeout(function () {
                document.querySelector("#DEL_" + clip.slug).addEventListener("click", () => {
                    sendRequestDelete(clip.slug);
                });
                document.querySelector("#DOW_" + clip.slug).addEventListener("click", () => {
                    chrome.extension.getBackgroundPage().downloadMP4(clip.slug);
                });
            }, 10);
        }

    else if (type == "remove")
        removeClipBlock(null, slug);

    checkMessageLength();
}

function checkMessageLength() {
    if (queueClips.length == 0) {
        if (!!document.querySelector("#noClipDiv"))
            return true;

        let noClip = document.createElement('div');
        noClip.id = 'noClipDiv';
        noClip.classList.add("w3-card-4", "w3-center");
        noClip.innerHTML = "<h1>" + getLang(lang, "queue.no_clip") + "</h1>";
        document.body.appendChild(noClip);

        return true;
    } else {
        let noClip = document.querySelector("#noClipDiv");

        if (!!noClip)
            noClip.parentNode.removeChild(noClip);
    }

    return false;
}

function sendRequestDelete(slug) {
    chrome.runtime.sendMessage({
        greeting: "removeSlugQueue",
        slug: slug
    });
}

function removeClipBlock(element, slug) {
    if (!element && !slug)
        return;

    if (!element)
        element = document.getElementById('DIV_' + slug);
    else
        slug = element.id.replace('DIV_', '');

    element.parentNode.removeChild(element);
}

var template = ' <div id="DIV_{SLUG_C}" class="clipBlock w3-container w3-center">' +
    '<h3 style="font-size: {H3_CSS}"> {TITLE_C} </h3>' +
    '<img style="width: {IMG_CSS}" src="{URL_C}">' +
    '<div class="space">' +
    '<button style="margin-right: 0.5vw;" class="w3-button w3-circle w3-badge w3-tiny w3-blue" id="DOW_{SLUG_C}"><i style="padding: 0.20vh 0.15vw 0.20vh 0.15vw; font-size: 30px;" class="far fa-arrow-alt-circle-down"></i></button>' +
    '<button class="w3-button w3-circle w3-badge w3-tiny w3-red" id="DEL_{SLUG_C}"><i style="padding: 0.20vh 0.25vw 0.20vh 0.25vw; font-size: 30px;" class="far fa-trash-alt"></i></button>' +
    '</div>' +
    '</div>';