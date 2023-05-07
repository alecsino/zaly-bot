import { Server } from "socket.io";
import { request } from 'undici'
import { parse } from 'node-html-parser';
import log4js from 'log4js';

log4js.configure({
    appenders: { zaly: { type: "file", filename: "zaly.log" } },
    categories: { default: { appenders: ["zaly"], level: "trace" } }
  });

let logger = log4js.getLogger("zaly");

const io = new Server(8081, {
  cors: {
    origin: "*"
  }
});
const delay = 150;

let url, stop = true, inStock = [];

io.on("connection", (socket) => {

  socket.on("set", (data, callback) => {
    console.log("Received URL %s", data);
    url = data;

    if(stop) {
      stop = false;
      io.emit("FETCH_CHANGE", {status: "ACTIVE", url: url});
      monitor();
    }

    callback(true);
  });

  socket.on("stop", (data, callback) => {
    stopMonitor();
    callback(true);
  });

  socket.on("ping", (data, callback) => {
    callback("pong");
  });

  socket.on('getStatus', (data, callback) => {
    callback({status: stop ? "STOPPED" : "ACTIVE", url: !stop ? url : null});
  })

});

function stopMonitor(){
  console.log("Stopping monitor");
  io.emit("FETCH_CHANGE", {status: "STOPPED"});
  stop = true;
}

async function monitor(){
  let sizes = await getSizes(url);

  let currStock = sizes && sizes.data ? sizes.data.map(s => s.size) : [];
  console.log(currStock);

  if((inStock.length > 0 && !currStock.length) || currStock.length) {
    io.emit("sizes", sizes);
    console.log("Re-stock");
  }
  inStock = currStock;

  if(sizes === false) return stopMonitor();

  if(!stop) setTimeout(monitor, delay);
}

async function getSizes(url){
  const res = await fetch(url).catch((err) => {console.log(err); return false });
  if(!res) return false;

  let root = parse(res);
  if(!root.querySelector(".re-1-12")) return false;

  let obj = JSON.parse(root.querySelector(".re-1-12").innerText);
  let objId = Object.keys(obj.graphqlCache)[23]
  let data = obj.graphqlCache[objId].data.product;

  if(!data){
    logger.trace("NO DATA");
    return {};
  }

  let instock = data.simples.filter(s => s.offer.stock.quantity != "OUT_OF_STOCK");

  if(data.comingSoon || !data.inStock) {
    if(instock.length > 0) logger.trace(data);
    return {};
  }

  let sizes = {
    data: instock,
    tokenArray: JSON.parse(root.querySelector(".re-data-el-init").innerText)
  }
  return sizes;
}

async function fetch(url, options){

    if(!options) {
        options = {
            headers: {
                "accept": "*/*",
                "accept-language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "credentials": "include"
            }
        }
    }

    let req = await request(url, options);
    return await req.body.text();
    
}