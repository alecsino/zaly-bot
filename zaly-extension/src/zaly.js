chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
     switch (request.type) {
        case 'CART_ITEM':
            addToCart(request.sizes);
            sendResponse(true)
            break;
        case 'SEND_NOTIFICATION':
            sendNotification(request.payload);
            break;
       default:
         break;
     }
   }
 );

const notifications = {
    ADDING_TO_CART: {
        color: 'lightgreen',
        title: 'Info',
        message: 'Adding to cart'
    },
    FAILED_TO_CART: {
        color: 'lightcoral',
        title: 'Info',
        message: 'Failed to cart'
    },
    CHECKOUT: {
        color: 'lightgreen',
        title: 'Info',
        message: 'Checkout'
    },
    FAILED_CHECKOUT: {
        color: 'lightcoral',
        title: 'Info',
        message: 'Failed checkout'
    },
    SUCCESS: {
        color: 'green',
        title: 'Info',
        message: 'Success! Opening Paypal'
    },
    BUY_FAILED: {
        color: 'lightcoral',
        title: 'Info',
        message: 'Failed buy'
    }
}

 async function addToCart(sizes){
    if(!sizes.data) return sendMessage("CART_FALSE");
    sendNotification(notifications.ADDING_TO_CART);
    console.log(sizes);
    let product = getSize(sizes.data);
    console.log(`Carting ${product.size}`);

    let req = await fetch("https://redacted/api/graphql/add-to-cart/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "dpr": "2",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "viewport-width": "615",
            "x-xsrf-token": getCookie('frsx'),
            "x-redacted-feature": "pdp",
            "x-redacted-intent-context": "navigationTargetGroup=MEN",
            "x-redacted-request-uri": window.location.href.split('/')[3],
    },
    "referrer": window.location.href,
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": "[{\"id\":\"e7f9dfd05f6b992d05ec8d79803ce6a6bcfb0a10972d4d9731c6b94f6ec75033\",\"variables\":{\"addToCartInput\":{\"productId\":\""+ product.sku +"\",\"clientMutationId\":\"addToCartMutation\"}}}]",
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
    });
    let body = await req.json();
    console.log(body);

    if(body[0].errors || !body || !body[0].data) {
        sendNotification(notifications.FAILED_TO_CART);
        console.log("Not carted");
        sendMessage("CART_FALSE");
    }
    else {
        console.log("Carted");
        await checkout();
    }
 }

async function checkout(){
    console.log("Checkout");
    sendNotification(notifications.CHECKOUT);
    let req = await fetch("https://redacted/checkout/confirm", {
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
    });
    let body = await req.text();
    if(!req.redirected && req.ok) {
        let parsed = new DOMParser().parseFromString(body, 'text/html');
        let data = JSON.parse(parsed.getElementsByClassName(`z-coast-fjord-confirmation`)[0].parentElement.parentElement.getAttribute("data-props"));
        
        await buyNow(data.model.eTag, data.model.checkoutId);
    } else {
        sendNotification(notifications.FAILED_CHECKOUT);
        console.log("Checkout error");
        console.log(req);
        sendMessage("CART_FALSE");
        //checkout error
    }
 }
 
async function buyNow(eTag, checkoutId){
    console.log("Buy now");
    let req = await fetch("https://redacted/api/checkout/buy-now", 
    {
        headers: {
            "accept": "application/json",
            "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json", 
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
            "sec-ch-ua-mobile": "?0", 
            "sec-fetch-dest": `empty`, 
            "sec-fetch-mode": `cors`, 
            "sec-fetch-site": "same-origin", 
            "x-xsrf-token": getCookie(`frsx`), 
            "x-redacted-checkout-app": `web`, 
            "x-redacted-footer-mode": "desktop", 
            "x-redacted-header-mode": "desktop"
        }, 
        referrer: "https://redacted/checkout/confirm", 
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{"checkoutId":"` + checkoutId + `","eTag":` + eTag + "}",
        method: `POST`,
        mode: `cors`, 
        credentials: "include"
    })
    let body = await req.json();
    console.log(req, body);

    if(body.url.includes("paypal")){
        sendNotification(notifications.SUCCESS);
        console.log("Checkout with paypal!");
        window.open(body.url, "Paypal checkout", `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=400, height=600`)
        sendMessage("TURN_OFF");
    }
    else {
        sendNotification(notifications.BUY_FAILED);
        console.log("Buynow error");
        sendMessage("CART_FALSE");
    }
 }

function getCookie(item){
    let reg = new RegExp('.*'+item+'=');
    let result = document.cookie.replace(reg,"");
    return result.replace(/;.*/, "");
 }

function getSize(sizes){
    return sizes[Math.floor(Math.random()*sizes.length)];
 }

function sendMessage(type){
    return new Promise(function(resolve, reject){
        chrome.runtime.sendMessage({type: type}, function (response) {
            resolve(response);
        });
    })
}

function sendNotification(payload){
    let div = document.createElement('div');
    let status = document.createElement('div');
    let text = document.createElement('div');
    let title = document.createElement('div');
    let msg = document.createElement('div');

    div.appendChild(status);div.appendChild(text);

    div.style.cssText = "display:flex;margin:10px;transition: all linear 1s;opacity:0;"
    status.style.cssText = "background-color:"+payload.color+";width: 3px;border-radius: 8px 0px 0px 8px;box-shadow: rgba(0, 0, 0, 0.075) 0px 2px 4px 0px;"
    text.style.cssText = "background-color: #FEFEFA;color: black;padding: 6px;border-radius: 0px 8px 8px 0px;width:100%;box-shadow: rgba(0, 0, 0, 0.075) 0px 2px 4px 0px;"
   
    title.innerText = payload.title;
    title.style.cssText = "font-size:10px";

    msg.style.cssText = "font-size: 12px;margin-top: 3px;color: #0000008a;font-weight: 100;word-break: break-all;"
    msg.innerText = payload.message;
    text.appendChild(title); text.appendChild(msg);

    container.appendChild(div);
    window.getComputedStyle(div).opacity;
    div.style.opacity = 1;

    setTimeout(fadeNotification.bind(null, div), 4000);

}

function fadeNotification(div){
    div.style.opacity = 0;
    setTimeout(function(){div.remove()}, 1000);
}

let container = document.createElement('div');
container.id = "notification_container"
container.style.cssText = "position:absolute;width:30%;top:0;right:0;z-index:101"
document.body.appendChild(container)