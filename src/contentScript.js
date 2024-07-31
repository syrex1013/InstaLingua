let mediaRecorder = null;
let stream = null;
let recognition = null;

function updatePopupStatus(message) {
  chrome.runtime.sendMessage({ msg: "update-status", status: message });
}

function updatePopupResult(result) {
  chrome.runtime.sendMessage({ msg: "update-result", result: result });
}

function findTextElements(element) {
  if (element.nodeType === Node.TEXT_NODE && element.nodeValue.trim() !== "") {
    let parent = element.parentElement;
    while (parent) {
      if (
        parent.tagName === "DIV" &&
        parent.getAttribute("class") ===
          "html-div xe8uvvx xexx8yu x4uap5 x18d9i69 xkhd6sd x1gslohp x11i5rnm x12nagc x1mh8g0r x1yc453h x126k92a x18lvrbx"
      ) {
        console.log("Text found:", element.nodeValue.trim());
        console.log("Element classes:", parent.getAttribute("class"));
        //add class translated to prevent double-translation
        parent.classList.add("translated");
        chrome.runtime.sendMessage(
          { msg: "translate-text-en", text: element.nodeValue.trim() },
          (response) => {
            if (response.translatedText) {
              element.nodeValue = response.translatedText;
            }
          }
        );

        break;
      }
      parent = parent.parentElement;
    }
  } else if (element.nodeType === Node.ELEMENT_NODE) {
    element.childNodes.forEach(findTextElements);
  }
}

function printTextElements() {
  findTextElements(document.body);
}

function startRecording() {
  console.log("Content script startRecording function called");
  if (mediaRecorder) {
    console.log("Content script mediaRecorder already exists");
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
  recognition.continuous = true; // Keep recognition running continuously

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;
    console.log("Recognized Polish Text:", text);
    updatePopupResult("Recognized Polish Text: " + text);

    // Clear previous result and show loading message
    updatePopupResult("Translating...");

    // Send message to background script for translation
    chrome.runtime.sendMessage(
      { msg: "translate-text", text: text },
      (response) => {
        if (response.translatedText) {
          console.log("Translated Text:", response.translatedText);
          updatePopupResult(response.translatedText);
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
    console.log("Content script received start-record message");
    startRecording();
    sendResponse({ response: "Recording started" });
  } else if (request.msg === "stop-record") {
    console.log("Content script received stop-record message");
    stopRecording();
    sendResponse({ response: "Recording stopped" });
  } else if (request.msg === "find-text") {
    console.log("Content script received find-text message");
    printTextElements();
    sendResponse({ response: "Text elements printed to console" });
  }
});
