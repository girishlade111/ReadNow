# ReadNow Chrome Extension (Manifest V3)

The **ReadNow Chrome Extension** brings enterprise-grade web article saving, in-page text selection highlighting, offline sync, and real-time Gemini AI assistance directly into your Chrome browser.

---

## 🌟 Key Features

1. **One-Click Web Ingestion**:
   - Save any article or web page directly to ReadNow with automatic Readability parsing, clean markdown/HTML extraction, and AI categorization.

2. **In-Page Floating Selection Toolbar**:
   - Highlight text on any website to see a floating toolbar:
     - **Save to ReadNow**: Instantly store the text snippet as an excerpt.
     - **Ask AI**: Instantly query ReadNow AI Copilot to explain or summarize the selection without leaving the page.

3. **Right-Click Context Menu Integration**:
   - Right-click on any web page or selected text:
     - *Save Page to ReadNow*
     - *Save Selection to ReadNow*
     - *Ask ReadNow AI about Selection*

4. **In-Popup Gemini AI Copilot**:
   - Click the extension icon to access a full AI Copilot assistant with preset chips:
     - ⚡ *3-Bullet Summary*
     - 💡 *Actionable Insights*
     - 🎓 *Explain Concepts*

5. **Saved Articles Library & Search**:
   - Search and browse your saved ReadNow library directly from the extension popup.
   - Jump directly to articles in the ReadNow Web Application (`http://localhost:3000`).

6. **Offline Queue & Automatic Background Sync**:
   - If the ReadNow server is temporarily offline, articles and excerpts are saved locally in `chrome.storage.local`.
   - When the server comes back online, the extension automatically syncs queued items.

---

## 📁 Extension File Structure

```
chrome-extension/
├── manifest.json            # Manifest V3 Extension configuration
├── background.js            # Background service worker (context menus, API proxy, sync)
├── content.js               # Content script for in-page selection toolbar & AI overlay
├── content.css              # Styling for in-page selection toolbar and toast alerts
├── popup.html               # Popup HTML layout
├── popup.css                # Modern glassmorphism dark theme styling
├── popup.js                 # Extension popup interactivity & API handlers
├── options.html             # Options page layout
├── options.js               # Extension preferences script (Server URL, DLP, Sync)
├── icons/                   # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate-icons.cjs       # PNG icon generator utility
├── README.md                # Technical overview and documentation
├── INSTALLATION.md          # Step-by-step browser installation guide
└── USER_GUIDE.md            # Comprehensive user handbook
```

---

## 🔌 API Endpoints Integrated

| Endpoint | Method | Description |
|---|---|---|
| `/api/parse` | `POST` | Fetches & parses webpage URL with Readability + Gemini AI analysis |
| `/api/quick-save` | `POST` | Quick saves text excerpts or selections |
| `/api/articles` | `GET` | Fetches recently saved library items |
| `/api/collections` | `GET` | Fetches team collections |
| `/api/ai/workspace-ask` | `POST` | Queries Gemini AI Copilot & Workspace RAG |
| `/api/settings` | `GET` | Verifies server connectivity and enterprise DLP settings |

---

## ⚙️ Configuration Options

Open extension options by clicking the gear icon in the extension popup or visiting `chrome://extensions`.

- **Server Endpoint**: Default is `http://localhost:3000`.
- **Automatic Offline Sync**: Toggles background auto-upload when reconnected.
- **Floating Selection Toolbar**: Enables/disables the in-page selection toolbar.
- **Enterprise DLP PII Protection**: Masks sensitive data locally before ingestion.

---

## 📘 Further Documentation

- [INSTALLATION.md](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/ReadNow/chrome-extension/INSTALLATION.md): Guide to loading unpacked extension into Chrome/Brave/Edge.
- [USER_GUIDE.md](file:///c:/Users/Girish%20Lade/OneDrive/Desktop/ReadNow/chrome-extension/USER_GUIDE.md): Feature manual and usage tips.
