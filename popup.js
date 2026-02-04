window.onload = function() {
  // 页面加载完成后立即读取列表
  renderList();

  // 绑定点击事件
  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addRule);
  }
};

// 渲染列表
function renderList() {
  chrome.storage.sync.get(['zoomRules'], (result) => {
    // 检查是否有错误
    if (chrome.runtime.lastError) {
      console.error("读取错误:", chrome.runtime.lastError);
      document.body.innerHTML += `<div style="color:red">读取设置失败，请刷新扩展</div>`;
      return;
    }

    const rules = result.zoomRules || [];
    rules.sort((a, b) => b.url.length - a.url.length); // 长网址优先

    const list = document.getElementById('ruleList');
    list.innerHTML = '';

    rules.forEach((r) => {
      const li = document.createElement('li');
      li.style.cssText = "background:#f9f9f9; border-bottom:1px solid #eee; padding:8px; display:flex; justify-content:space-between; align-items:center;";
      
      li.innerHTML = `
        <span title="${r.url}" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px;">
          <strong>${r.url}</strong> : ${r.zoom}
        </span>
        <button class="del-btn" data-url="${r.url}" style="background:#ff4444; color:white; border:none; padding:2px 8px; cursor:pointer; margin-left:10px;">删除</button>
      `;
      list.appendChild(li);
    });

    // 绑定删除按钮
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteRule(e.target.getAttribute('data-url'));
      });
    });
  });
}

// 添加规则
function addRule() {
  const urlInput = document.getElementById('urlInput');
  const zoomInput = document.getElementById('zoomInput');
  
  const urlVal = urlInput.value.trim();
  const zoomVal = parseFloat(zoomInput.value);

  // 1. 基础校验
  if (!urlVal || isNaN(zoomVal)) {
    alert("❌ 请输入有效的网址和数字！");
    return;
  }

  chrome.storage.sync.get(['zoomRules'], (result) => {
    let rules = result.zoomRules || [];
    
    // 2. 去重 (如果已存在，先删掉旧的)
    rules = rules.filter(r => r.url !== urlVal);
    
    // 3. 添加新规则
    rules.push({ url: urlVal, zoom: zoomVal });

    // 4. 保存
    chrome.storage.sync.set({ zoomRules: rules }, () => {
      if (chrome.runtime.lastError) {
        alert("❌ 保存失败: " + chrome.runtime.lastError.message);
      } else {
        // alert("✅ 规则已添加！"); // (可选：如果觉得烦可以注释掉这行)
        urlInput.value = '';
        zoomInput.value = '';
        renderList(); // 刷新列表
      }
    });
  });
}

// 删除规则
function deleteRule(urlToDelete) {
  chrome.storage.sync.get(['zoomRules'], (result) => {
    let rules = result.zoomRules || [];
    rules = rules.filter(r => r.url !== urlToDelete);
    
    chrome.storage.sync.set({ zoomRules: rules }, () => {
      renderList();
    });
  });
}