# LinguaSnap — Instant Text Translator Extension 


- **Select & Translate** — Highlight any text, click the floating button, done
- **45+ Languages** — English, Spanish, French, Chinese, Arabic, Hindi, and many more
- **Auto Language Detection** — No need to specify the source language
- **Text-to-Speech** — Listen to the translation out loud
- **Copy in One Click** — Instantly copy translated text to clipboard
- **Open in Google Translate** — Jump to full context when needed
- **Swap Languages** — Flip source ↔ target with one click
- **Translation History** — Last 20 translations saved locally
- **Right-click Menu** — Translate via context menu without clicking toolbar
- **Popup Translator** — Type or paste any text directly in the extension popup
- **Draggable Panel** — Drag the translation window anywhere on the page
- **Fully Free** — Uses the MyMemory public API, no key or signup required

---

## How It Looks

```
┌──────────────────────────────────────┐
│  LINGUASNAP               ⠿   ✕  │
├──────────────────────────────────────┤
│  [ Auto Detect ▾ ]  ⇄  [ Spanish ▾ ]│
├──────────────────────────────────────┤
│  ORIGINAL                            │
│  Hello, how are you?                 │
├──────────────────────────────────────┤
│  TRANSLATION                         │
│  Hola, ¿cómo estás?                  │
├──────────────────────────────────────┤
│  📋 Copy   🔊 Listen   🔗 Full       │
└──────────────────────────────────────┘
```

---

##  Installation (Developer Mode)

> LinguaSnap is not yet on the Chrome Web Store. Install it manually in under 60 seconds.

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/linguasnap.git
   ```

2. **Open Chrome** and go to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** — toggle it on in the top-right corner

4. **Click "Load unpacked"** and select the `linguasnap` folder

5. **Done!** The  icon will appear in your toolbar

---

##  How to Use

### Method 1 — Select & Translate *(easiest)*
1. Highlight any text on any webpage
2. Click the green **Translate** button that appears above the selection
3. The translation panel opens instantly — drag it anywhere on the page

### Method 2 — Right-click Menu
1. Select text on any webpage
2. Right-click → **" Translate with LinguaSnap"**

### Method 3 — Extension Popup
1. Click the LinguaSnap icon in your Chrome toolbar
2. Type or paste text, choose your target language
3. Press **TRANSLATE** or hit `Ctrl + Enter`

---

##  Project Structure

```
linguasnap/
├── manifest.json        # Extension configuration (Manifest V3)
├── background.js        # Service worker — handles translation API calls
├── content.js           # Content script — floating panel & selection logic
├── content.css          # Styles for the floating translation panel
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic — translate, history, settings
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

##  Supported Languages

| | | | |
|---|---|---|---|
| English | Spanish | French | German |
| Italian | Portuguese | Russian | Chinese |
| Japanese | Korean | Arabic | Hindi |
| Bengali | Turkish | Dutch | Polish |
| Swedish | Danish | Finnish | Norwegian |
| Greek | Hebrew | Indonesian | Malay |
| Thai | Vietnamese | Ukrainian | Czech |
| Slovak | Hungarian | Romanian | Bulgarian |
| Croatian | Serbian | Catalan | Lithuanian |
| Latvian | Estonian | Slovenian | Persian |
| Urdu | Tamil | Telugu | Marathi |
| Malayalam | Swahili | Afrikaans | |

---

##  Settings

Open the popup → click the **SETTINGS** tab:

| Setting | Description |
|---|---|
| **Show on text select** | Toggle the floating translate button on/off |
| **Auto detect source** | Automatically detect what language you're reading |
| **Default target language** | Your preferred translation language |

---

##  API

LinguaSnap uses the **[MyMemory](https://mymemory.translated.net/) free public API**.

- ✅ No API key required
- ✅ No account or signup
- ✅ 1,000 requests/day **per user IP** — so each person who installs this extension gets their own independent quota
- ✅ Safe to distribute publicly — your usage does not accumulate

If you need higher limits, MyMemory supports optional registration for 10,000 req/day.

---
##  Privacy

LinguaSnap does **not**:
- Collect or store any personal data
- Send data to any server except the MyMemory translation API
- Track your browsing history
- Require any login or account

Translation history is stored **locally** in your browser (`chrome.storage.local`) and never leaves your device.

---

##  Contributing

Contributions are welcome! Feel free to:

-  Report bugs via [Issues](../../issues)
-  Suggest features via [Issues](../../issues)
-  Submit a [Pull Request](../../pulls)

### Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/linguasnap.git
cd linguasnap
# Load unpacked in chrome://extensions/ as described above
# Edit files and click the refresh icon in chrome://extensions/ to reload
```

---

##  Roadmap

- [ ] Publish to Chrome Web Store
- [ ] Firefox / Edge support
- [ ] DeepL API option for higher quality translations
- [ ] Keyboard shortcut to trigger translation
- [ ] Highlight-in-place (replace selected text with translation)
- [ ] Offline mode for common language pairs

---

##  Acknowledgements

- [MyMemory](https://mymemory.translated.net/) for the free translation API
- [Google Fonts](https://fonts.google.com/) — Syne & DM Mono typefaces

---

Made with ❤️ — if this helped you, consider giving it a ⭐
