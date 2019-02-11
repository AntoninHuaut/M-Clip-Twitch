var queueClips = chrome.extension.getBackgroundPage().queueClips;

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#export").addEventListener("click", () => {
        if (queueClips.length != 0)
            saveData(queueClips, "MClipTwitch_Queue_" + getDate(new Date()) + ".json");
        else
            M.toast({
                html: getLang(lang, "queue.no_clip"),
                displayLength: 3000,
                classes: "w3-red"
            });
    });

    document.querySelector("#import").addEventListener("click", () => {
        requestFile();
    });
});

function importQueue(data) {
    try {
        data = JSON.parse(data);

        if (!Array.isArray(data) || data.length == 0)
            throw new Error();

        for (let i = 0; i < data.length; i++)
            if (!data[i] || !data[i].slug || !data[i].url || !data[i].title)
                throw new Error();
    } catch (err) {
        M.toast({
            html: getLang(lang, "queue.notif.import_err"),
            displayLength: 3000,
            classes: "w3-red"
        });
        return;
    }

    let slugs = [];

    for (let i = 0; i < queueClips.length; i++)
        slugs[slugs.length] = queueClips[i].slug;

    let baseIndex = queueClips.length;

    for (let i = 0; i < data.length; i++) {
        if (slugs.includes(data[i].slug))
            continue;

        let index = baseIndex + i;
        queueClips[index] = data[i];
    }

    loadClips(false);
    M.toast({
        html: getLang(lang, "queue.notif.import_ok"),
        displayLength: 3000,
        classes: "w3-green"
    });
}

function getDate(date) {
    return (1 + date.getMonth()).toString().padStart(2, '0') + '/' + date.getDate().toString().padStart(2, '0') + '/' + date.getFullYear();
}

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var json = JSON.stringify(data),
            blob = new Blob([json], {
                type: "octet/stream"
            }),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

function requestFile() {
    var fileChooser = document.createElement("input");
    fileChooser.type = 'file';
    fileChooser.style = "display: none";

    fileChooser.addEventListener('change', function (evt) {
        var f = evt.target.files[0];
        if (f) {
            var reader = new FileReader();
            reader.onload = function (e) {
                importQueue(e.target.result);
            }

            reader.readAsText(f);
        }
    });

    document.body.appendChild(fileChooser);
    fileChooser.click();
    fileChooser.parentElement.removeChild(fileChooser);
}