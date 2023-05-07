export const notifications = {
    CONNECTED: {
        color: 'green',
        title: 'Info',
        message: 'Connected to server'
    },
    DISCONNECTED: {
        color: 'red',
        title: 'Info',
        message: 'Disconnected from server'
    },
    TURNED_ON: {
        color: 'green',
        title: 'Info',
        message: 'Bot turned on'
    },
    TURNED_OFF: {
        color: 'red',
        title: 'Info',
        message: 'Bot turned off'
    },
    TRYING_AGAIN: {
        color: 'aliceblue',
        title: 'Info',
        message: 'Trying to cart again'
    },
    SOLD_OUT: {
        color: 'crimson',
        title: 'Ops',
        message: 'Sold out'
    },
    STARTED_FETCHING: {
        color: 'green',
        title: 'Info',
        message: 'Started fetching product'
    },
    STOPPED_FETCHING: {
        color: 'lightsalmon',
        title: 'Info',
        message: 'Stopped fetching product'
    }
}

export function sendNotification(payload){
    return new Promise(function(resolve, reject){
        chrome.tabs.query({active: true, url: "https://redacted/*"}, function(tabs) {
            if(!tabs[0]) return resolve();
            chrome.tabs.sendMessage(tabs[0].id, {type: 'SEND_NOTIFICATION', payload}, function(response) {
                resolve(response);
            });
        });
    })
}