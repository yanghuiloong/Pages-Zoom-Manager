// === 全局缓存 ===
let cachedRules = [];

// === 1. 初始化与监听数据变化 ===

// 从存储加载规则
function loadRules() {
  chrome.storage.sync.get(['zoomRules'], (result) => {
    cachedRules = result.zoomRules || [];
    // 按长度排序 (长路径优先)
    cachedRules.sort((a, b) => b.url.length - a.url.length);
    console.log("【ZoomManager】规则库已更新:", cachedRules);
  });
}

// 启动时加载
loadRules();

// ★Core Improvement★: Auto-listen for storage changes
// Whenever popup.js saves data, this will trigger automatically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.zoomRules) {
    // Get the NEW rules directly from the change event (not from async loadRules)
    const newRules = changes.zoomRules.newValue || [];

    // Update cache immediately
    cachedRules = newRules;
    cachedRules.sort((a, b) => b.url.length - a.url.length);
    console.log("【ZoomManager】规则库已更新:", cachedRules);

    // Apply zoom to current active tab using the NEW rules
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        // Use updated cachedRules to find the matching zoom
        const target = matchUrlToZoom(tabs[0].url);
        if (target !== null) {
          applyZoomSafe(tabs[0].id, target);
        }
      }
    });
  }
});

// === 2. 核心缩放功能 ===

function matchUrlToZoom(url) {
  if (!url || !cachedRules.length) return null;
  for (const rule of cachedRules) {
    if (url.includes(rule.url)) {
      return parseFloat(rule.zoom);
    }
  }
  return null;
}

function applyZoomSafe(tabId, targetZoom) {
  // 设置模式：自动 + 单标签页隔离
  chrome.tabs.setZoomSettings(tabId, {
    mode: 'automatic',
    scope: 'per-tab'
  }, () => {
    if (chrome.runtime.lastError) return;

    chrome.tabs.getZoom(tabId, (currentZoom) => {
      if (chrome.runtime.lastError) return;
      // 只有偏差大于 0.001 时才应用
      if (Math.abs(currentZoom - targetZoom) > 0.001) {
        console.log(`【ZoomManager】应用缩放: ${targetZoom} (Tab: ${tabId})`);
        chrome.tabs.setZoom(tabId, targetZoom);
      }
    });
  });
}

// === 3. 事件监听 ===

// 页面跳转/加载
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'loading') {
    const targetZoom = matchUrlToZoom(tab.url);
    if (targetZoom !== null) {
      applyZoomSafe(tabId, targetZoom);
    }
  }
});

// 标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const targetZoom = matchUrlToZoom(tab.url);
      if (targetZoom !== null) {
        applyZoomSafe(activeInfo.tabId, targetZoom);
      }
    }
  } catch (err) {
    // ignore
  }
});