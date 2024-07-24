let mediaRecorder = null;
let stream = null;
let recognition = null;

function updatePopupStatus(message) {
  chrome.runtime.sendMessage({ msg: "update-status", status: message });
}

function updatePopupResult(result) {
  chrome.runtime.sendMessage({ msg: "update-result", result: result });
}

function startRecording() {
  if (mediaRecorder) {
    console.log("Recording already in progress.");
    return;
  }

  navigator.mediaDevices
    .getUserMedia({
      audio: {
        channels: 2,
        autoGainControl: true,
        echoCancellation: false,
        noiseSuppression: false,
      },
    })
    .then((userStream) => {
      stream = userStream;
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      // Create a gain node to increase the volume
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1; // Increase the gain (1 means normal volume)

      source.connect(gainNode);
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);

      mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.addEventListener("dataavailable", (event) => {
        const audioChunks = [event.data];
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Recording stopped:", blob);
      });

      mediaRecorder.start();
      console.log("Recording started");
      updatePopupStatus("Recording started");

      // Start Speech Recognition
      startSpeechRecognition();
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
      updatePopupStatus("Error accessing microphone: " + error.message);
    });
}

function stopRecording() {
  if (mediaRecorder) {
    console.log("Stopping recording...");
    mediaRecorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    mediaRecorder = null;
    updatePopupStatus("Recording stopped");
  }

  if (recognition) {
    recognition.stop();
  }
}

function startSpeechRecognition() {
  if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
    console.error("Speech Recognition API is not supported.");
    updatePopupStatus("Speech Recognition API is not supported.");
    return;
  }

  recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "pl-PL";
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;
    console.log("Recognized Polish Text:", text);
    updatePopupResult("Recognized Polish Text: " + text);

    // Send message to background script for translation
    chrome.runtime.sendMessage(
      { msg: "translate-text", text: text },
      (response) => {
        if (response.translatedText) {
          console.log("Translated Text:", response.translatedText);
          updatePopupResult("Translated Text: " + response.translatedText);
        } else if (response.error) {
          console.error("Translation Error:", response.error, response.details);
          updatePopupResult("Translation Error: " + response.error);
        }
      }
    );
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
    updatePopupStatus("Speech recognition error: " + event.error);
  };

  recognition.onend = function () {
    recognition = null;
  };

  recognition.start();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "start-record") {
    startRecording();
    sendResponse({ response: "Recording started" });
  } else if (request.msg === "stop-record") {
    stopRecording();
    sendResponse({ response: "Recording stopped" });
  }
});
