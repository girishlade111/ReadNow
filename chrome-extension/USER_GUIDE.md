# ReadNow Chrome Extension - User Guide

Welcome to **ReadNow Chrome Extension**! This guide details how to use all extension features to supercharge your web research and reading workflow.

---

## 📖 Feature Manual

### 1. One-Click Page Save
- Open any web page or article you want to read or save for later.
- Click the **ReadNow icon** in your extension toolbar.
- Choose a **Target Collection** or add custom tags if desired.
- Click **Save Article to ReadNow**.
- ReadNow extracts the clean article content, removes clutter/ads, generates a Gemini AI summary, and stores it in your library.

---

### 2. In-Page Selection Toolbar
- Highlight any paragraph or sentence on any website.
- A floating toolbar will instantly appear above your text selection:
  - **Save to ReadNow**: Ingests only the selected excerpt.
  - **Ask AI**: Opens an instant AI popup overlay analyzing the excerpt.

---

### 3. Context Menu Shortcuts
- **Right-Click anywhere on a page**: Select *Save Page to ReadNow*.
- **Right-Click on selected text**: Select *Save Selection to ReadNow* or *Ask ReadNow AI about Selection*.

---

### 4. Extension Popup AI Copilot
- Click the extension icon and select the **AI Copilot** tab.
- Click any preset prompt chip:
  - ⚡ *3-Bullet Summary*
  - 💡 *Actionable Insights*
  - 🎓 *Explain Concepts*
- Or type any custom question about the active webpage or workspace knowledge base.
- Copy the answer with one click!

---

### 5. Saved Articles Library
- Open the extension popup and click **Saved**.
- Search and filter all previously saved articles.
- Click any article title to view the source, or open the ReadNow web app to start reading with audio TTS or speed reading mode.

---

### 6. Offline Support & Automatic Sync
- Working offline or on a plane? No problem!
- Articles and selections saved while offline are queued locally in your browser (`chrome.storage.local`).
- The yellow footer bar indicates pending offline items.
- As soon as your ReadNow server is reachable, click **Sync Now** or let background auto-sync handle it automatically.

---

## 🔒 Data Privacy & Security

- ReadNow processes articles locally through your own ReadNow server (`http://localhost:3000`).
- Optional Enterprise DLP PII protection automatically sanitizes sensitive personal data (emails, phone numbers, SSNs) before uploading snippets to AI models.
