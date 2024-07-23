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
    if (request.type === "update-status") {
      document.getElementById("status").textContent = request.data;
    } else if (request.type === "update-result") {
      document.getElementById("result").textContent = request.data;
      document.getElementById("status").textContent = "Translation complete.";
    }
  });
});
