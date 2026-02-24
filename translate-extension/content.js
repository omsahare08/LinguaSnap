// LinguaSnap Content Script

let settings = { targetLang: "en", autoDetect: true, showOnSelect: true };
let currentTranslation = "";
let triggerBtn = null;
let panel = null;
let selectionTimeout = null;
let historyShown = false;
let isSpeaking = false;

const LANGUAGES = {
  "auto": "Auto Detect",
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

// Load settings
chrome.runtime.sendMessage({ action: "getSettings" }, (data) => {
  if (data) settings = { ...settings, ...data };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  Object.keys(changes).forEach(key => {
    settings[key] = changes[key].newValue;
  });
});

// Selection listener
document.addEventListener("mouseup", (e) => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => handleSelection(e), 300);
});

document.addEventListener("keyup", (e) => {
  if (e.shiftKey) {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => handleSelection(e), 300);
  }
});

function handleSelection(e) {
  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text || text.length < 2 || !settings.showOnSelect) {
    removeTrigger();
    return;
  }

  if (text.length > 1000) {
    showTrigger(e, text.substring(0, 1000) + "...");
    return;
  }

  showTrigger(e, text);
}

function showTrigger(e, text) {
  removeTrigger();

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  triggerBtn = document.createElement("button");
  triggerBtn.id = "linguasnap-trigger";
  triggerBtn.innerHTML = `
    <span style="font-size:14px">🌐</span>
    <span>Translate</span>
  `;

  const x = Math.min(rect.left + window.scrollX, window.innerWidth - 140);
  const y = rect.top + window.scrollY - 42;

  triggerBtn.style.left = `${Math.max(8, x)}px`;
  triggerBtn.style.top = `${Math.max(8, y)}px`;

  triggerBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    removeTrigger();
    showPanel(text, rect);
  });

  document.body.appendChild(triggerBtn);

  // Auto-hide after 5s
  setTimeout(removeTrigger, 5000);
}

function removeTrigger() {
  if (triggerBtn) {
    triggerBtn.remove();
    triggerBtn = null;
  }
}

function showPanel(text, rect) {
  removePanel();

  const root = document.createElement("div");
  root.id = "linguasnap-bubble";

  const langOptions = Object.entries(LANGUAGES)
    .filter(([k]) => k !== "auto")
    .map(([code, name]) =>
      `<option value="${code}" ${code === settings.targetLang ? "selected" : ""}>${name}</option>`
    ).join("");

  root.innerHTML = `
    <div class="ls-panel">
      <div class="ls-header" id="ls-drag-handle" title="Drag to move">
        <div class="ls-logo">
          <div class="ls-logo-icon">🌐</div>
          LINGUASNAP
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="ls-drag-indicator" title="Drag to move">⠿</span>
          <button class="ls-close" id="ls-close-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="ls-lang-row">
        <select class="ls-lang-select" id="ls-source-lang">
          <option value="auto" selected>Auto Detect</option>
          ${langOptions}
        </select>
        <button class="ls-swap-btn" id="ls-swap-btn" title="Swap languages">⇄</button>
        <select class="ls-lang-select" id="ls-target-lang">
          ${langOptions}
        </select>
      </div>
      <div class="ls-original">
        <div class="ls-label"><span class="ls-label-dot"></span> ORIGINAL</div>
        <div class="ls-original-text" id="ls-orig-text">${escapeHtml(text)}</div>
      </div>
      <div class="ls-translation">
        <div class="ls-label"><span class="ls-label-dot" style="background:#63ffc8"></span> TRANSLATION</div>
        <div class="ls-translated-text loading" id="ls-trans-text">
          <div class="ls-loader"><span></span><span></span><span></span></div>
          Translating...
        </div>
      </div>
      <div class="ls-actions">
        <button class="ls-btn ls-btn-copy" id="ls-copy-btn">📋 Copy</button>
        <button class="ls-btn ls-btn-speak" id="ls-speak-btn" title="Listen to translation">🔊 Listen</button>
        <button class="ls-btn ls-btn-google" id="ls-google-btn" title="Open in Google Translate">🔗 Full</button>
      </div>
      <div class="ls-footer">
        <span class="ls-char-count">${text.length} chars</span>
        <span class="ls-powered">LINGUASNAP v1.0</span>
      </div>
    </div>
  `;

  // Position the panel
  const panelWidth = 340;
  let x = rect.left + window.scrollX;
  let y = rect.bottom + window.scrollY + 10;

  // Adjust if off-screen
  if (x + panelWidth > window.innerWidth - 10) x = window.innerWidth - panelWidth - 10;
  if (x < 10) x = 10;

  // If panel would go below viewport, show above selection
  const panelHeight = 320;
  if (y + panelHeight > window.innerHeight + window.scrollY - 10) {
    y = rect.top + window.scrollY - panelHeight - 10;
  }

  root.style.left = `${x}px`;
  root.style.top = `${y}px`;

  document.body.appendChild(root);
  panel = root;

  // Animate in
  requestAnimationFrame(() => root.classList.add("visible"));

  // ── Drag-to-move ──────────────────────────────────────────────
  makeDraggable(root, root.querySelector("#ls-drag-handle"));
  // ─────────────────────────────────────────────────────────────

  // Bind events
  root.querySelector("#ls-close-btn").addEventListener("click", removePanel);
  root.querySelector("#ls-copy-btn").addEventListener("click", copyTranslation);
  root.querySelector("#ls-speak-btn").addEventListener("click", speakTranslation);
  root.querySelector("#ls-google-btn").addEventListener("click", () => openGoogleTranslate(text));
  root.querySelector("#ls-swap-btn").addEventListener("click", swapLanguages);
  root.querySelector("#ls-target-lang").addEventListener("change", (e) => {
    settings.targetLang = e.target.value;
    chrome.runtime.sendMessage({ action: "saveSettings", settings: { targetLang: e.target.value } });
    doTranslate(text);
  });
  root.querySelector("#ls-source-lang").addEventListener("change", () => {
    doTranslate(text);
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener("mousedown", outsideClickHandler);
  }, 100);

  // Start translation
  doTranslate(text);
}

// ── Drag implementation ───────────────────────────────────────────
function makeDraggable(el, handle) {
  let startX, startY, startLeft, startTop, dragging = false;

  handle.style.cursor = "grab";

  handle.addEventListener("mousedown", onMouseDown);

  function onMouseDown(e) {
    // Don't initiate drag on the close button
    if (e.target.closest("#ls-close-btn")) return;

    e.preventDefault();
    e.stopPropagation();

    dragging = true;
    handle.style.cursor = "grabbing";

    // Get current panel position (remove fixed/absolute ambiguity)
    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    // Switch to fixed + top-left coords so scrolling doesn't matter
    el.style.position = "fixed";
    el.style.left = `${startLeft}px`;
    el.style.top = `${startTop}px`;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = startLeft + dx;
    let newTop  = startTop  + dy;

    // Keep panel within viewport
    const panelRect = el.getBoundingClientRect();
    const panelW = panelRect.width  || 340;
    const panelH = panelRect.height || 320;

    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - panelW));
    newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - panelH));

    el.style.left = `${newLeft}px`;
    el.style.top  = `${newTop}px`;
  }

  function onMouseUp() {
    dragging = false;
    handle.style.cursor = "grab";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup",   onMouseUp);
  }
}
// ─────────────────────────────────────────────────────────────────

function swapLanguages() {
  if (!panel) return;
  const sourceSel = panel.querySelector("#ls-source-lang");
  const targetSel = panel.querySelector("#ls-target-lang");
  const origText = panel.querySelector("#ls-orig-text").textContent;

  if (sourceSel.value === "auto") return;

  const tmp = sourceSel.value;
  sourceSel.value = targetSel.value;
  targetSel.value = tmp;
  settings.targetLang = targetSel.value;

  // Put translation back as source text to re-translate
  if (currentTranslation) {
    panel.querySelector("#ls-orig-text").textContent = currentTranslation;
    panel.querySelector("#ls-char-count") && (panel.querySelector(".ls-char-count").textContent = `${currentTranslation.length} chars`);
    doTranslate(currentTranslation);
  }
}

function doTranslate(text) {
  if (!panel) return;
  const transEl = panel.querySelector("#ls-trans-text");
  const sourceLang = panel.querySelector("#ls-source-lang").value;
  const targetLang = panel.querySelector("#ls-target-lang").value;

  transEl.className = "ls-translated-text loading";
  transEl.innerHTML = `<div class="ls-loader"><span></span><span></span><span></span></div> Translating...`;

  chrome.runtime.sendMessage({
    action: "translate",
    text,
    targetLang,
    sourceLang
  }, (response) => {
    if (!panel) return;
    transEl.className = "ls-translated-text";
    if (response?.success) {
      currentTranslation = response.translatedText;
      transEl.textContent = currentTranslation;
      saveToHistory(text, currentTranslation, sourceLang, targetLang);
    } else {
      transEl.innerHTML = `<span class="ls-error">⚠ ${response?.error || "Translation failed. Check your connection."}</span>`;
    }
  });
}

function copyTranslation() {
  if (!currentTranslation) return;
  navigator.clipboard.writeText(currentTranslation).then(() => {
    const btn = panel?.querySelector("#ls-copy-btn");
    if (btn) {
      btn.textContent = "✓ Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = "📋 Copy";
        btn.classList.remove("copied");
      }, 2000);
    }
  });
}

function speakTranslation() {
  if (!currentTranslation) return;
  const btn = panel?.querySelector("#ls-speak-btn");

  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    if (btn) { btn.innerHTML = "🔊 Listen"; btn.classList.remove("speaking"); }
    return;
  }

  const targetLang = panel?.querySelector("#ls-target-lang").value || "en";
  const utterance = new SpeechSynthesisUtterance(currentTranslation);
  utterance.lang = targetLang;

  utterance.onstart = () => {
    isSpeaking = true;
    if (btn) { btn.innerHTML = "⏹ Stop"; btn.classList.add("speaking"); }
  };

  utterance.onend = () => {
    isSpeaking = false;
    if (btn) { btn.innerHTML = "🔊 Listen"; btn.classList.remove("speaking"); }
  };

  utterance.onerror = () => {
    isSpeaking = false;
    if (btn) { btn.innerHTML = "🔊 Listen"; btn.classList.remove("speaking"); }
  };

  speechSynthesis.speak(utterance);
}

function openGoogleTranslate(text) {
  const targetLang = panel?.querySelector("#ls-target-lang").value || settings.targetLang;
  const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`;
  window.open(url, "_blank");
}

function saveToHistory(original, translated, sourceLang, targetLang) {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];
    history.unshift({ original, translated, sourceLang, targetLang, time: Date.now() });
    if (history.length > 20) history.pop();
    chrome.storage.local.set({ history });
  });
}

function outsideClickHandler(e) {
  if (panel && !panel.contains(e.target)) {
    removePanel();
  }
}

function removePanel() {
  speechSynthesis.cancel();
  isSpeaking = false;
  if (panel) {
    panel.classList.remove("visible");
    setTimeout(() => { panel?.remove(); panel = null; }, 200);
  }
  document.removeEventListener("mousedown", outsideClickHandler);
  currentTranslation = "";
}

// Listen for context menu trigger from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "translateSelection") {
    showPanel(request.text, { left: 100, right: 100, top: 200, bottom: 220 });
  }
});

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}