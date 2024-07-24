let mediaRecorder = null;
let stream = null;
let audioChunks = [];
let recognition = null;
let audioName = "recording";

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
        processAudio(blob);
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement("a");
        // a.style = "display: none";
        // a.href = url;
        // a.download = document.title + ".webm";
        // document.body.appendChild(a);
        // a.click();
        // URL.revokeObjectURL(url);
        // sendAudioToServer(blob, audioName); // Uncomment if needed
      });

      mediaRecorder.start();
      console.log("Recording started");
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
    });
}

async function processAudio(blob) {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      console.error("Speech Recognition API is not supported.");
      return;
    }

    if (recognition) {
      recognition.abort();
    }

    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    console.log(recognition);
    recognition.lang = "pl-PL";
    recognition.interimResults = false;

    recognition.onresult = async function (event) {
      const text = event.results[0][0].transcript;
      console.log("Recognized Polish Text:", text);

      // Send message to background script for translation
      chrome.runtime.sendMessage(
        { msg: "translate-text", text: text },
        (response) => {
          if (response.translatedText) {
            console.log("Translated Text:", response.translatedText);
            // Do something with the translated text
          } else if (response.error) {
            console.error(
              "Translation Error:",
              response.error,
              response.details
            );
          }
        }
      );
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {
      recognition = null;
    };

    recognition.start();
    source.start(0);
  } catch (error) {
    console.error("Error processing audio:", error);
  }
}

function stopRecording() {
  if (!mediaRecorder) {
    console.log("No recording in progress.");
    return;
  }

  mediaRecorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  mediaRecorder = null;
  audioChunks = [];

  if (recognition) {
    recognition.abort();
  }

  console.log("Recording stopped");
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
