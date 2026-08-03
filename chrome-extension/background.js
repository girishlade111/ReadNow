// ReadNow Service Worker (Background Script) - Manifest V3

const DEFAULT_SERVER_URL = "http://localhost:3000";

// Initialize Extension Settings & Context Menus
chrome.runtime.onInstalled.addListener(() => {
  console.log("ReadNow Extension Installed");
  
  // Set default settings if not configured
  chrome.storage.sync.get(["serverUrl", "autoSync"], (data) => {
    if (!data.serverUrl) {
      chrome.storage.sync.set({ serverUrl: DEFAULT_SERVER_URL });
    }
    if (data.autoSync === undefined) {
      chrome.storage.sync.set({ autoSync: true });
    }
  });

  // Create Context Menus
  chrome.contextMenus.create({
    id: "readnow-save-page",
    title: "Save Page to ReadNow",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "readnow-save-selection",
    title: "Save Selection to ReadNow",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "readnow-ask-ai",
    title: "Ask ReadNow AI about Selection",
    contexts: ["selection"]
  });
});

// Get configured ReadNow Server URL
async function getServerUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["serverUrl"], (result) => {
      resolve(result.serverUrl || DEFAULT_SERVER_URL);
    });
  });
}

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const serverUrl = await getServerUrl();

  if (info.menuItemId === "readnow-save-page" && tab?.url) {
    savePageToReadNow(tab.url, tab.title, tab.id, serverUrl);
  } else if (info.menuItemId === "readnow-save-selection" && info.selectionText) {
    saveSelectionToReadNow(info.selectionText, tab?.title, tab?.url, tab?.id, serverUrl);
  } else if (info.menuItemId === "readnow-ask-ai" && info.selectionText) {
    askAiAboutSelection(info.selectionText, tab?.title, tab?.id, serverUrl);
  }
});

// Helper: Save whole page to ReadNow
async function savePageToReadNow(url, title, tabId, serverUrl) {
  try {
    updateBadge("...", "#2563EB");
    const response = await fetch(`${serverUrl}/api/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      updateBadge("✓", "#10B981");
      notifyTab(tabId, { type: "SHOW_TOAST", message: "Article saved to ReadNow!", status: "success" });
    } else {
      throw new Error(data.error || "Failed to parse page");
    }
  } catch (err) {
    console.warn("Server parse failed, fallback to offline local save:", err);
    saveOffline({ url, title, savedAt: new Date().toISOString(), mediaType: "web" });
    updateBadge("OFF", "#F59E0B");
    notifyTab(tabId, { type: "SHOW_TOAST", message: "Saved to Offline ReadNow Queue", status: "warning" });
  } finally {
    setTimeout(() => clearBadge(), 3000);
  }
}

// Helper: Save selection to ReadNow
async function saveSelectionToReadNow(text, pageTitle, pageUrl, tabId, serverUrl) {
  try {
    updateBadge("...", "#2563EB");
    const response = await fetch(`${serverUrl}/api/quick-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pageTitle ? `Excerpt: ${pageTitle}` : "Selected Text Excerpt",
        content: text,
        url: pageUrl || "https://readnow.internal/selection",
        mediaType: "text"
      })
    });

    const data = await response.json();
    if (response.ok && data.article) {
      updateBadge("✓", "#10B981");
      notifyTab(tabId, { type: "SHOW_TOAST", message: "Selection saved to ReadNow!", status: "success" });
    } else {
      throw new Error(data.error || "Failed to save selection");
    }
  } catch (err) {
    console.warn("Server quick-save failed, queuing locally:", err);
    saveOffline({ title: `Excerpt: ${pageTitle || 'Selection'}`, content: text, url: pageUrl, savedAt: new Date().toISOString(), mediaType: "text" });
    updateBadge("OFF", "#F59E0B");
    notifyTab(tabId, { type: "SHOW_TOAST", message: "Selection saved to Offline Queue", status: "warning" });
  } finally {
    setTimeout(() => clearBadge(), 3000);
  }
}

// Helper: Ask AI about selected text
async function askAiAboutSelection(selectionText, pageTitle, tabId, serverUrl) {
  try {
    notifyTab(tabId, {
      type: "OPEN_AI_OVERLAY",
      question: `Explain this excerpt: "${selectionText.slice(0, 100)}..."`,
      loading: true
    });

    // First save temporary snippet or query workspace AI
    const response = await fetch(`${serverUrl}/api/ai/workspace-ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `Analyze and explain the following text snippet from "${pageTitle || 'webpage'}":\n\n"${selectionText}"` })
    });

    const data = await response.json();
    notifyTab(tabId, {
      type: "UPDATE_AI_OVERLAY",
      answer: data.answer || "No AI explanation available.",
      sources: data.sources || []
    });
  } catch (err) {
    notifyTab(tabId, {
      type: "UPDATE_AI_OVERLAY",
      error: `Could not connect to ReadNow AI Server: ${err.message}`
    });
  }
}

// Save item to chrome local storage offline queue
function saveOffline(articleData) {
  chrome.storage.local.get(["offlineQueue"], (result) => {
    const queue = result.offlineQueue || [];
    queue.push({ id: `off-${Date.now()}`, ...articleData });
    chrome.storage.local.set({ offlineQueue: queue });
  });
}

// Message Listener for Communication from Content Script & Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    const serverUrl = await getServerUrl();

    if (request.type === "PARSE_URL") {
      try {
        const res = await fetch(`${serverUrl}/api/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: request.url })
        });
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        sendResponse({ error: err.message });
      }
    } else if (request.type === "QUICK_SAVE") {
      try {
        const res = await fetch(`${serverUrl}/api/quick-save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.doc)
        });
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        sendResponse({ error: err.message });
      }
    } else if (request.type === "ASK_AI") {
      try {
        const res = await fetch(`${serverUrl}/api/ai/workspace-ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: request.query })
        });
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        sendResponse({ error: err.message });
      }
    } else if (request.type === "SYNC_OFFLINE") {
      syncOfflineQueue(serverUrl).then(sendResponse);
    }
  })();
  return true; // Keep message channel open for async responses
});

// Offline Queue Auto-Sync Function
async function syncOfflineQueue(serverUrl) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["offlineQueue"], async (result) => {
      const queue = result.offlineQueue || [];
      if (queue.length === 0) return resolve({ synced: 0, total: 0 });

      let syncedCount = 0;
      const remaining = [];

      for (const item of queue) {
        try {
          const endpoint = item.url && item.url.startsWith("http") ? `${serverUrl}/api/parse` : `${serverUrl}/api/quick-save`;
          const payload = endpoint.includes("parse") ? { url: item.url } : item;

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            syncedCount++;
          } else {
            remaining.push(item);
          }
        } catch (e) {
          remaining.push(item);
        }
      }

      chrome.storage.local.set({ offlineQueue: remaining });
      resolve({ synced: syncedCount, remaining: remaining.length });
    });
  });
}

// Utility: Update Extension Action Badge
function updateBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
}

// Utility: Send message to specific tab
function notifyTab(tabId, message) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message).catch(() => {
      // Tab might not have content script loaded
    });
  }
}
