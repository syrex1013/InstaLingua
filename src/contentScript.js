// contentScript.js
let mediaRecorder = null;
let stream = null;
let audioChunks = [];
let recognition = null;

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

async function processAudio(blob) {
  try {
    // Create an AudioContext
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create a buffer source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Connect the source to the audio context
    source.connect(audioContext.destination);

    // Use Web Speech API for speech-to-text
    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      console.error("Speech Recognition API is not supported.");
      return;
    }

    // Stop any previous recognition instance
    if (recognition) {
      recognition.abort();
    }

    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;

    recognition.onresult = async function (event) {
      const text = event.results[0][0].transcript;
      console.log("Recognized Polish Text:", text);

      // Translate the text
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: "translate-text", data: text },
          (response) => {
            resolve(response);
          }
        );
      });
      console.log("Translated English Text:", response);
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {
      recognition = null;
    };

    recognition.start();

    // Start playing the recorded audio
    source.start(0);
  } catch (error) {
    console.error("Error processing audio:", error);
  }
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

  // Stop any active speech recognition
  if (recognition) {
    recognition.abort();
  }

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
