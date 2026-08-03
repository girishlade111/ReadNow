// ReadNow Extension Options Script

document.addEventListener("DOMContentLoaded", () => {
  const serverUrlInput = document.getElementById("server-url");
  const saveBtn = document.getElementById("btn-save-settings");
  const testBtn = document.getElementById("btn-test-connection");
  const testResultEl = document.getElementById("test-result");

  const autoSyncChk = document.getElementById("chk-auto-sync");
  const floatingTbChk = document.getElementById("chk-floating-tb");
  const dlpMaskChk = document.getElementById("chk-dlp-mask");

  const clearQueueBtn = document.getElementById("btn-clear-queue");
  const queueStatusText = document.getElementById("queue-status-text");

  // Load Saved Options
  chrome.storage.sync.get(["serverUrl", "autoSync", "floatingTb", "dlpMask"], (data) => {
    if (data.serverUrl) serverUrlInput.value = data.serverUrl;
    if (data.autoSync !== undefined) autoSyncChk.checked = data.autoSync;
    if (data.floatingTb !== undefined) floatingTbChk.checked = data.floatingTb;
    if (data.dlpMask !== undefined) dlpMaskChk.checked = data.dlpMask;
  });

  updateQueueCount();

  // Save Settings
  saveBtn.addEventListener("click", () => {
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");
    const autoSync = autoSyncChk.checked;
    const floatingTb = floatingTbChk.checked;
    const dlpMask = dlpMaskChk.checked;

    chrome.storage.sync.set({ serverUrl, autoSync, floatingTb, dlpMask }, () => {
      showTestResult("✓ Settings saved successfully!", true);
    });
  });

  // Test Connection
  testBtn.addEventListener("click", async () => {
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");
    showTestResult("Testing connection to " + serverUrl + "...", null);

    try {
      const res = await fetch(`${serverUrl}/api/settings`, { method: "GET" });
      if (res.ok) {
        showTestResult("✓ Connected to ReadNow Server! Status: OK", true);
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (e) {
      showTestResult(`❌ Connection Failed: ${e.message}. Is ReadNow running on ${serverUrl}?`, false);
    }
  });

  // Clear Offline Queue
  clearQueueBtn.addEventListener("click", () => {
    chrome.storage.local.set({ offlineQueue: [] }, () => {
      updateQueueCount();
      queueStatusText.textContent = "Offline queue cleared.";
    });
  });

  function updateQueueCount() {
    chrome.storage.local.get(["offlineQueue"], (result) => {
      const count = (result.offlineQueue || []).length;
      queueStatusText.textContent = `Current offline queue items: ${count}`;
    });
  }

  function showTestResult(msg, isSuccess) {
    testResultEl.style.display = "block";
    testResultEl.textContent = msg;
    if (isSuccess === true) {
      testResultEl.className = "success";
    } else if (isSuccess === false) {
      testResultEl.className = "error";
    } else {
      testResultEl.className = "";
    }
  }
});
