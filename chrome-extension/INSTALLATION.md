# Installation Guide: ReadNow Chrome Extension

Follow this simple guide to install and load the **ReadNow Chrome Extension** into Google Chrome, Brave, Microsoft Edge, or Arc browser.

---

## 🛠️ Step-by-Step Installation

### Step 1: Ensure ReadNow Web App is Running
Before using the extension, start your local ReadNow server:
```bash
npm run dev
```
Verify that the ReadNow application is active at `http://localhost:3000`.

---

### Step 2: Open Browser Extensions Page
Open your browser and navigate to the Extensions page:
- **Google Chrome**: Go to `chrome://extensions/`
- **Brave Browser**: Go to `brave://extensions/`
- **Microsoft Edge**: Go to `edge://extensions/`

---

### Step 3: Enable Developer Mode
In the top-right corner of the Extensions page, toggle **Developer mode** to **ON**.

```
+-------------------------------------------------------------+
| Extensions                       [Developer mode  (ON /)]   |
+-------------------------------------------------------------+
```

---

### Step 4: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left header.
2. In the file picker dialog, navigate to your ReadNow project directory and select the `chrome-extension` folder:
   ```
   c:\Users\Girish Lade\OneDrive\Desktop\ReadNow\chrome-extension
   ```
3. Click **Select Folder**.

---

### Step 5: Pin the ReadNow Extension
1. Click the **Extensions puzzle piece icon** (🧩) on your browser toolbar.
2. Find **ReadNow - Smart Web Ingestion & AI Reader**.
3. Click the **Pin icon** (📌) to keep ReadNow accessible next to your address bar.

---

## 🧪 Verification

1. Click the **ReadNow icon** in your toolbar.
2. Verify that the status indicator says **Online** (Green dot).
3. Open any web article (e.g. Wikipedia or tech news article).
4. Click **Save Article to ReadNow**.
5. Check your ReadNow web application at `http://localhost:3000` to confirm the article has been ingested!

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **Status says "Offline"** | ReadNow server is not running on port 3000 | Run `npm run dev` in `ReadNow` root folder. |
| **"Could not parse URL" error** | Restricted browser page (e.g. `chrome://`) | Extension cannot parse internal browser settings pages. Use on standard web pages. |
| **Changes to extension code not updating** | Browser cached old files | Go to `chrome://extensions` and click the **Reload (🔄)** icon on ReadNow card. |
