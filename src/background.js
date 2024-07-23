import { translate } from "google-translate-api-x";

async function translateText(text) {
  try {
    const result = await translate(text, { from: "pl", to: "en" });
    console.log("Translated Text:", result.text);
    return result.text;
  } catch (error) {
    console.error("Error translating text:", error);
    return "Error translating text";
  }
}

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
    return true; // Indicates that the response is asynchronous
  } else if (request.type === "translate-text") {
    translateText(request.data).then((translatedText) => {
      sendResponse(translatedText);
    });
    return true; // Indicates that the response is asynchronous
  }
});
