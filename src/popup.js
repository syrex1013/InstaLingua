document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-record-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ msg: "start-record" }, (response) => {
      console.log(response.response);
    });
  });

  document.getElementById("stop-record-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ msg: "stop-record" }, (response) => {
      console.log(response.response);
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === "update-status") {
      document.getElementById("status").innerText = request.status;
    } else if (request.msg === "update-result") {
      document.getElementById("result").innerText = request.result;
    }
  });
});
