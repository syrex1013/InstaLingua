import { translate } from "google-translate-api-x";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "start-record" || request.msg === "stop-record") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ response: "No active tab found" });
      }
    });
    return true; // Keeps the message channel open for async response
  } else if (request.msg === "translate-text") {
    translateText(request.text)
      .then((translatedText) => {
        sendResponse({ translatedText });
      })
      .catch((error) => {
        sendResponse({
          error: "Error translating text",
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
