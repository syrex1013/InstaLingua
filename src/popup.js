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
});
