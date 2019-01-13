var lang;
var invalidChars = ['/', '\\', '>', '<', ':', '|', '"', '?', '*'];

document.addEventListener("DOMContentLoaded", function (event) {
  setTimeout(function () {
    let list = document.getElementsByClassName("lang");
    lang = chrome.extension.getBackgroundPage().lang;

    for (let i = 0; i < list.length; i++) {
      let element = list[i];
      element.innerText = getLang(lang, "options." + element.id);
    }

    let tagStrings = getLang(lang, "formatFile");
    let tagList = "";

    for (let i = 0; i < tagStrings.length; i++)
      tagList += " " + tagStrings[i];

    document.getElementById("format.file.tagList").innerText = tagList;
    restore_options();
    setLangs();
  }, 10);
});

function save_options() {
  let pRedirection = document.getElementById('redirection').checked;
  let pFormatMP4 = document.getElementById('formatMP4').value;
  let pFormatDate = document.getElementById('format.date').value;
  let pFormatTempsVOD = document.getElementById('format.tempsVOD').value;
  let pQueueImageSize = document.getElementById('queue.imageSize').value;
  let pQueueTitleSize = document.getElementById('queue.titleSize').value;

  if (invalidChars.some(char => pFormatMP4.indexOf(char) > -1) ||
    invalidChars.some(char => pFormatDate.indexOf(char) > -1) ||
    invalidChars.some(char => pFormatTempsVOD.indexOf(char) > -1)) {
    M.toast({
      html: getLang(lang, "options.notif.error_caract"),
      displayLength: 3000
    });
    return;
  }

  if (pQueueImageSize == "" || pQueueTitleSize == "" ||
    isNaN(pQueueImageSize) || isNaN(pQueueTitleSize) ||
    pQueueImageSize + 0 < 0 || pQueueTitleSize + 0 < 0) {
    M.toast({
      html: getLang(lang, "options.notif.error_size"),
      displayLength: 3000
    });
    return;
  }

  chrome.storage.local.set({
    redirection: pRedirection,
    formatMP4: pFormatMP4,
    formatDate: pFormatDate,
    formatTempsVOD: pFormatTempsVOD,
    queueImageSize: pQueueImageSize,
    queueTitleSize: pQueueTitleSize
  }, function () {
    M.toast({
      html: getLang(lang, "options.notif.save_param"),
      displayLength: 1500
    });
  });
}

function restore_options() {
  chrome.storage.local.get({
    redirection: false,
    formatMP4: "{STREAMER}.{GAME} {TITLE}",
    formatDate: "DD-MM-YYYY",
    formatTempsVOD: "-NA-",
    queueImageSize: "30",
    queueTitleSize: "20"
  }, function (items) {
    document.getElementById('redirection').checked = items.redirection;
    document.getElementById('formatMP4').value = items.formatMP4;
    document.getElementById('format.date').value = items.formatDate;
    document.getElementById('format.tempsVOD').value = items.formatTempsVOD;
    document.getElementById('queue.imageSize').value = items.queueImageSize;
    document.getElementById('queue.titleSize').value = items.queueTitleSize;

    document.getElementById('linkUpdateButton').href = "http://clips.maner.fr/update.html";
  });
}

function setLangs() {
  M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));
  document.getElementById("select-lang").innerHTML = getLang(lang, "options.langue") + ": " + getLang(lang, "name");
  let list = "";

  for (let i = 0; i < langsList.length; i++) {
    list += '<li><a id="selectLang-' + langsList[i] + '" href="#!">' + getLang(langsList[i], "name") + '</a></li>';

    setTimeout(function () {
      document.getElementById("selectLang-" + langsList[i]).addEventListener("click", () => {
        changeLang(langsList[i]);
      });
    }, 1);

    if (i + 1 != langsList.length)
      list += '<li class="divider" tabindex="-1"></li>';
  }

  document.getElementById("dropdown1").innerHTML = list;
}

function changeLang(newLang) {
  if (newLang != lang) {
    chrome.storage.local.set({
      language: newLang
    }, function () {
      chrome.extension.getBackgroundPage().lang = newLang;
      window.location.reload(false);
    });
  }
}

document.getElementById('boutons.save').addEventListener('click', save_options);
document.getElementById('boutons.queue').addEventListener('click', function () {
  window.location.href = "../queue/queue.html";
});

function getBrowser() {
  return (navigator.userAgent.indexOf(' OPR/') > 0) ? 1 : (typeof InstallTrigger !== 'undefined') ? 3 : (!!window.chrome) ? 2 : 4;
}