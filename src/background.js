import { translate } from "google-translate-api-x";
import { split } from "sentence-splitter";
import { franc } from "franc-min"; // Import franc-min for language detection

// Detect the language of the text
async function detectLanguage(text) {
  // Use `franc` to detect the language code
  const langCode = franc(text.trim());
  console.log(`Detected language code: ${langCode}`);
  return langCode; // Return detected language code
}

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
        chrome.runtime.sendMessage({
          msg: "update-status",
          status: "No active tab found. Please open a tab and try again.",
        });
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
  } else if (request.msg === "translate-text-en") {
    console.log("Message received:", request.msg);

    // Detect language before translating
    detectLanguage(request.text)
      .then((lang) => {
        if (lang === "pol") {
          console.log("Text is already in Polish. Returning the same text.");
          sendResponse({ translatedText: request.text }); // Return the same text
        } else if (lang === "eng") {
          translateText(request.text, false)
            .then((translatedText) => {
              sendResponse({ translatedText });
            })
            .catch((error) => {
              sendResponse({
                error: "Error translating text",
                details: error.message,
              });
            });
        } else {
          console.log(
            "Text is not in Polish or English. Returning the same text."
          );
          sendResponse({ translatedText: request.text }); // Return the same text
        }
      })
      .catch((error) => {
        console.error("Error detecting language:", error);
        sendResponse({
          error: "Error detecting language",
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
  } else if (request.msg === "find-text") {
    console.log("Message received:", request.msg);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log("Background script sending message to content script");
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          sendResponse(response);
        });
      } else {
        console.log("Background script could not find active tab");
        chrome.runtime.sendMessage({
          msg: "update-status",
          status: "No active tab found. Please open a tab and try again.",
        });
        sendResponse({ response: "No active tab found" });
      }
    });
    return true; // Keeps the message channel open for async response
  }
});

async function correctGrammar(text) {
  console.log("Correcting grammar for text:", text);
  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      text: text,
      language: "en-US",
    }),
  });

  const data = await response.json();
  let correctedText = text;
  let offsetCorrection = 0;

  data.matches.forEach((match) => {
    const { offset, length, replacements } = match;
    const replacement = replacements[0]?.value;
    if (replacement) {
      const originalPart = correctedText.substring(
        offset + offsetCorrection,
        offset + offsetCorrection + length
      );
      correctedText =
        correctedText.substring(0, offset + offsetCorrection) +
        replacement +
        correctedText.substring(offset + offsetCorrection + length);
      offsetCorrection += replacement.length - length;

      console.log(`Changed "${originalPart}" to "${replacement}"`);
    }
  });

  return correctedText;
}

// Example translateText function (async)
async function translateText(text, toEnglish = true) {
  try {
    let from_l = "pl";
    let to_l = "en";
    if (!toEnglish) {
      from_l = "en";
      to_l = "pl";
    }
    const result = await translate(text, {
      from: from_l,
      to: to_l,
      autoCorrect: true,
      forceBatch: false,
    });
    console.log("Translated Text:", result.text);
    if (!toEnglish) {
      return result.text;
    }
    const formattedText = await correctGrammar(result.text);
    console.log("Corrected Text:", formattedText);
    return formattedText;
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Error translating text");
  }
}

chrome.runtime.onInstalled.addListener(function () {
  // ...

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // changeInfo object: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#changeInfo
    // status is more reliable (in my case)
    // use "alert(JSON.stringify(changeInfo))" to check what's available and works in your case
    if (changeInfo.status === "complete") {
      chrome.tabs.sendMessage(tabId, {
        message: "TabUpdated",
      });
    }
  });
});
