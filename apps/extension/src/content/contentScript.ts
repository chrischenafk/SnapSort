import { cancelScreenshotOverlay, startScreenshotOverlay } from "./screenshotOverlay";

chrome.runtime.onMessage.addListener((message: { type?: string }) => {
  if (message.type === "SNAPSORT_SCREENSHOT_START") {
    startScreenshotOverlay();
  }

  if (message.type === "SNAPSORT_SCREENSHOT_CANCEL") {
    cancelScreenshotOverlay();
  }
});
