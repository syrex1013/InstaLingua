let mediaRecorder = null;
let stream = null;
let audioChunks = [];
let recognition = null;
let audioName = "recording";

// Function to start recording
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
        sampleRate: 44100,
        sampleSize: 16,
      },
    })
    .then((userStream) => {
      stream = userStream;
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      console.log("Content script mediaRecorder created");
      mediaRecorder.addEventListener("dataavailable", (event) => {
        console.log("Content script pusing audio chunk: ", event.data);
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Content script audioChunks:", audioChunks);
        console.log("Content script blob: ", blob);
        console.log("Content script mediaRecorder stopped and blob created");
        const reader = new FileReader();
        reader.onloadend = function () {
          const dataUrl = reader.result;
          chrome.runtime.sendMessage({
            msg: "process-audio",
            dataUrl: dataUrl,
          });
        };
        reader.readAsDataURL(blob);
        //processAudio(blob);
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
      console.log("Content script mediaRecorder started");
    })
    .catch((error) => {
      console.error("Content script Error accessing microphone:", error);
    });
}

// async function processAudio(blob) {
//   try {
//     const audioContext = new (window.AudioContext ||
//       window.webkitAudioContext)();

//     const arrayBuffer = await blob.arrayBuffer();
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

//     const source = audioContext.createBufferSource();
//     source.buffer = audioBuffer;
//     source.connect(audioContext.destination);

//     if (
//       !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
//     ) {
//       console.error("Speech Recognition API is not supported.");
//       return;
//     }

//     if (recognition) {
//       recognition.abort();
//     }

//     recognition = new (window.SpeechRecognition ||
//       window.webkitSpeechRecognition)();
//     console.log(recognition);
//     recognition.lang = "pl-PL";
//     recognition.interimResults = false;

//     recognition.onresult = async function (event) {
//       const text = event.results[0][0].transcript;
//       console.log("Recognized Polish Text:", text);

//       // Send message to background script for translation
//       chrome.runtime.sendMessage(
//         { msg: "translate-text", text: text },
//         (response) => {
//           if (response.translatedText) {
//             console.log("Translated Text:", response.translatedText);
//             // Do something with the translated text
//           } else if (response.error) {
//             console.error(
//               "Translation Error:",
//               response.error,
//               response.details
//             );
//           }
//         }
//       );
//     };

//     recognition.onerror = function (event) {
//       console.error("Speech recognition error:", event.error);
//     };

//     recognition.onend = function () {
//       console.log("Speech recognition ended");
//       recognition = null;
//     };

//     recognition.start();
//     source.start(0);
//   } catch (error) {
//     console.error("Error processing audio:", error);
//   }
// }

function stopRecording() {
  console.log("Content script stopRecording function called");
  if (mediaRecorder) {
    console.log("Content script stopping recording");
    mediaRecorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    mediaRecorder = null;
    audioChunks = [];
  }
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
  }
});
