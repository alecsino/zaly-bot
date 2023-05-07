import { messageTypes } from '../utils/status.js'
import sendMessage from '../utils/sendMessageChrome.js'
// import { sendNotification, notifications } from '../util/notifications.js'

let botStatus;

async function init(){
    let status = await sendMessage({type: messageTypes.GET_STATUS});
    setPing(status.ping);
    getFetchStatus(status.fetchStatus);
    getBotStatus(status);
}

document.getElementById("getPage").addEventListener("click", function(){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        document.getElementById("product_url").value = url;
    });
});

document.getElementById("setUrl").addEventListener("click", function(){
    sendMessage({type: messageTypes.SET_URL, payload: document.getElementById("product_url").value});
});

document.getElementById("stopFetch").addEventListener("click", function(){
    sendMessage({type: messageTypes.STOP_FETCH});
});

document.getElementById("bot_status").addEventListener("click", function(){
    if(botStatus) sendMessage({type: messageTypes.TURN_OFF});
    else sendMessage({type: messageTypes.TURN_ON});
    botStatus = !botStatus;
    getBotStatus({bot: botStatus});
});

async function setPing(ping){
    if(!ping) ping = await sendMessage({type: messageTypes.GET_PING});
    document.getElementById("ping").innerText = ping;
}

async function getFetchStatus(status){
    if(!status) status = await sendMessage({type: messageTypes.GET_FETCH_STATUS});
    document.getElementById("fetchStatus").innerText = status.status;
    if(status.url) document.getElementById("product_url").value = status.url;
}

async function getBotStatus(status){
    if(status == undefined) status = await sendMessage({type: messageTypes.GET_STATUS});
    document.getElementById("bot_status").innerText = status.bot ? "ON" : "OFF";
    botStatus = status.bot;
}

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
     console.log(request);
     switch (request.type) {
         case messageTypes.FETCH_STATUS_CHANGED:
            getFetchStatus(request.payload);
            break;
       default:
         break;
     }
   }
 );

init();
