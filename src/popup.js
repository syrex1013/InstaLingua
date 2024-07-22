"use strict";

import "./popup.css";

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const startRecordingBtn = document.getElementById("startRecordingBtn");
    const stopRecordingBtn = document.getElementById("stopRecordingBtn");

    if (startRecordingBtn && stopRecordingBtn) {
      startRecordingBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage(
          {
            type: "start-record",
            payload: {
              message: "Start of recording",
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
            } else {
              console.log(response.message);
            }
          }
        );
      });

      stopRecordingBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage(
          {
            type: "stop-record",
            payload: {
              message: "Stoppage of recording",
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
            } else {
              console.log(response.message);
            }
          }
        );
      });
    } else {
      console.error("Buttons not found");
    }
  });
})();
