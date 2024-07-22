// contentScript.js

let mediaRecorder = null;
let stream = null;
let audioChunks = [];

// Function to start recording
function startRecording() {
  if (mediaRecorder) {
    console.log("Recording already in progress.");
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((userStream) => {
      stream = userStream;
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style = "display: none";
        a.href = url;
        a.download = document.title + ".webm";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      });

      mediaRecorder.start();
      console.log("Recording started");
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
    });
}

// Function to stop recording
function stopRecording() {
  if (!mediaRecorder) {
    console.log("No recording in progress.");
    return;
  }

  mediaRecorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  mediaRecorder = null;
  audioChunks = [];
  console.log("Recording stopped");
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "start-record") {
    startRecording();
    sendResponse({ response: "Recording started" });
  } else if (request.msg === "stop-record") {
    stopRecording();
    sendResponse({ response: "Recording stopped" });
  }
});
