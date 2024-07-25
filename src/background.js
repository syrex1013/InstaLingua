import { translate } from "google-translate-api-x";
import { split } from 'sentence-splitter';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "start-record" || request.msg === "stop-record") {
    console.log("Message received:", request.msg);
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
    console.log("Message received:", request.msg);
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
  } else if (
    request.msg === "update-status" ||
    request.msg === "update-result"
  ) {
    // Forward status and result updates to the popup
    chrome.runtime.sendMessage(request);
  }
});
function formatText(text) {
  // Split the text into sentences
  const sentences = split(text).filter(token => token.type === 'Sentence');
  
  // Capitalize the first word of each sentence and add a period at the end if missing
  const formattedSentences = sentences.map(sentence => {
    const sentenceText = sentence.raw;
    const words = sentenceText.split(" ");
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    let formattedSentence = words.join(" ");
    if (!formattedSentence.endsWith(".")) {
      formattedSentence += ".";
    }
    return formattedSentence;
  });

  // Join the sentences back into a formatted text
  const formattedText = formattedSentences.join(" ");
  return formattedText;
}

// Example translateText function (async)
async function translateText(text) {
  try {
    const result = await translate(text, {
      from: "pl",
      to: "en",
      autoCorrect: true,
      forceBatch: false,
    });
    console.log("Translated Text:", result.text);
    const formattedText = formatText(result.text);
    
    return formattedText;
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Error translating text");
  }
}
