export default (payload) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(payload, function (response) {
        if (response) {
          resolve(response);
        }
        else {
          reject("browserAction not open");
        }
      });
    });
  }