import { io } from "socket.io-client";
const socket = io(SOCKET_ADDR);
let count = 0;
let ping;
let productUrl = "https://redacted/reebok-classic-club-revenge-sneakers-basse-white-re015o0fb-a11.html";


async function pingTest() {
    console.time("ping")
    await asyncEmit("ping", "ping");
    ping = console.timeEnd("ping");

    if(count++ < 3) pingTest();
    else start();
}


async function start(){
   let resp = await asyncEmit("set", productUrl)
    console.log("Setting url: ", resp);

    setTimeout(function(){
        asyncEmit("stop", true);
    }, 4000)
}

socket.on("sizes", (data) => {
    console.log(data);
})


function asyncEmit(event, msg){
    return new Promise(function(resolve, reject){
        socket.emit(event, msg, (response) => {
            resolve(response);
        })
    })
}

pingTest();