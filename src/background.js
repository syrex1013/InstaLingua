import { translate } from "google-translate-api-x";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "start-record" || request.msg === "stop-record") {
    console.log(
      "Background script received message (start/stop):",
      request.msg
    );
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log("Background script sending message to content script");
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      } else {
        console.log("Background script could not find active tab");
        sendResponse({ response: "No active tab found" });
      }
    });
    return true; // Keeps the message channel open for async response
  } else if (request.msg === "translate-text") {
    console.log(
      "Background script received message (translate-text):",
      request.msg
    );
    translateText(request.text)
      .then((translatedText) => {
        console.log(
          "Background script sending translated text:",
          translatedText
        );
        sendResponse({ translatedText });
      })
      .catch((error) => {
        console.log(
          "Background script sending translation error:",
          error.message
        );
        sendResponse({
          error: "Error translating text",
          details: error.message,
        });
      });
    return true; // Keeps the message channel open for async response
  } else if (request.msg === "process-audio") {
    console.log("Background script received message (process-audio)");
    // Convert data URL to Blob
    console.log("Data URL:", request.dataUrl);
    //const blob = dataURLToBlob(request.dataUrl);

    processAudio(request.dataUrl)
      .then(() => {
        console.log("Background script sending audio processed response");
        sendResponse({ response: "Audio processed" });
      })
      .catch((error) => {
        console.log("Background script sending audio processing error:", error);
        sendResponse({
          error: "Error processing audio",
          details: error.message,
        });
      });

    return true; // Keeps the message channel open for async response
  }
});

// Example translateText function (async)
async function translateText(text) {
  try {
    const result = await translate(text, { from: "pl", to: "en" });
    console.log("Translated Text:", result.text);
    return result.text;
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Error translating text");
  }
}

// Helper function to convert Data URL to Blob
async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

// Example processAudio function (async)
async function processAudio(DataUrl) {
  console.log("Processing audio...");
  try {
    const audioBlob = await dataUrlToBlob(DataUrl);
    const transcript = await audioBlobToText(audioBlob);
    console.log("Transcript:", transcript);
  } catch (error) {
    console.error("Error processing audio:", error);
  }
}

async function audioBlobToText(audioBlob) {
  const audioBuffer = await audioBlob.arrayBuffer();
  const audioBytes = new Uint8Array(audioBuffer).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ""
  );

  const audio = {
    content: Buffer.from(audioBytes, "binary").toString("base64"),
  };

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US",
  };

  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");
  return transcription;
}
