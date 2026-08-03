// ReadNow Extension Popup Logic

document.addEventListener("DOMContentLoaded", async () => {
  let activeTab = null;
  let serverUrl = "http://localhost:3000";
  let collections = [];
  let articles = [];

  // Load configured Server URL
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(["serverUrl"], resolve);
  });
  if (settings.serverUrl) serverUrl = settings.serverUrl;

  // UI Element References
  const connectionStatusEl = document.getElementById("connection-status");
  const statusTextEl = document.getElementById("status-text");
  const pageTitleEl = document.getElementById("page-title");
  const pageUrlEl = document.getElementById("page-url");
  const collectionSelectEl = document.getElementById("collection-select");
  const customTagsEl = document.getElementById("custom-tags");
  const saveBtn = document.getElementById("btn-save-page");
  const quickSummarizeBtn = document.getElementById("btn-quick-summarize");
  const statusMsgEl = document.getElementById("save-status-msg");
  const openOptionsBtn = document.getElementById("btn-open-options");

  const tabBtns = document.querySelectorAll(".nav-tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  const aiQuestionInput = document.getElementById("ai-question-input");
  const sendAiBtn = document.getElementById("btn-send-ai");
  const aiAnswerContainer = document.getElementById("ai-answer-container");
  const aiAnswerText = document.getElementById("ai-answer-text");
  const copyAiBtn = document.getElementById("btn-copy-ai");
  const promptChips = document.querySelectorAll(".prompt-chip");

  const recentListEl = document.getElementById("recent-articles-list");
  const searchInputEl = document.getElementById("search-articles-input");
  const articleCountEl = document.getElementById("article-count");

  const offlineQueueBar = document.getElementById("offline-queue-bar");
  const offlineCountEl = document.getElementById("offline-count");
  const syncNowBtn = document.getElementById("btn-sync-now");

  // Tab Navigation Switching
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(btn.getAttribute("data-tab"));
      if (targetPane) targetPane.classList.add("active");

      if (btn.getAttribute("data-tab") === "tab-recent") {
        loadRecentArticles();
      }
    });
  });

  // Open Options Page
  openOptionsBtn.addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });

  // Get Active Tab details
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      activeTab = tabs[0];
      pageTitleEl.textContent = activeTab.title || "Untitled Webpage";
      pageUrlEl.textContent = activeTab.url || "";
    }
  } catch (e) {
    pageTitleEl.textContent = "Unable to read active tab";
  }

  // Check Server Connection
  checkServerConnection();
  loadCollections();
  checkOfflineQueue();

  async function checkServerConnection() {
    try {
      const res = await fetch(`${serverUrl}/api/settings`, { method: "GET" });
      if (res.ok) {
        connectionStatusEl.className = "status-pill status-online";
        statusTextEl.textContent = "Online";
      } else {
        throw new Error("Server returned status error");
      }
    } catch (e) {
      connectionStatusEl.className = "status-pill status-offline";
      statusTextEl.textContent = "Offline";
    }
  }

  // Fetch Collections from Server
  async function loadCollections() {
    try {
      const res = await fetch(`${serverUrl}/api/collections`);
      if (res.ok) {
        const data = await res.json();
        collections = data.collections || [];
        collectionSelectEl.innerHTML = `<option value="">General Reading Queue</option>`;
        collections.forEach((col) => {
          const opt = document.createElement("option");
          opt.value = col.id;
          opt.textContent = col.name;
          collectionSelectEl.appendChild(opt);
        });
      }
    } catch (e) {
      // Offline fallback
    }
  }

  // Save Article Button Handler
  saveBtn.addEventListener("click", async () => {
    if (!activeTab || !activeTab.url) return;

    showStatus("Saving article to ReadNow...", "info");
    saveBtn.disabled = true;

    const tags = customTagsEl.value ? customTagsEl.value.split(",").map((t) => t.trim()) : [];
    const collectionId = collectionSelectEl.value;

    try {
      const response = await fetch(`${serverUrl}/api/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeTab.url, tags, collectionId })
      });

      const data = await response.json();
      if (response.ok && data.article) {
        showStatus("✓ Article saved to ReadNow!", "success");
      } else {
        throw new Error(data.error || "Failed to parse page");
      }
    } catch (e) {
      // Save offline fallback
      chrome.storage.local.get(["offlineQueue"], (result) => {
        const queue = result.offlineQueue || [];
        queue.push({
          id: `off-${Date.now()}`,
          title: activeTab.title,
          url: activeTab.url,
          savedAt: new Date().toISOString(),
          mediaType: "web"
        });
        chrome.storage.local.set({ offlineQueue: queue }, () => {
          showStatus("⚠️ Server offline: Saved to local offline queue!", "warning");
          checkOfflineQueue();
        });
      });
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Instant AI Summary Button Handler
  quickSummarizeBtn.addEventListener("click", async () => {
    if (!activeTab || !activeTab.url) return;

    // Switch to AI tab & initiate prompt
    const aiTabBtn = document.querySelector('[data-tab="tab-ai"]');
    if (aiTabBtn) aiTabBtn.click();

    aiQuestionInput.value = `Provide a comprehensive AI summary and key takeaways for this web page: ${activeTab.url}`;
    executeAiPrompt();
  });

  // Prompt Chips Handler
  promptChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      aiQuestionInput.value = prompt;
      executeAiPrompt();
    });
  });

  // Send AI Question Button Handler
  sendAiBtn.addEventListener("click", executeAiPrompt);

  async function executeAiPrompt() {
    const question = aiQuestionInput.value.trim();
    if (!question) return;

    aiAnswerContainer.classList.remove("hidden");
    aiAnswerText.innerHTML = `<div class="loading-spinner">⚡ Querying Gemini AI...</div>`;
    sendAiBtn.disabled = true;

    try {
      const pageContext = activeTab ? `[Page Title: ${activeTab.title} | URL: ${activeTab.url}]\n\n` : "";
      const res = await fetch(`${serverUrl}/api/ai/workspace-ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: pageContext + question })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        aiAnswerText.innerHTML = formatMarkdown(data.answer);
      } else {
        throw new Error(data.error || "AI query failed");
      }
    } catch (e) {
      aiAnswerText.innerHTML = `<div style="color: #f87171;">❌ ${e.message}</div>`;
    } finally {
      sendAiBtn.disabled = false;
    }
  }

  // Copy AI response button
  copyAiBtn.addEventListener("click", () => {
    const text = aiAnswerText.innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyAiBtn.textContent = "Copied!";
      setTimeout(() => (copyAiBtn.textContent = "Copy"), 2000);
    });
  });

  // Load Recent Saved Articles
  async function loadRecentArticles() {
    recentListEl.innerHTML = `<div class="loading-spinner">Loading articles...</div>`;

    try {
      const res = await fetch(`${serverUrl}/api/articles`);
      if (res.ok) {
        const data = await res.json();
        articles = data.articles || [];
        articleCountEl.textContent = articles.length;
        renderArticlesList(articles);
      } else {
        throw new Error("Failed to fetch articles");
      }
    } catch (e) {
      recentListEl.innerHTML = `<div class="status-box error">Unable to load online articles. Check server connection.</div>`;
    }
  }

  function renderArticlesList(items) {
    if (items.length === 0) {
      recentListEl.innerHTML = `<div style="text-align: center; color: #64748b; padding: 20px;">No articles saved yet.</div>`;
      return;
    }

    recentListEl.innerHTML = "";
    items.slice(0, 20).forEach((art) => {
      const card = document.createElement("div");
      card.className = "article-card";

      const timeAgo = new Date(art.savedAt).toLocaleDateString();

      card.innerHTML = `
        <a href="${art.url}" target="_blank" class="article-card-title">${escapeHtml(art.title)}</a>
        <div class="article-card-meta">
          <span>${escapeHtml(art.siteName || "Web")}</span>
          <span>${timeAgo}</span>
        </div>
      `;

      recentListEl.appendChild(card);
    });
  }

  // Search Filter Handler
  searchInputEl.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = articles.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.siteName && a.siteName.toLowerCase().includes(q))
    );
    renderArticlesList(filtered);
  });

  // Check Offline Queue
  function checkOfflineQueue() {
    chrome.storage.local.get(["offlineQueue"], (result) => {
      const queue = result.offlineQueue || [];
      if (queue.length > 0) {
        offlineQueueBar.classList.remove("hidden");
        offlineCountEl.textContent = queue.length;
      } else {
        offlineQueueBar.classList.add("hidden");
      }
    });
  }

  // Sync Offline Queue Button
  syncNowBtn.addEventListener("click", () => {
    syncNowBtn.disabled = true;
    syncNowBtn.textContent = "Syncing...";

    chrome.runtime.sendMessage({ type: "SYNC_OFFLINE" }, (response) => {
      syncNowBtn.disabled = false;
      syncNowBtn.textContent = "Sync Now";
      checkOfflineQueue();
      loadRecentArticles();
    });
  });

  // Utility Functions
  function showStatus(text, type) {
    statusMsgEl.className = `status-box ${type}`;
    statusMsgEl.textContent = text;
    statusMsgEl.classList.remove("hidden");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/\n\n/g, "<br><br>");
    return html;
  }
});
