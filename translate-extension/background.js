// LinguaSnap Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "linguasnap-translate",
    title: "🌐 Translate with LinguaSnap",
    contexts: ["selection"]
  });

  // Set default settings
  chrome.storage.sync.set({
    targetLang: "en",
    autoDetect: true,
    showOnSelect: true,
    theme: "dark"
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "linguasnap-translate") {
    chrome.tabs.sendMessage(tab.id, {
      action: "translateSelection",
      text: info.selectionText
    });
  }
});

// Message handler from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    translateText(request.text, request.targetLang, request.sourceLang)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.action === "getSettings") {
    chrome.storage.sync.get(["targetLang", "autoDetect", "showOnSelect", "theme"], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (request.action === "saveSettings") {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function translateText(text, targetLang, sourceLang = "auto") {
  // Using MyMemory free translation API (no key required, 1000 req/day)
  const langPair = sourceLang === "auto" ? `auto|${targetLang}` : `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Translation API error");

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "Translation failed");
  }

  return {
    translatedText: data.responseData.translatedText,
    detectedLang: data.responseData.match ? sourceLang : "auto",
    confidence: data.responseData.match
  };
}
