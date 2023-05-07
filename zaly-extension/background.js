import { io } from "./src/socket.io/socket.io.esm.min.js"
import { connectionStatus, messageTypes, socketStatus } from "./utils/status.js";
import sendMessageChrome from "./utils/sendMessageChrome.js";
import { sendNotification, notifications } from "./utils/notifications.js";

var status = connectionStatus.CONNECTING;
var fetchStatus = {}, sizes, started = false, carting;
var delayCart = 500;

const socket = io(SOCKET_ADDR, {
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000
});

socket.on('connect', async function(){
    sendNotification(notifications.CONNECTED);
    status = connectionStatus.CONNECTED;
    fetchStatus = await asyncEmit("getStatus", null);
});

socket.on('disconnect', function(){
    sendNotification(notifications.DISCONNECTED);
    status = connectionStatus.DISCONNECTED;
});

socket.on(socketStatus.FETCH_CHANGE, function(msg){
    fetchStatus = msg;
    sendMessageChrome({type: messageTypes.FETCH_STATUS_CHANGED, payload: msg});
})

function enableBot(){
    sizes = {};
    carting = false;
    started = true;
    socket.on('sizes', function(newSizes){
        if(!newSizes.data) {
            sendNotification(notifications.SOLD_OUT);
            sizes = {};
            console.log(sizes);
            return;
        }

        newSizes.data = newSizes.data.filter(s => parseFloat(s.size) < 44 && parseFloat(s.size) > 35)
        console.log(newSizes);

        if(newSizes.data.length > 0 && !carting){
            carting = true;
            startCarting(newSizes);
        }

        sizes = newSizes;
    })
}

function startCarting(sizes){
    chrome.tabs.query({active: true, url: "https://redacted/*"}, function(tabs) {
        if(!tabs[0]) return carting = false;
        chrome.tabs.sendMessage(tabs[0].id, {type: messageTypes.CART_ITEM, sizes: sizes}, function(response) {
        if(!response) { 
            console.log("response false");
            setTimeout(startCarting, 150);
        }
    });
    });
}

chrome.runtime.onMessage.addListener(
   (request, sender, sendResponse) => {
    console.log(request);
    switch (request.type) {
        case messageTypes.GET_PING:
            getPing().then(p => sendResponse(p));
            return true;
        case messageTypes.GET_STATUS:
            getPing().then(ping => sendResponse({bot: started, status, ping, fetchStatus}))
            return true;
        case messageTypes.GET_FETCH_STATUS:
            sendResponse(fetchStatus);
            break;
        case messageTypes.SET_URL:
            sendNotification(notifications.STARTED_FETCHING);
            asyncEmit('set', request.payload);
            break;
        case messageTypes.STOP_FETCH:
            sendNotification(notifications.STOPPED_FETCHING);
            asyncEmit('stop', null);
            break;
        case messageTypes.TURN_OFF:
            sendNotification(notifications.TURNED_OFF);
            socket.off("sizes");
            started = false;
            sizes = {};
            break;
        case messageTypes.TURN_ON:
            sendNotification(notifications.TURNED_ON);
            enableBot();
            break;
        case messageTypes.CART_FALSE:
            sendNotification(notifications.TRYING_AGAIN);
            if(sizes.data && sizes.data.length > 0) setTimeout(function(){
                startCarting(sizes);
            }, delayCart);
            else {
                carting = false;
            }
            break;
      default:
        break;
    }
  }
);

function asyncEmit(event, msg){
    return new Promise(function(resolve, reject){
        socket.emit(event, msg, (response) => {
            resolve(response);
        })
    })
}

async function getPing(){
    let start = performance.now();
    await asyncEmit("ping", "");
    return Math.round(performance.now() - start);
}