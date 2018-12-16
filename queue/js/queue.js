var lang;
var queueClips = chrome.extension.getBackgroundPage().queueClips;

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        let list = document.getElementsByClassName("lang");
        lang = chrome.extension.getBackgroundPage().lang;

        for (let i = 0; i < list.length; i++) {
            let element = list[i];
            element.innerText = getLang(lang, "queue." + element.id);
        }

        $("#remove_all").click(function () {
            actionButton(1);
        });

        $("#back").click(function () {
            actionButton(2);
        });

        $("#download_all").click(function () {
            actionButton(3);
        });

        loadClips(false);
    }, 10);

    setInterval(function () {
        if ($(".space").length != queueClips.length)
            loadClips(false);
    }, 1000);
});

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

    if (type == -1) {
        removeClip($("#" + queueClips[0].slug));

        if (i + 1 == total)
            loadClips(true);
    } else if (type == 1)
        chrome.extension.getBackgroundPage().downloadMP4(queueClips[i].slug);

    if (i + 1 != total)
        setTimeout(function () {
            doActionAllClip(++i, total, type);
        }, 1);
}

function removeClip(element) {
    let hasTarget = !!element.target;

    if (hasTarget) {
        element = element.target;

        if (element.localName == "i")
            element = element.parentNode;
    } else
        element = element[0];

    let slug = element.id;

    for (let i = 0; i < queueClips.length; i++)
        if (queueClips[i].slug == slug) {
            queueClips.splice(queueClips.indexOf(queueClips[i]), 1);
            element = document.querySelector("#DIV_" + slug);
            element.parentNode.removeChild(element);

            break;
        }

    if (hasTarget)
        loadClips(true);
}

function loadClips(checkLength) {
    let element = document.querySelector('body div');

    if (queueClips.length == 0)
        element.innerHTML = "<h1>" + getLang(lang, "queue.no_clip") + "</h1>";
    else if (!checkLength) {
        let gets = $("div .clipBlock .w3-container .w3-center");
        element.innerHTML = "";

        for (let i = 0; i < gets.length; i++)
            gets[i].parentNode.removeChild(gets[i]);

        for (let i = 0; i < queueClips.length; i++) {
            let clip = queueClips[i];
            element.innerHTML += template.replace('{TITLE_C}', clip.title).replace(new RegExp('{SLUG_C}', 'g'), clip.slug).replace('{URL_C}', clip.url);

            setTimeout(function () {
                $("#" + clip.slug).click(removeClip);
            }, 10);
        }
    }

    loadCSS();
}

function loadCSS() {
    chrome.storage.local.get({
        queueImageSize: "30",
        queueTitleSize: "20"
    }, function (items) {
        $("img").css("width", items.queueImageSize + "vw");
        $("h3").css("font-size", items.queueTitleSize + "px");
    });
}

var template = ' <div id="DIV_{SLUG_C}" class="clipBlock w3-container w3-center">' +
    '<h3> {TITLE_C} </h3>' +
    '<img src="{URL_C}">' +
    '<div class="space">' +
    '<button class="w3-button w3-circle w3-badge w3-tiny w3-red" id="{SLUG_C}"><i style="padding: 0.25vh 0.35vw 0.25vh 0.35vw; font-size: 30px;" class="far fa-trash-alt"></i></button>' +
    '</div>' +
    '</div>';