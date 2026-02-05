window.onload = function () {
  // Page loaded, render the rule list immediately
  renderList();

  // Bind click event for add button
  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addRule);
  }

  // Allow pressing Enter to add rule in input fields
  const urlInput = document.getElementById('urlInput');
  const zoomInput = document.getElementById('zoomInput');

  [urlInput, zoomInput].forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addRule();
        }
      });
    }
  });
};

// Render the rule list
function renderList() {
  chrome.storage.sync.get(['zoomRules'], (result) => {
    // Check for errors
    if (chrome.runtime.lastError) {
      console.error("Read error:", chrome.runtime.lastError);
      const list = document.getElementById('ruleList');
      list.innerHTML = '<div class="empty-state">读取设置失败，请刷新扩展</div>';
      return;
    }

    const rules = result.zoomRules || [];
    rules.sort((a, b) => b.url.length - a.url.length); // Longer URLs first

    const list = document.getElementById('ruleList');
    list.innerHTML = '';

    if (rules.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无缩放规则<br>添加网址开始使用</div>';
      return;
    }

    rules.forEach((r) => {
      const li = document.createElement('li');

      li.innerHTML = `
        <div class="rule-info">
          <span class="rule-url" title="${r.url}">${r.url}</span>
        </div>
        <input type="number" class="rule-zoom-input" 
               data-url="${r.url}" 
               value="${r.zoom}" 
               step="0.01" 
               min="0.1" 
               max="5"
               title="修改缩放率后按 Enter 或点击保存">
        <div class="rule-actions">
          <button class="btn-save save-btn" data-url="${r.url}" title="保存并应用">✓</button>
          <button class="btn-danger del-btn" data-url="${r.url}" title="删除规则">✕</button>
        </div>
      `;
      list.appendChild(li);
    });

    // Bind delete button events
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteRule(e.target.getAttribute('data-url'));
      });
    });

    // Bind save button events
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        const input = document.querySelector(`.rule-zoom-input[data-url="${url}"]`);
        if (input) {
          updateZoom(url, parseFloat(input.value));
        }
      });
    });

    // Bind Enter key on zoom inputs to save
    document.querySelectorAll('.rule-zoom-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const url = input.getAttribute('data-url');
          updateZoom(url, parseFloat(input.value));
        }
      });

      // Visual feedback on change
      input.addEventListener('input', () => {
        input.style.borderColor = '#22c55e';
      });

      input.addEventListener('blur', () => {
        input.style.borderColor = '';
      });
    });
  });
}

// Add a new rule
function addRule() {
  const urlInput = document.getElementById('urlInput');
  const zoomInput = document.getElementById('zoomInput');

  const urlVal = urlInput.value.trim();
  const zoomVal = parseFloat(zoomInput.value);

  // Basic validation
  if (!urlVal || isNaN(zoomVal)) {
    showToast("❌ 请输入有效的网址和数字！", "error");
    return;
  }

  if (zoomVal < 0.1 || zoomVal > 5) {
    showToast("❌ 缩放率范围: 0.1 ~ 5", "error");
    return;
  }

  chrome.storage.sync.get(['zoomRules'], (result) => {
    let rules = result.zoomRules || [];

    // Remove duplicate if exists
    const exists = rules.some(r => r.url === urlVal);
    rules = rules.filter(r => r.url !== urlVal);

    // Add new rule
    rules.push({ url: urlVal, zoom: zoomVal });

    // Save and apply immediately
    chrome.storage.sync.set({ zoomRules: rules }, () => {
      if (chrome.runtime.lastError) {
        showToast("❌ 保存失败: " + chrome.runtime.lastError.message, "error");
      } else {
        showToast(exists ? "✅ 已更新规则" : "✅ 已添加规则", "success");
        urlInput.value = '';
        zoomInput.value = '';
        renderList();
        // Apply zoom to matching tabs immediately
        applyZoomToMatchingTabs(urlVal, zoomVal);
      }
    });
  });
}

// Update zoom for an existing rule
function updateZoom(url, newZoom) {
  if (isNaN(newZoom)) {
    showToast("❌ 请输入有效的数字！", "error");
    return;
  }

  if (newZoom < 0.1 || newZoom > 5) {
    showToast("❌ 缩放率范围: 0.1 ~ 5", "error");
    return;
  }

  chrome.storage.sync.get(['zoomRules'], (result) => {
    let rules = result.zoomRules || [];

    // Find and update the rule
    const ruleIndex = rules.findIndex(r => r.url === url);
    if (ruleIndex !== -1) {
      rules[ruleIndex].zoom = newZoom;

      chrome.storage.sync.set({ zoomRules: rules }, () => {
        if (chrome.runtime.lastError) {
          showToast("❌ 保存失败: " + chrome.runtime.lastError.message, "error");
        } else {
          showToast("✅ 缩放率已更新并应用", "success");
          renderList();
          // Apply zoom to matching tabs immediately
          applyZoomToMatchingTabs(url, newZoom);
        }
      });
    }
  });
}

// Apply zoom to all tabs that match the URL pattern
function applyZoomToMatchingTabs(urlPattern, zoomLevel) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes(urlPattern)) {
        chrome.tabs.setZoom(tab.id, zoomLevel, () => {
          if (chrome.runtime.lastError) {
            console.log("Could not set zoom for tab:", tab.id, chrome.runtime.lastError.message);
          } else {
            console.log(`Applied zoom ${zoomLevel} to tab: ${tab.url}`);
          }
        });
      }
    });
  });
}

// Delete a rule
function deleteRule(urlToDelete) {
  chrome.storage.sync.get(['zoomRules'], (result) => {
    let rules = result.zoomRules || [];
    rules = rules.filter(r => r.url !== urlToDelete);

    chrome.storage.sync.set({ zoomRules: rules }, () => {
      showToast("🗑️ 已删除规则", "info");
      renderList();
    });
  });
}

// Simple toast notification
function showToast(message, type = "info") {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  const colors = {
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #2196F3, #1976d2)'
  };

  toast.style.cssText = `
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.info};
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    animation: toastIn 0.3s ease;
  `;

  // Add animation keyframes if not exists
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove after 2 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}