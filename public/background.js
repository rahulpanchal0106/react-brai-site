// 1. Open Side Panel on Click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 2. Create the hidden Offscreen Document
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  
  // Check if it already exists so we don't spawn duplicates
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  // Create the hidden GPU sandbox
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['WORKERS'], // Gives it permission to spawn heavy background threads
    justification: 'Run react-brai WebGPU inference away from UI thread'
  });
}

// 3. Boot it up when the extension loads
chrome.runtime.onInstalled.addListener(() => {
  setupOffscreenDocument('offscreen.html');
});