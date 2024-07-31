document.addEventListener("DOMContentLoaded", () => {
  const copyBtn = document.getElementById("copy-btn");
  const findTextBtn = document.getElementById("find-text-btn");
  document.getElementById("start-record-btn").addEventListener("click", () => {
    copyBtn.innerText = "Copy";
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
  findTextBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ msg: "find-text" }, (response) => {
      console.log(response.response);
    });
  });
  copyBtn.addEventListener("click", () => {
    const resultText = document.getElementById("result").innerText;
    navigator.clipboard
      .writeText(resultText)
      .then(() => {
        copyBtn.innerText = "Copied!";
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  });
});
