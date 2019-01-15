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
            actionButton(i + 1);
        });

    loadClips(false);

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.greeting == "queue-update")
                loadClips(false);
        });
}

function actionButton(type) {
    switch (type) {
        case 1:
            doActionAllClip(0, queueClips.length, -1);
            break;

        case 2:
            window.location.href = "../options/options.html";
            break;

        case 3:
            doActionAllClip(0, queueClips.length, 1);
            break;
    }
}

function doActionAllClip(i, total, type) {
    if (total == 0)
        return;

    if (type == -1 && queueClips.length > 0) {
        removeClip(document.getElementById("DIV_" + queueClips[0].slug), true);

        if (i + 1 == total)
            loadClips(true);
    } else if (type == 1)
        chrome.extension.getBackgroundPage().downloadMP4(queueClips[i].slug);

    if (i + 1 != total)
        setTimeout(function () {
            doActionAllClip(++i, total, type);
        }, 1);
}

function removeClip(element, removeAll) {
    if (removeAll) {
        let size = queueClips.length;

        for (let i = 0; i < size; i++) {
            chrome.runtime.sendMessage({
                greeting: "queue-delete-clip",
                slug: queueClips[0].slug
            });

            element = document.getElementById('DIV_' + queueClips[0].slug);
            queueClips.splice(queueClips.indexOf(queueClips[0]), 1);
            element.parentNode.removeChild(element);
        }
    } else {
        let slug = element.id.replace('DIV_', '');

        for (let i = 0; i < queueClips.length; i++) {
            if (queueClips[i].slug == slug) {
                queueClips.splice(queueClips.indexOf(queueClips[i]), 1);
                element.parentNode.removeChild(element);
                break;
            }
        }

        chrome.runtime.sendMessage({
            greeting: "queue-delete-clip",
            slug: slug
        });
    }
}

function loadClips(checkLength) {
    let element = document.getElementById('clipsList');

    if (queueClips.length == 0)
        element.innerHTML = "<h1>" + getLang(lang, "queue.no_clip") + "</h1>";
    else if (!checkLength) {
        element.innerHTML = "";

        for (let i = 0; i < queueClips.length; i++) {
            let clip = queueClips[i];
            let newTitle = clip.title;
            if (newTitle.length >= 50)
                newTitle = newTitle.substring(0, 49) + "...";

            let clipPreview = template.replace('{TITLE_C}', newTitle).replace(new RegExp('{SLUG_C}', 'g'), clip.slug).replace('{URL_C}', clip.url);
            clipPreview = clipPreview.replace('{H3_CSS}', (1.05 * prevScaleVal) + "vw").replace('{IMG_CSS}', (30 * prevScaleVal) + "vw")

            element.innerHTML += clipPreview;

            setTimeout(function () {
                document.querySelector("#DEL_" + clip.slug).addEventListener("click", () => {
                    removeClip(document.getElementById("DIV_" + clip.slug), false);
                });
                document.querySelector("#DOW_" + clip.slug).addEventListener("click", () => {
                    chrome.extension.getBackgroundPage().downloadMP4(clip.slug);
                });
            }, 1);
        }
    }
}

var template = ' <div id="DIV_{SLUG_C}" class="clipBlock w3-container w3-center">' +
    '<h3 style="font-size: {H3_CSS}"> {TITLE_C} </h3>' +
    '<img style="width: {IMG_CSS}" src="{URL_C}">' +
    '<div class="space">' +
    '<button style="margin-right: 0.5vw;" class="w3-button w3-circle w3-badge w3-tiny w3-blue" id="DOW_{SLUG_C}"><i style="padding: 0.20vh 0.15vw 0.20vh 0.15vw; font-size: 30px;" class="far fa-arrow-alt-circle-down"></i></button>' +
    '<button class="w3-button w3-circle w3-badge w3-tiny w3-red" id="DEL_{SLUG_C}"><i style="padding: 0.20vh 0.25vw 0.20vh 0.25vw; font-size: 30px;" class="far fa-trash-alt"></i></button>' +
    '</div>' +
    '</div>';