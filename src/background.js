let isRecording = false;

// Function to start recording
function startRecording() {
  if (isRecording) {
    console.log("Recording already in progress.");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["contentScript.js"],
      },
      () => {
        chrome.tabs.sendMessage(tabs[0].id, { msg: "start-record" });
      }
    );
  });

  isRecording = true;
}

// Function to stop recording
function stopRecording() {
  if (!isRecording) {
    console.log("No recording in progress.");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { msg: "stop-record" });
  });

  isRecording = false;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "start-record") {
    startRecording();
    sendResponse({ message: "Recording started" });
  } else if (request.type === "stop-record") {
    stopRecording();
    sendResponse({ message: "Recording stopped" });
  }
});
