// ReadNow Content Script - Selection Toolbar & AI Overlay UI

(function () {
  if (window.__readnow_content_script_injected) return;
  window.__readnow_content_script_injected = true;

  let selectionToolbar = null;

  // Create Toast Container
  function createToastContainer() {
    let container = document.getElementById("readnow-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "readnow-toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  // Display Toast Notification
  function showToast(message, type = "success") {
    const container = createToastContainer();
    const toast = document.createElement("div");
    toast.className = `readnow-toast readnow-toast-${type}`;

    const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : "ℹ️";
    toast.innerHTML = `
      <span class="readnow-toast-icon">${icon}</span>
      <span class="readnow-toast-text">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("readnow-toast-show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("readnow-toast-show");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SHOW_TOAST") {
      showToast(request.message, request.status || "success");
    } else if (request.type === "OPEN_AI_OVERLAY") {
      renderAiOverlay(request.question, request.loading);
    } else if (request.type === "UPDATE_AI_OVERLAY") {
      updateAiOverlay(request.answer, request.sources, request.error);
    } else if (request.type === "EXTRACT_PAGE") {
      sendResponse({
        title: document.title,
        url: window.location.href,
        textContent: document.body.innerText.slice(0, 10000)
      });
    }
  });

  // Handle Text Selection Toolbar
  document.addEventListener("mouseup", (e) => {
    // Ignore clicks inside ReadNow UI elements
    if (e.target.closest("#readnow-selection-toolbar") || e.target.closest("#readnow-ai-overlay") || e.target.closest("#readnow-toast-container")) {
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (text.length > 5) {
        showSelectionToolbar(selection);
      } else {
        removeSelectionToolbar();
      }
    }, 10);
  });

  function showSelectionToolbar(selection) {
    removeSelectionToolbar();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    selectionToolbar = document.createElement("div");
    selectionToolbar.id = "readnow-selection-toolbar";
    selectionToolbar.innerHTML = `
      <button id="readnow-btn-save-sel" title="Save excerpt to ReadNow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        Save to ReadNow
      </button>
      <div class="readnow-tb-divider"></div>
      <button id="readnow-btn-ask-ai" title="Ask AI about this excerpt">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
        Ask AI
      </button>
    `;

    const top = window.scrollY + rect.top - 42;
    const left = window.scrollX + rect.left + (rect.width / 2) - 100;

    selectionToolbar.style.top = `${Math.max(10, top)}px`;
    selectionToolbar.style.left = `${Math.max(10, left)}px`;

    document.body.appendChild(selectionToolbar);

    const selectedText = selection.toString().trim();

    document.getElementById("readnow-btn-save-sel").addEventListener("click", () => {
      chrome.runtime.sendMessage({
        type: "QUICK_SAVE",
        doc: {
          title: `Excerpt: ${document.title}`,
          content: selectedText,
          url: window.location.href,
          mediaType: "text"
        }
      }, (response) => {
        removeSelectionToolbar();
        if (response && response.article) {
          showToast("Excerpt saved to ReadNow!", "success");
        } else {
          showToast(response?.error || "Saved excerpt offline", "warning");
        }
      });
    });

    document.getElementById("readnow-btn-ask-ai").addEventListener("click", () => {
      removeSelectionToolbar();
      renderAiOverlay(`Explain this excerpt: "${selectedText.slice(0, 80)}..."`, true);

      chrome.runtime.sendMessage({
        type: "ASK_AI",
        query: `Analyze and explain the following text excerpt from standard page "${document.title}":\n\n"${selectedText}"`
      }, (response) => {
        if (response && response.answer) {
          updateAiOverlay(response.answer, response.sources);
        } else {
          updateAiOverlay(null, null, response?.error || "Unable to reach ReadNow AI Server");
        }
      });
    });
  }

  function removeSelectionToolbar() {
    if (selectionToolbar) {
      selectionToolbar.remove();
      selectionToolbar = null;
    }
  }

  // Floating AI Overlay Modal
  function renderAiOverlay(question, loading) {
    let overlay = document.getElementById("readnow-ai-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "readnow-ai-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="readnow-overlay-header">
        <div class="readnow-overlay-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
          ReadNow AI Copilot
        </div>
        <button id="readnow-overlay-close">&times;</button>
      </div>
      <div class="readnow-overlay-question">${escapeHtml(question)}</div>
      <div class="readnow-overlay-body">
        ${loading ? `<div class="readnow-spinner"></div> Analyzing with Gemini AI...` : ``}
      </div>
    `;

    document.getElementById("readnow-overlay-close").addEventListener("click", () => {
      overlay.remove();
    });
  }

  function updateAiOverlay(answer, sources = [], error = null) {
    const overlay = document.getElementById("readnow-ai-overlay");
    if (!overlay) return;

    const body = overlay.querySelector(".readnow-overlay-body");
    if (error) {
      body.innerHTML = `<div class="readnow-overlay-error">❌ ${escapeHtml(error)}</div>`;
      return;
    }

    let html = `<div class="readnow-overlay-answer">${formatMarkdown(answer)}</div>`;
    if (sources && sources.length > 0) {
      html += `
        <div class="readnow-overlay-sources">
          <strong>Related Workspace Knowledge:</strong>
          <ul>
            ${sources.map(s => `<li><a href="${s.url}" target="_blank">${escapeHtml(s.title)}</a></li>`).join("")}
          </ul>
        </div>
      `;
    }

    body.innerHTML = html;
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Simple Markdown formatting
  function formatMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/\n\n/g, "<br><br>");
    return html;
  }
})();
