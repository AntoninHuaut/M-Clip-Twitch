// function removeButtonsClipsList() {
// 	let manageQueue = getButtonsClipsListHTML();
// 	if (!!manageQueue)
// 		manageQueue.parentNode.removeChild(manageQueue);
// }

function setupButtonsClipsList(typeSite, navBar) {
    if (getButtonsClipsListHTML()) return;

    if (!navBar) return;

    navBar.insertAdjacentHTML('afterbegin', '<div class="ButtonsClipsList" style="white-space: nowrap; margin-right: 15px;"></div>');
    navBar = navBar.querySelector('div.ButtonsClipsList');
    setButtonData(SiteEnum.TW_U_CLIP_LIST_MENU, BouttonsEnum.ADD_ALL_QUEUE, "addAllQueue", navBar);
    setButtonData(SiteEnum.TW_U_CLIP_LIST_MENU, BouttonsEnum.REMOVE_ALL_QUEUE, "removeAllQueue", navBar);
    setButtonData(SiteEnum.TW_U_CLIP_LIST_MENU, BouttonsEnum.DOWNLOAD_QUEUE_CLIP, "downloadQueueClip", navBar);
    setButtonData(SiteEnum.TW_U_CLIP_LIST_MENU, BouttonsEnum.MANAGE_QUEUE, "manageQueue", navBar);
    triggerButtonsClipsList('.addAllQueue');
    triggerButtonsClipsList('.removeAllQueue');
    triggerButtonsClipsList('.manageQueueClip');
    triggerButtonsClipsList('.downloadQueueClip');
}

function triggerButtonsClipsList(className) {
    let func;

    if (className == ".addAllQueue" || className == ".removeAllQueue") {
        func = function () {
            let trigger = className == ".addAllQueue" ? ".addQueueClip" : ".removeQueueClip";
            let slugsEl = document.querySelectorAll("img" + trigger);

            for (let i = 0; i < slugsEl.length; i++) {
                let slug = slugsEl[i].classList[1];
                let greetingMsg = className == ".addAllQueue" ? "addSlugQueue" : "removeSlugQueue";

                chrome.runtime.sendMessage({
                    greeting: greetingMsg,
                    slug: slug
                });

                updateButQueue(slug, className == ".removeAllQueue");
            }
        };
    } else if (className == ".manageQueueClip") {
        func = function () {
            setTimeout(function () {
                window.open(chrome.runtime.getURL("/queue/queue.html"));
            }, 50); // Prevent freeze queue.html
        };
    } else if (className == ".downloadQueueClip") {
        func = function () {
            chrome.runtime.sendMessage({
                greeting: "downloadQueueClip"
            });
        };
    }

    document.querySelectorAll(className).forEach(item => item.onclick = func);
}

function getButtonsClipsListHTML() {
    return document.querySelector('div.ButtonsClipsList');
}