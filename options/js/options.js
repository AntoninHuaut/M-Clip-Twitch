var langFile;

document.addEventListener("DOMContentLoaded", function (event) {
  setTimeout(function () {
    let list = document.getElementsByClassName("lang");
    langFile = (!chrome.extension.getBackgroundPage().lang ? fr : en);

    for (let i = 0; i < list.length; i++) {
      let element = list[i];

      if (element.id == "formatFile.browser_issue" /*&& getBrowser() != 1*/) // Opera supporte maintenant la fonctionnalité
        continue;

      element.innerText = getLang(langFile.options, element.id);
    }

    let tagList = "";

    for (let i = 0; i < langFile.formatFile.length; i++)
      tagList += " " + langFile.formatFile[i];

    document.getElementById("formatFile.tagList").innerText = tagList;
    restore_options();
  }, 10);
});

function getLang(json, id) {
  let list = id.split('.');

  for (let i = 0; i < list.length; i++)
    json = json[list[i]];

  return json;
}

// Saves options to chrome.storage
function save_options() {
  let pRedirection = document.getElementById('redirection').checked;
  let pLanguage = document.getElementById('language').checked;
  let pFormatMP4 = document.getElementById('formatMP4').value;
  let pFormatDate = document.getElementById('formatDate').value;
  if (invalidChars.some(char => pFormatMP4.indexOf(char) > -1)) {
    Materialize.toast(langFile.options.notif.error_caract, 3000)
    return;
  }

  let hasChange = false;

  chrome.storage.local.get({
    language: true
  }, function (items) {
    if (items.language != pLanguage) {
      hasChange = true;
      chrome.extension.getBackgroundPage().lang = pLanguage;
    }
  });

  chrome.storage.local.set({
    redirection: pRedirection,
    language: pLanguage,
    formatMP4: pFormatMP4,
    formatDate: pFormatDate
  }, function () {
    // Update status to let user know options were saved.
    Materialize.toast(langFile.options.notif.save_param, 1500);

    if (hasChange)
      window.location.reload(false);
  });
}

var invalidChars = ['/', '\\'];

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get({
    redirection: false,
    language: true,
    formatMP4: "{STREAMER}.{GAME} {TITLE}",
    formatDate: "DD-MM-YYYY"
  }, function (items) {
    document.getElementById('redirection').checked = items.redirection;
    document.getElementById('language').checked = items.language;
    document.getElementById('formatMP4').value = items.formatMP4;
    document.getElementById('formatDate').value = items.formatDate;
  });
}

document.getElementById('bouttons.save').addEventListener('click', save_options);

function getBrowser() {
  return (navigator.userAgent.indexOf(' OPR/') > 0) ? 1 : (typeof InstallTrigger !== 'undefined') ? 3 : (!!window.chrome) ? 2 : 4;
}