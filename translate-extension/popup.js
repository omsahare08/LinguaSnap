// LinguaSnap Popup Script

const LANGUAGES = {
  "en": "English", "es": "Spanish", "fr": "French", "de": "German",
  "it": "Italian", "pt": "Portuguese", "ru": "Russian", "zh": "Chinese",
  "ja": "Japanese", "ko": "Korean", "ar": "Arabic", "hi": "Hindi",
  "bn": "Bengali", "tr": "Turkish", "nl": "Dutch", "pl": "Polish",
  "sv": "Swedish", "da": "Danish", "fi": "Finnish", "no": "Norwegian",
  "el": "Greek", "he": "Hebrew", "id": "Indonesian", "ms": "Malay",
  "th": "Thai", "vi": "Vietnamese", "uk": "Ukrainian", "cs": "Czech",
  "sk": "Slovak", "hu": "Hungarian", "ro": "Romanian", "bg": "Bulgarian",
  "hr": "Croatian", "sr": "Serbian", "ca": "Catalan", "lt": "Lithuanian",
  "lv": "Latvian", "et": "Estonian", "sl": "Slovenian", "fa": "Persian",
  "ur": "Urdu", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
  "ml": "Malayalam", "sw": "Swahili", "af": "Afrikaans"
};

let currentTranslation = "";
let isSpeaking = false;

// Build language options
function buildLangOptions(includeAuto = false) {
  const opts = includeAuto ? `<option value="auto">Auto Detect</option>` : "";
  return opts + Object.entries(LANGUAGES)
    .map(([code, name]) => `<option value="${code}">${name}</option>`)
    .join("");
}

// Init selects
document.getElementById("popup-source-lang").innerHTML =
  `<option value="auto">Auto Detect</option>` + buildLangOptions();
document.getElementById("popup-target-lang").innerHTML = buildLangOptions();
document.getElementById("setting-default-lang").innerHTML = buildLangOptions();

// Load settings
chrome.storage.sync.get(["targetLang", "autoDetect", "showOnSelect"], (data) => {
  if (data.targetLang) {
    document.getElementById("popup-target-lang").value = data.targetLang;
    document.getElementById("setting-default-lang").value = data.targetLang;
  }
  document.getElementById("setting-show-on-select").checked = data.showOnSelect !== false;
  document.getElementById("setting-auto-detect").checked = data.autoDetect !== false;
});

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "history") loadHistory();
  });
});

// Translate button
document.getElementById("popup-translate-btn").addEventListener("click", () => {
  const text = document.getElementById("source-text").value.trim();
  if (!text) return;

  const targetLang = document.getElementById("popup-target-lang").value;
  const sourceLang = document.getElementById("popup-source-lang").value;
  const statusEl = document.getElementById("popup-status");
  const outputEl = document.getElementById("popup-output");
  const resultEl = document.getElementById("popup-result");
  const btn = document.getElementById("popup-translate-btn");

  btn.textContent = "TRANSLATING…";
  btn.disabled = true;
  statusEl.textContent = "";
  outputEl.style.display = "none";

  chrome.runtime.sendMessage({
    action: "translate",
    text,
    targetLang,
    sourceLang
  }, (response) => {
    btn.textContent = "TRANSLATE →";
    btn.disabled = false;

    if (response?.success) {
      currentTranslation = response.translatedText;
      resultEl.textContent = currentTranslation;
      outputEl.style.display = "block";
      statusEl.className = "status-msg success";
      statusEl.textContent = "✓ Translation complete";

      // Save to history
      chrome.storage.local.get(["history"], (data) => {
        const history = data.history || [];
        history.unshift({
          original: text,
          translated: currentTranslation,
          sourceLang,
          targetLang,
          time: Date.now()
        });
        if (history.length > 20) history.pop();
        chrome.storage.local.set({ history });
      });
    } else {
      statusEl.className = "status-msg error";
      statusEl.textContent = "⚠ " + (response?.error || "Translation failed");
    }
  });
});

// Copy
document.getElementById("popup-copy").addEventListener("click", () => {
  if (!currentTranslation) return;
  navigator.clipboard.writeText(currentTranslation).then(() => {
    const btn = document.getElementById("popup-copy");
    btn.textContent = "✓ Copied!";
    setTimeout(() => { btn.innerHTML = "📋 Copy"; }, 2000);
  });
});

// Speak
document.getElementById("popup-speak").addEventListener("click", () => {
  if (!currentTranslation) return;
  const btn = document.getElementById("popup-speak");

  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    btn.innerHTML = "🔊 Listen";
    return;
  }

  const targetLang = document.getElementById("popup-target-lang").value;
  const utterance = new SpeechSynthesisUtterance(currentTranslation);
  utterance.lang = targetLang;

  utterance.onstart = () => { isSpeaking = true; btn.innerHTML = "⏹ Stop"; };
  utterance.onend = () => { isSpeaking = false; btn.innerHTML = "🔊 Listen"; };
  utterance.onerror = () => { isSpeaking = false; btn.innerHTML = "🔊 Listen"; };

  speechSynthesis.speak(utterance);
});

// Open in Google Translate
document.getElementById("popup-open-google").addEventListener("click", () => {
  const text = document.getElementById("source-text").value.trim();
  const targetLang = document.getElementById("popup-target-lang").value;
  const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`;
  chrome.tabs.create({ url });
});

// Swap languages
document.getElementById("popup-swap").addEventListener("click", () => {
  const sourceSel = document.getElementById("popup-source-lang");
  const targetSel = document.getElementById("popup-target-lang");
  if (sourceSel.value === "auto") return;

  const tmp = sourceSel.value;
  sourceSel.value = targetSel.value;
  targetSel.value = tmp;

  // Also swap text if translation exists
  if (currentTranslation) {
    document.getElementById("source-text").value = currentTranslation;
    document.getElementById("popup-result").textContent = "";
    document.getElementById("popup-output").style.display = "none";
    currentTranslation = "";
  }
});

// Settings
document.getElementById("setting-show-on-select").addEventListener("change", (e) => {
  chrome.storage.sync.set({ showOnSelect: e.target.checked });
});

document.getElementById("setting-auto-detect").addEventListener("change", (e) => {
  chrome.storage.sync.set({ autoDetect: e.target.checked });
});

document.getElementById("setting-default-lang").addEventListener("change", (e) => {
  chrome.storage.sync.set({ targetLang: e.target.value });
  document.getElementById("popup-target-lang").value = e.target.value;
});

// History
function loadHistory() {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];
    const container = document.getElementById("history-list");

    if (!history.length) {
      container.innerHTML = `
        <div class="history-empty">
          <div class="history-empty-icon">🕐</div>
          No translations yet.<br>Start translating!
        </div>
      `;
      return;
    }

    container.innerHTML = history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <div class="history-orig">${escapeHtml(item.original.substring(0, 60))}${item.original.length > 60 ? "…" : ""}</div>
        <div class="history-trans">${escapeHtml(item.translated)}</div>
        <div class="history-meta">
          <span class="history-lang-badge">${(item.sourceLang || "AUTO").toUpperCase()} → ${item.targetLang.toUpperCase()}</span>
          <span class="history-time">${timeAgo(item.time)}</span>
        </div>
      </div>
    `).join("") + `<button class="clear-history" id="clear-history-btn">🗑 Clear History</button>`;

    // Click to use in translator
    container.querySelectorAll(".history-item").forEach(el => {
      el.addEventListener("click", () => {
        const item = history[parseInt(el.dataset.index)];
        document.getElementById("source-text").value = item.original;
        document.getElementById("popup-target-lang").value = item.targetLang;
        currentTranslation = item.translated;
        document.getElementById("popup-result").textContent = item.translated;
        document.getElementById("popup-output").style.display = "block";

        // Switch to translate tab
        document.querySelectorAll(".tab")[0].click();
      });
    });

    document.getElementById("clear-history-btn").addEventListener("click", () => {
      chrome.storage.local.set({ history: [] }, loadHistory);
    });
  });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Enter key to translate
document.getElementById("source-text").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    document.getElementById("popup-translate-btn").click();
  }
});
