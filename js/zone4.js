/* ============================================================
   Career Destiny — Zone 4: 面试军械库 (Interview Arsenal)
   Resume review, interview Q&A, mock interview, group cases
   ============================================================ */

// Zone 4 internal tab state
let z4tab = 'resume'; // resume | questions | mock | group

function renderZone4() {
  const container = document.getElementById('zone4');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="max-width:820px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="section-title">面试军械库</div>
      <div class="section-subtitle">INTERVIEW ARSENAL</div>
      <div class="divider-line"></div>

      <!-- Sub-tabs -->
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:28px;flex-wrap:wrap;" id="z4Tabs">
        <button class="z4-tab ${z4tab === 'resume' ? 'active' : ''}" data-tab="resume">📋 简历诊断</button>
        <button class="z4-tab ${z4tab === 'questions' ? 'active' : ''}" data-tab="questions">📚 面试题库</button>
        <button class="z4-tab ${z4tab === 'mock' ? 'active' : ''}" data-tab="mock">🎯 模拟面试</button>
        <button class="z4-tab ${z4tab === 'group' ? 'active' : ''}" data-tab="group">👥 群面攻略</button>
      </div>

      <div id="z4Content"></div>
    </div>
  `;

  // Tab click handlers
  document.querySelectorAll('#z4Tabs .z4-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      z4tab = this.dataset.tab;
      renderZone4();
    });
  });

  // Render active tab content
  switch (z4tab) {
    case 'resume': renderResumeChecker(); break;
    case 'questions': renderQuestionBank(); break;
    case 'mock': renderMockInterview(); break;
    case 'group': renderGroupCases(); break;
  }
}

// ══════════════════════════════════════════════
//  Tab 1: Resume Checker
// ══════════════════════════════════════════════

function renderResumeChecker() {
  const content = document.getElementById('z4Content');
  const savedChecks = JSON.parse(localStorage.getItem('cd-resume-checks') || '{}');
  const cfg = getAiConfig();
  const configured = !!(cfg.apiKey && cfg.provider);
  const provName = AI_PROVIDERS[cfg.provider]?.name || '';

  content.innerHTML = `
    <!-- AI Upload Section -->
    <div style="border:1px solid rgba(126,168,200,0.2);border-radius:4px;padding:20px 22px;margin-bottom:24px;position:relative;background:rgba(126,168,200,0.03);">
      <button class="ai-settings-toggle ${configured ? 'configured' : ''}" onclick="event.stopPropagation();showApiKeyModal();" title="设置 AI 接口">⚙️</button>
      <h4 style="color:var(--accent-blue);font-size:0.9rem;letter-spacing:0.08em;margin-bottom:4px;">🤖 AI 智能分析${configured ? ' <span style="font-size:0.7rem;color:var(--accent-green);">· '+provName+'</span>' : ''}</h4>
      <p style="font-size:0.78rem;color:var(--text-dim);margin-bottom:14px;">上传你的简历文件（PDF/图片），AI 会深度分析并给出专业改进建议。</p>

      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click();">
        <div class="upload-icon">📤</div>
        <div class="upload-text" id="uploadText">点击上传或拖拽简历到此处</div>
        <div class="upload-hint">支持 PDF / PNG / JPG，文件大小不超过 10MB</div>
        <button class="remove-file-btn" id="removeFileBtn" onclick="event.stopPropagation();clearUpload();">✕</button>
        <input type="file" id="fileInput" accept=".pdf,.png,.jpg,.jpeg" style="display:none;" onchange="handleFileSelect(event);">
      </div>

      <div id="aiStatus" style="margin-top:12px;"></div>
    </div>

    <!-- Score Display -->
    <div style="text-align:center;margin-bottom:24px;" id="resumeScore"></div>

    <!-- Checklist -->
    <div id="checklistContainer"></div>

    <!-- Industry Templates -->
    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin:28px 0 14px;">📝 行业简历模板</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="templateContainer"></div>
  `;

  // Drag and drop
  setTimeout(() => {
    const zone = document.getElementById('uploadZone');
    if (!zone) return;
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) processUploadedFile(file);
    });
    document.getElementById('fileInput').addEventListener('change', function(e) {
      if (e.target.files[0]) processUploadedFile(e.target.files[0]);
    });
  }, 100);

  // Render checklist
  const checklistDiv = document.getElementById('checklistContainer');
  const sections = {};
  RESUME_CHECKLIST.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  Object.entries(sections).forEach(([section, items]) => {
    const secDiv = document.createElement('div');
    secDiv.style.marginBottom = '16px';
    secDiv.innerHTML = `<h5 style="color:var(--gold-dim);font-size:0.78rem;letter-spacing:0.12em;margin-bottom:8px;border-bottom:1px solid rgba(200,169,110,0.08);padding-bottom:4px;">${section}</h5>`;

    items.forEach(item => {
      const checked = savedChecks[item.id] || false;
      const row = document.createElement('div');
      row.className = 'resume-check-row';
      row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;padding:7px 0;cursor:pointer;';
      row.innerHTML = `
        <div class="resume-checkbox ${checked ? 'done' : ''}" style="flex-shrink:0;width:20px;height:20px;border:1px solid ${checked ? 'var(--accent-green)' : 'rgba(200,169,110,0.3)'};border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;transition:all 0.3s ease;background:${checked ? 'rgba(138,200,160,0.15)' : 'transparent'};color:${checked ? 'var(--accent-green)' : 'transparent'};">${checked ? '✓' : ''}</div>
        <div style="flex:1;">
          <div style="font-size:0.85rem;color:${checked ? 'var(--text-dim)' : 'var(--text)'};letter-spacing:0.04em;${checked ? 'text-decoration:line-through;' : ''}">${item.item}</div>
          <div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px;">💡 ${item.tip}</div>
        </div>
      `;
      row.addEventListener('click', () => {
        savedChecks[item.id] = !savedChecks[item.id];
        localStorage.setItem('cd-resume-checks', JSON.stringify(savedChecks));
        renderResumeChecker();
      });
      secDiv.appendChild(row);
    });
    checklistDiv.appendChild(secDiv);
  });

  // Update score
  updateResumeScore(savedChecks);

  // Industry templates
  const templateDiv = document.getElementById('templateContainer');
  RESUME_TEMPLATES.forEach(tmpl => {
    templateDiv.innerHTML += `
      <div style="border:1px solid rgba(200,169,110,0.12);border-radius:3px;padding:14px 16px;font-size:0.78rem;">
        <h5 style="color:var(--gold-light);letter-spacing:0.06em;margin-bottom:8px;">${tmpl.icon} ${tmpl.industry}</h5>
        <ul style="list-style:none;color:var(--text-dim);line-height:1.9;">
          ${tmpl.highlights.map(h => `<li>✓ ${h}</li>`).join('')}
        </ul>
        <div style="margin-top:8px;color:#a07060;font-size:0.72rem;">
          ${tmpl.avoid.map(a => `<span>✗ ${a}</span><br>`).join('')}
        </div>
      </div>
    `;
  });
}

function updateResumeScore(savedChecks) {
  const scoreDiv = document.getElementById('resumeScore');
  if (!scoreDiv) return;

  let totalWeight = 0, earned = 0;
  RESUME_CHECKLIST.forEach(item => {
    totalWeight += item.weight;
    if (savedChecks[item.id]) earned += item.weight;
  });

  const pct = Math.round((earned / totalWeight) * 100);
  const grade = pct >= 85 ? '🏆 A+ 简历教科书级别' : pct >= 70 ? '👍 B+ 还不错，再打磨一下' : pct >= 50 ? '📝 C 还有不少提升空间' : '🔧 D 建议从头大改';

  scoreDiv.innerHTML = `
    <div style="font-size:2.5rem;font-weight:700;color:var(--gold-light);">${pct}%</div>
    <div style="font-size:0.9rem;color:var(--gold-dim);letter-spacing:0.1em;margin-top:4px;">${grade}</div>
    <div style="font-size:0.75rem;color:var(--text-dim);margin-top:4px;">${earned}/${totalWeight} 分</div>
  `;
}

// ══════════════════════════════════════════════
//  AI Resume Analysis Functions
// ══════════════════════════════════════════════

const AI_PROVIDERS = {
  deepseek:   { name:'DeepSeek',       endpoint:'https://api.deepseek.com/v1/chat/completions',                    model:'deepseek-chat',     format:'openai', desc:'性价比极高，国内直达' },
  qwen:       { name:'阿里通义千问',     endpoint:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model:'qwen-plus',         format:'openai', desc:'阿里云出品，中文理解强' },
  moonshot:   { name:'月之暗面 Kimi',    endpoint:'https://api.moonshot.cn/v1/chat/completions',                    model:'moonshot-v1-8k',    format:'openai', desc:'长文本处理出色' },
  glm:        { name:'智谱 ChatGLM',    endpoint:'https://open.bigmodel.cn/api/paas/v4/chat/completions',           model:'glm-4',             format:'openai', desc:'清华系，学术背景扎实' },
  doubao:     { name:'字节豆包',         endpoint:'https://ark.cn-beijing.volces.com/api/v3/chat/completions',       model:'doubao-pro-32k',    format:'openai', desc:'字节跳动旗下' },
  anthropic:  { name:'Anthropic Claude',endpoint:'https://api.anthropic.com/v1/messages',                            model:'claude-sonnet-4-6', format:'anthropic', desc:'最强分析能力，需海外访问' },
  custom:     { name:'自定义接口',        endpoint:'',                                                               model:'',                  format:'openai', desc:'填入任意 OpenAI 兼容接口' }
};

function getAiConfig() {
  // Migrate old key to new storage
  const oldKey = localStorage.getItem('cd-claude-api-key');
  if (oldKey && !localStorage.getItem('cd-ai-api-key')) {
    localStorage.setItem('cd-ai-api-key', oldKey);
    localStorage.setItem('cd-ai-provider', 'anthropic');
    localStorage.removeItem('cd-claude-api-key');
  }
  const provider = localStorage.getItem('cd-ai-provider') || '';
  const apiKey = localStorage.getItem('cd-ai-api-key') || '';
  const model = localStorage.getItem('cd-ai-model') || '';
  const endpoint = localStorage.getItem('cd-ai-endpoint') || '';
  return { provider, apiKey, model, endpoint };
}

function showApiKeyModal() {
  const existing = document.querySelector('.api-modal-overlay');
  if (existing) existing.remove();

  const cfg = getAiConfig();
  const sel = (p) => cfg.provider === p ? 'selected' : '';

  const providerOpts = Object.entries(AI_PROVIDERS).map(([k,v]) =>
    `<option value="${k}" ${sel(k)}>${v.name} — ${v.desc}</option>`
  ).join('');

  const currentProvider = AI_PROVIDERS[cfg.provider];
  const showCustom = currentProvider && currentProvider.name === '自定义接口';

  const overlay = document.createElement('div');
  overlay.className = 'api-modal-overlay';
  overlay.innerHTML = `
    <div class="api-modal" style="max-width:480px;">
      <h4>⚙️ 设置 AI 分析接口</h4>
      <p style="font-size:0.78rem;color:var(--text-dim);line-height:1.7;margin-bottom:14px;">
        选择一个 AI 大模型来帮你分析简历。<br>
        <span style="font-size:0.7rem;opacity:0.6;">密钥仅存储在你的浏览器本地，不会上传到任何服务器。</span>
      </p>

      <label style="display:block;font-size:0.75rem;color:var(--gold-dim);margin-bottom:4px;letter-spacing:0.06em;">模型选择</label>
      <select id="providerSelect" style="
        width:100%;padding:8px 10px;font-size:0.82rem;font-family:inherit;
        background:rgba(255,255,255,0.04);border:1px solid rgba(200,169,110,0.3);
        border-radius:2px;color:var(--text);outline:none;box-sizing:border-box;
        margin-bottom:12px;cursor:pointer;
      " onchange="onProviderChange()">${providerOpts}</select>

      <label style="display:block;font-size:0.75rem;color:var(--gold-dim);margin-bottom:4px;letter-spacing:0.06em;">API Key</label>
      <input type="password" id="apiKeyInput" placeholder="粘贴你的 API Key..." value="${cfg.apiKey.replace(/"/g,'&quot;')}" style="
        width:100%;padding:8px 12px;font-size:0.82rem;font-family:inherit;letter-spacing:0.04em;
        background:rgba(255,255,255,0.04);border:1px solid rgba(200,169,110,0.3);border-radius:2px;
        color:var(--text);outline:none;box-sizing:border-box;margin-bottom:12px;
      " onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='rgba(200,169,110,0.3)'">

      <div id="customFields" style="display:${showCustom ? 'block' : 'none'};">
        <label style="display:block;font-size:0.75rem;color:var(--gold-dim);margin-bottom:4px;letter-spacing:0.06em;">接口地址 (Endpoint)</label>
        <input type="text" id="endpointInput" placeholder="https://api.example.com/v1/chat/completions" value="${cfg.endpoint}" style="
          width:100%;padding:8px 12px;font-size:0.82rem;font-family:inherit;letter-spacing:0.04em;
          background:rgba(255,255,255,0.04);border:1px solid rgba(200,169,110,0.3);border-radius:2px;
          color:var(--text);outline:none;box-sizing:border-box;margin-bottom:8px;
        ">
        <label style="display:block;font-size:0.75rem;color:var(--gold-dim);margin-bottom:4px;letter-spacing:0.06em;">模型名称</label>
        <input type="text" id="modelInput" placeholder="gpt-4o / claude-3-opus ..." value="${cfg.model}" style="
          width:100%;padding:8px 12px;font-size:0.82rem;font-family:inherit;letter-spacing:0.04em;
          background:rgba(255,255,255,0.04);border:1px solid rgba(200,169,110,0.3);border-radius:2px;
          color:var(--text);outline:none;box-sizing:border-box;margin-bottom:8px;
        ">
      </div>

      <div id="providerTips" style="font-size:0.7rem;color:var(--text-dim);opacity:0.7;margin-bottom:12px;line-height:1.6;"></div>

      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="apiKeyClearBtn" style="
          padding:6px 16px;font-size:0.75rem;font-family:inherit;letter-spacing:0.06em;
          border:1px solid rgba(200,138,126,0.3);border-radius:2px;background:transparent;
          color:var(--accent-red);cursor:pointer;
        ">清除</button>
        <button id="apiKeySaveBtn" class="btn-primary" style="max-width:100px;">保存</button>
      </div>
      ${cfg.apiKey ? '<div style="font-size:0.7rem;color:var(--accent-green);margin-top:8px;text-align:right;">✓ 已配置 ' + (AI_PROVIDERS[cfg.provider]?.name || '') + '</div>' : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('apiKeySaveBtn').addEventListener('click', () => {
    const provider = document.getElementById('providerSelect').value;
    const key = document.getElementById('apiKeyInput').value.trim();
    const provCfg = AI_PROVIDERS[provider];

    localStorage.setItem('cd-ai-provider', provider);
    if (key) {
      localStorage.setItem('cd-ai-api-key', key);
    } else {
      localStorage.removeItem('cd-ai-api-key');
    }
    localStorage.removeItem('cd-claude-api-key'); // clean up old key

    if (provCfg && provCfg.name === '自定义接口') {
      const ep = document.getElementById('endpointInput').value.trim();
      const mdl = document.getElementById('modelInput').value.trim();
      if (ep) localStorage.setItem('cd-ai-endpoint', ep);
      else localStorage.removeItem('cd-ai-endpoint');
      if (mdl) localStorage.setItem('cd-ai-model', mdl);
      else localStorage.removeItem('cd-ai-model');
    } else {
      localStorage.removeItem('cd-ai-endpoint');
      localStorage.removeItem('cd-ai-model');
    }

    overlay.remove();
    renderResumeChecker();
  });

  document.getElementById('apiKeyClearBtn').addEventListener('click', () => {
    localStorage.removeItem('cd-ai-provider');
    localStorage.removeItem('cd-ai-api-key');
    localStorage.removeItem('cd-ai-model');
    localStorage.removeItem('cd-ai-endpoint');
    localStorage.removeItem('cd-claude-api-key');
    overlay.remove();
    renderResumeChecker();
  });

  // Update tips and custom fields
  window.onProviderChange = function() {
    const p = document.getElementById('providerSelect').value;
    const provCfg = AI_PROVIDERS[p];
    if (provCfg) {
      const tips = document.getElementById('providerTips');
      const getKeyUrl = {
        deepseek: 'platform.deepseek.com/api_keys',
        qwen: 'dashscope.console.aliyun.com/apiKey',
        moonshot: 'platform.moonshot.cn/console/api-keys',
        glm: 'open.bigmodel.cn/usercenter/apikeys',
        doubao: 'console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
        anthropic: 'console.anthropic.com/settings/keys',
        custom: ''
      };
      const url = getKeyUrl[p];
      tips.innerHTML = url
        ? `获取 Key：<a href="https://${url}" target="_blank" style="color:var(--accent-blue);">${url}</a>`
        : '填入任意兼容 OpenAI Chat Completions 格式的接口信息';
      document.getElementById('customFields').style.display = provCfg.name === '自定义接口' ? 'block' : 'none';
      document.getElementById('apiKeyInput').placeholder = p === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...';
    }
  };
  window.onProviderChange();

  setTimeout(() => document.getElementById('apiKeyInput').focus(), 100);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processUploadedFile(file);
}

function clearUpload() {
  const fileInput = document.getElementById('fileInput');
  const zone = document.getElementById('uploadZone');
  const text = document.getElementById('uploadText');
  const status = document.getElementById('aiStatus');
  if (fileInput) fileInput.value = '';
  if (zone) zone.classList.remove('has-file');
  if (text) text.textContent = '点击上传或拖拽简历到此处';
  if (status) status.innerHTML = '';
}

async function processUploadedFile(file) {
  const status = document.getElementById('aiStatus');
  const zone = document.getElementById('uploadZone');
  const text = document.getElementById('uploadText');

  if (file.size > 10 * 1024 * 1024) {
    if (status) status.innerHTML = '<div style="color:var(--accent-red);font-size:0.8rem;padding:8px 0;">文件过大，请选择小于 10MB 的文件</div>';
    return;
  }

  zone.classList.add('has-file');
  text.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

  status.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div style="font-size:0.8rem;color:var(--text-dim);">正在解析文件...</div>
    </div>
  `;

  try {
    const ext = file.name.split('.').pop().toLowerCase();
    let content, fileType;

    if (ext === 'pdf') {
      content = await extractPdfText(file);
      fileType = 'text';
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      content = await fileToBase64(file);
      fileType = 'image';
    } else {
      content = await fileToBase64(file);
      fileType = 'image';
    }

    await analyzeResume(content, fileType, file.name);
  } catch (err) {
    console.error('File processing error:', err);
    status.innerHTML = `<div style="color:var(--accent-red);font-size:0.8rem;padding:8px 0;">解析失败：${err.message}</div>`;
  }
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = () => reject(new Error('PDF 解析库加载失败，请检查网络'));
      document.head.appendChild(script);
    });
  }

  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(it => it.str).join(' ');
    fullText += pageText + '\n';
  }

  if (!fullText.trim()) throw new Error('未能从 PDF 中提取文字，请确认 PDF 包含可选中文本（非扫描图片）');
  return fullText;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getSystemPrompt() {
  return `你是一位资深HR和简历优化专家，拥有10年以上招聘经验。请对简历进行深度专业分析。

请严格按以下JSON格式回复（不要包含任何其他文字，只输出JSON）：
{
  "overallScore": 85,
  "summary": "整体评价，2-3句话",
  "strengths": ["亮点1", "亮点2", "亮点3"],
  "weaknesses": ["待改进1", "待改进2", "待改进3"],
  "sections": [
    {"name": "个人信息", "score": 80, "comment": "一句话评价"},
    {"name": "教育背景", "score": 75, "comment": "一句话评价"},
    {"name": "工作/实习经历", "score": 70, "comment": "一句话评价"},
    {"name": "项目经历", "score": 85, "comment": "一句话评价"},
    {"name": "技能与证书", "score": 90, "comment": "一句话评价"},
    {"name": "排版与格式", "score": 65, "comment": "一句话评价"}
  ],
  "keywordOptimization": "关键词优化建议，如何让简历更容易被ATS/HR筛选到",
  "actionPlan": ["具体改进步骤1", "改进步骤2", "改进步骤3"]
}

评分标准：
- 90-100：简历教科书级别，几乎无需修改
- 75-89：整体不错，有几个小地方可以优化
- 60-74：中等水平，需要较多改进
- 40-59：有不少问题，建议大幅修改
- 40以下：需要从结构上重新组织

请用中文回复，评价要具体、可操作。`;
}

async function analyzeResume(content, fileType, fileName) {
  const status = document.getElementById('aiStatus');
  const cfg = getAiConfig();

  if (!cfg.apiKey || !cfg.provider) {
    showApiKeyModal();
    status.innerHTML = '<div style="color:var(--accent-red);font-size:0.8rem;padding:8px 0;">请先选择模型并设置 API Key 后再分析</div>';
    return;
  }

  const provCfg = AI_PROVIDERS[cfg.provider];
  if (!provCfg) {
    showApiKeyModal();
    return;
  }

  const providerName = provCfg.name;
  status.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div style="font-size:0.8rem;color:var(--text-dim);">${providerName} 正在深度分析你的简历...</div>
      <div style="font-size:0.7rem;color:var(--text-dim);opacity:0.6;">这可能需要 15-30 秒</div>
    </div>
  `;

  try {
    let replyText;

    if (provCfg.format === 'anthropic') {
      replyText = await analyzeWithAnthropic(cfg, provCfg, content, fileType, fileName);
    } else {
      replyText = await analyzeWithOpenAI(cfg, provCfg, content, fileType, fileName);
    }

    let result;
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        renderAiRawResult(replyText);
        return;
      }
    } else {
      renderAiRawResult(replyText);
      return;
    }

    renderAiResult(result);

  } catch (err) {
    console.error('API error:', err);
    status.innerHTML = `
      <div style="color:var(--accent-red);font-size:0.82rem;line-height:1.8;padding:8px 0;">
        <strong>分析失败：</strong>${err.message.replace(/</g,'&lt;')}<br>
        <span style="font-size:0.72rem;opacity:0.7;">请检查网络连接和 API Key 是否有效</span>
        <button onclick="clearUpload()" style="display:block;margin-top:8px;font-size:0.72rem;font-family:inherit;color:var(--gold-light);background:transparent;border:1px solid rgba(200,169,110,0.3);border-radius:2px;padding:4px 12px;cursor:pointer;">重新上传</button>
      </div>
    `;
  }
}

async function analyzeWithAnthropic(cfg, provCfg, content, fileType, fileName) {
  const systemPrompt = getSystemPrompt();
  const model = cfg.model || provCfg.model;
  const messages = [{ role: 'user', content: [] }];

  if (fileType === 'image') {
    const mimeType = content.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';
    messages[0].content.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: content.split(',')[1] }
    });
    messages[0].content.push({
      type: 'text',
      text: '请分析这份简历的图片，给出详细专业评价和改进建议。请按指定的JSON格式回复。'
    });
  } else {
    messages[0].content.push({
      type: 'text',
      text: `请分析以下简历内容（文件名：${fileName}）：\n\n${content.substring(0, 18000)}`
    });
  }

  const resp = await fetch(provCfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    if (resp.status === 401) {
      localStorage.removeItem('cd-ai-api-key');
      throw new Error('API Key 无效，请重新设置');
    } else if (resp.status === 429) throw new Error('请求太频繁，请稍后重试');
    else if (resp.status === 403) throw new Error('API Key 没有权限，请检查账户余额');
    else throw new Error(errData.error?.message || `请求失败 (${resp.status})`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

async function analyzeWithOpenAI(cfg, provCfg, content, fileType, fileName) {
  const systemPrompt = getSystemPrompt();
  const model = cfg.model || provCfg.model;
  const endpoint = cfg.endpoint || provCfg.endpoint;
  const userContent = [];

  if (fileType === 'image') {
    userContent.push({
      type: 'image_url',
      image_url: { url: content }
    });
    userContent.push({
      type: 'text',
      text: '请分析这份简历的图片，给出详细专业评价和改进建议。请按指定的JSON格式回复。'
    });
  } else {
    userContent.push({
      type: 'text',
      text: `请分析以下简历内容（文件名：${fileName}）：\n\n${content.substring(0, 18000)}`
    });
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: messages
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const errMsg = errData.error?.message || errData.message || errData.msg || errData.error_msg || `请求失败 (${resp.status})`;
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('API Key 无效或没有权限，请检查');
    } else if (resp.status === 429) throw new Error('请求太频繁，请稍后重试');
    else throw new Error(errMsg);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

function renderAiResult(result) {
  const status = document.getElementById('aiStatus');
  const score = result.overallScore || 0;
  const scoreColor = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--gold-light)' : 'var(--accent-red)';
  const gradeLabel = score >= 90 ? '教科书级别' : score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '需改进' : '建议重写';

  status.innerHTML = `
    <div class="ai-result">
      <div class="ai-result-header">
        <div class="ai-result-score" style="border-color:${scoreColor};color:${scoreColor};font-size:1.3rem;">${score}</div>
        <div style="flex:1;">
          <div style="font-size:1rem;color:var(--gold-light);letter-spacing:0.06em;">🤖 AI 深度分析报告</div>
          <div style="font-size:0.7rem;color:${scoreColor};margin-top:2px;">综合评分 · ${gradeLabel}</div>
        </div>
        <button onclick="clearUpload()" style="font-size:0.68rem;font-family:inherit;color:var(--text-dim);background:transparent;border:1px solid rgba(200,169,110,0.2);border-radius:2px;padding:4px 10px;cursor:pointer;">重新上传</button>
      </div>

      <div class="ai-result-body">
        <div style="margin-bottom:14px;line-height:1.9;color:#b8b0a0;">${result.summary || ''}</div>

        ${result.strengths && result.strengths.length ? `
          <h5>✅ 亮点</h5>
          <ul style="margin:0 0 16px;padding-left:18px;">
            ${result.strengths.map(s => `<li style="font-size:0.82rem;line-height:1.9;"><span class="highlight-good">${s}</span></li>`).join('')}
          </ul>
        ` : ''}

        ${result.weaknesses && result.weaknesses.length ? `
          <h5>⚠️ 待改进</h5>
          <ul style="margin:0 0 16px;padding-left:18px;">
            ${result.weaknesses.map(w => `<li style="font-size:0.82rem;line-height:1.9;"><span class="highlight-bad">${w}</span></li>`).join('')}
          </ul>
        ` : ''}

        ${result.sections && result.sections.length ? `
          <h5>📋 逐项评分</h5>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
            ${result.sections.map(sec => `
              <div style="background:rgba(255,255,255,0.02);padding:10px 12px;border-radius:2px;border:1px solid rgba(255,255,255,0.03);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <span style="font-size:0.78rem;color:var(--text-dim);">${sec.name}</span>
                  <span style="font-size:0.78rem;font-weight:600;color:${(sec.score || 0) >= 80 ? 'var(--accent-green)' : (sec.score || 0) >= 60 ? 'var(--gold-light)' : 'var(--accent-red)'};">${sec.score}分</span>
                </div>
                <div style="font-size:0.72rem;color:var(--text-dim);opacity:0.7;">${sec.comment || ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${result.keywordOptimization ? `
          <h5>🔑 关键词优化</h5>
          <div style="font-size:0.82rem;color:#b8b0a0;line-height:1.8;margin-bottom:16px;">${result.keywordOptimization}</div>
        ` : ''}

        ${result.actionPlan && result.actionPlan.length ? `
          <h5>📝 行动计划</h5>
          <ol style="margin:0;padding-left:18px;">
            ${result.actionPlan.map(a => `<li style="font-size:0.82rem;line-height:1.9;color:#b8b0a0;">${a}</li>`).join('')}
          </ol>
        ` : ''}
      </div>
    </div>
  `;
}

function renderAiRawResult(text) {
  const status = document.getElementById('aiStatus');
  status.innerHTML = `
    <div class="ai-result">
      <div class="ai-result-header">
        <div style="font-size:1rem;color:var(--gold-light);letter-spacing:0.06em;">🤖 AI 分析报告</div>
        <button onclick="clearUpload()" style="margin-left:auto;font-size:0.68rem;font-family:inherit;color:var(--text-dim);background:transparent;border:1px solid rgba(200,169,110,0.2);border-radius:2px;padding:4px 10px;cursor:pointer;">重新上传</button>
      </div>
      <div class="ai-result-body" style="white-space:pre-wrap;line-height:1.9;">${text.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
    </div>
  `;
}

// ══════════════════════════════════════════════
//  Tab 2: Interview Question Bank
// ══════════════════════════════════════════════

function renderQuestionBank() {
  const content = document.getElementById('z4Content');
  const categories = [...new Set(INTERVIEW_QUESTIONS.map(q => q.category))];

  content.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;" id="filterBar">
      <button class="q-filter active" data-cat="all">全部</button>
      ${categories.map(c => `<button class="q-filter" data-cat="${c}">${c}</button>`).join('')}
    </div>
    <div style="margin-bottom:16px;text-align:center;">
      <span style="font-size:0.75rem;color:var(--text-dim);" id="filterCount">共 ${INTERVIEW_QUESTIONS.length} 题</span>
    </div>
    <div id="questionsList"></div>
  `;

  // Filter handlers
  document.querySelectorAll('#filterBar .q-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#filterBar .q-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderFilteredQuestions(this.dataset.cat);
    });
  });

  renderFilteredQuestions('all');
}

function renderFilteredQuestions(cat) {
  const list = document.getElementById('questionsList');
  const filtered = cat === 'all' ? INTERVIEW_QUESTIONS : INTERVIEW_QUESTIONS.filter(q => q.category === cat);
  document.getElementById('filterCount').textContent = `共 ${filtered.length} 题`;

  list.innerHTML = filtered.map(q => `
    <div class="q-card" data-qid="${q.id}" style="border:1px solid rgba(200,169,110,0.1);border-radius:3px;padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:all 0.3s ease;background:rgba(255,255,255,0.01);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-size:0.65rem;padding:2px 8px;border:1px solid rgba(200,169,110,0.3);border-radius:2px;color:var(--gold-dim);margin-right:6px;">${q.subcategory}</span>
          <span style="font-size:0.65rem;padding:2px 8px;border-radius:2px;margin-right:6px;
            ${q.difficulty === '必考' ? 'border:1px solid rgba(200,138,126,0.4);color:var(--accent-red);' :
              q.difficulty === '高频' ? 'border:1px solid rgba(200,169,110,0.4);color:var(--gold-light);' :
              q.difficulty === '困难' ? 'border:1px solid rgba(160,138,200,0.4);color:var(--accent-purple);' :
              'border:1px solid rgba(255,255,255,0.1);color:var(--text-dim);'}">${q.difficulty}</span>
        </div>
        <span style="font-size:0.68rem;color:var(--text-dim);">${q.framework}</span>
      </div>
      <div style="font-size:0.92rem;color:var(--text);letter-spacing:0.05em;margin-top:10px;line-height:1.6;">${q.question}</div>
      <div class="q-answer" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(200,169,110,0.08);">
        <div style="font-size:0.78rem;color:var(--gold-light);letter-spacing:0.06em;margin-bottom:4px;">💡 答题思路</div>
        <div style="font-size:0.82rem;color:var(--text-dim);line-height:1.8;">${q.tips}</div>
        <div style="font-size:0.78rem;color:var(--gold-light);letter-spacing:0.06em;margin:10px 0 4px;">📖 参考回答</div>
        <div style="font-size:0.82rem;color:#b0a088;line-height:1.9;background:rgba(255,255,255,0.015);padding:10px 14px;border-radius:3px;border-left:2px solid rgba(200,169,110,0.2);">${q.sampleAnswer}</div>
      </div>
    </div>
  `).join('');

  // Click handler
  list.querySelectorAll('.q-card').forEach(card => {
    card.addEventListener('click', function() {
      const answer = this.querySelector('.q-answer');
      const isOpen = answer.style.display === 'block';
      answer.style.display = isOpen ? 'none' : 'block';
      this.style.borderColor = isOpen ? 'rgba(200,169,110,0.1)' : 'rgba(200,169,110,0.4)';
      this.style.background = isOpen ? 'rgba(255,255,255,0.01)' : 'rgba(200,169,110,0.04)';
    });
  });
}

// ══════════════════════════════════════════════
//  Tab 3: Mock Interview Simulator
// ══════════════════════════════════════════════

let mockState = { phase: 'idle', question: null, timeLeft: 120, timer: null, history: [] };

function renderMockInterview() {
  const content = document.getElementById('z4Content');
  const history = JSON.parse(localStorage.getItem('cd-mock-history') || '[]');

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <p style="font-size:0.9rem;color:var(--text-dim);line-height:1.9;">
        随机抽题 → 30秒思考 → 2分钟作答 → 自评打分<br>
        <span style="font-size:0.78rem;color:var(--gold-dim);">历史练习 ${history.length} 次 | 平均分 ${history.length > 0 ? Math.round(history.reduce((a,b) => a + (b.score || 0), 0) / history.length) : '—'}%</span>
      </p>
    </div>

    <!-- Category selector -->
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;">
      <button class="q-filter active" data-mcat="all">全部题型</button>
      ${['行为面试', '技术面试', 'HR面试', '压力面试'].map(c => `<button class="q-filter" data-mcat="${c}">${c}</button>`).join('')}
    </div>

    <!-- Mock area -->
    <div id="mockArea" style="
      border:1px solid rgba(200,169,110,0.15);border-radius:3px;
      padding:24px;text-align:center;min-height:200px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
    "></div>

    <!-- History -->
    ${history.length > 0 ? `
      <div style="margin-top:24px;">
        <h4 style="color:var(--gold-light);font-size:0.9rem;letter-spacing:0.1em;margin-bottom:10px;">📊 练习记录</h4>
        <div style="max-height:200px;overflow-y:auto;">
          ${history.slice().reverse().slice(0, 5).map((h, i) => `
            <div style="font-size:0.75rem;color:var(--text-dim);padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;">
              <span>${h.question}</span>
              <span style="color:${h.score >= 70 ? 'var(--accent-green)' : h.score >= 40 ? 'var(--gold-light)' : 'var(--accent-red)'};">${h.score}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Category buttons
  document.querySelectorAll('#z4Content .q-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#z4Content .q-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  renderMockIdle();
}

function renderMockIdle() {
  const area = document.getElementById('mockArea');
  if (!area) return;
  mockState.phase = 'idle';
  if (mockState.timer) clearInterval(mockState.timer);

  area.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px;opacity:0.6;">🎯</div>
    <p style="color:var(--text-dim);font-size:0.9rem;letter-spacing:0.06em;margin-bottom:16px;">准备好开始模拟面试了吗？</p>
    <button class="btn-primary" onclick="startMockInterview()" style="max-width:240px;">开 始 答 题</button>
  `;
}

function startMockInterview() {
  const area = document.getElementById('mockArea');
  if (!area) return;

  // Pick random question
  const activeCat = document.querySelector('#z4Content .q-filter.active')?.dataset?.mcat || 'all';
  const pool = activeCat === 'all' ? INTERVIEW_QUESTIONS : INTERVIEW_QUESTIONS.filter(q => q.category === activeCat);
  const question = pool[Math.floor(Math.random() * pool.length)];
  mockState.question = question;

  // Think phase (30 seconds)
  mockState.phase = 'think';
  mockState.timeLeft = 30;

  area.innerHTML = `
    <div style="font-size:0.78rem;color:var(--gold-dim);letter-spacing:0.1em;margin-bottom:8px;">📋 你的题目</div>
    <div style="font-size:1.05rem;color:var(--gold-light);letter-spacing:0.06em;margin-bottom:4px;line-height:1.6;">${question.question}</div>
    <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:20px;">类型：${question.category} · ${question.subcategory} · ${question.difficulty}</div>
    <div style="font-size:3rem;font-weight:700;color:var(--gold-light);margin:16px 0;" id="countdownTimer">30</div>
    <div style="font-size:0.78rem;color:var(--text-dim);">思考时间 · 准备你的答题框架</div>
    <button class="btn-secondary" style="margin-top:16px;" onclick="skipToAnswer()">我准备好了 →</button>
  `;

  mockState.timer = setInterval(() => {
    mockState.timeLeft--;
    const timerEl = document.getElementById('countdownTimer');
    if (timerEl) timerEl.textContent = mockState.timeLeft;
    if (mockState.timeLeft <= 0) {
      clearInterval(mockState.timer);
      renderMockAnswer();
    }
  }, 1000);
}

function skipToAnswer() {
  if (mockState.timer) clearInterval(mockState.timer);
  renderMockAnswer();
}

function renderMockAnswer() {
  const area = document.getElementById('mockArea');
  if (!area) return;

  mockState.phase = 'answer';
  mockState.timeLeft = 120;

  area.innerHTML = `
    <div style="font-size:0.85rem;color:var(--gold-light);letter-spacing:0.06em;margin-bottom:8px;">🎤 请开始作答</div>
    <div style="font-size:3rem;font-weight:700;color:var(--accent-red);margin:16px 0;" id="countdownTimer">2:00</div>
    <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:16px;">对着镜子或录音练习，注意语速和逻辑</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
      <button class="btn-secondary" onclick="finishMockAnswer()">我答完了 →</button>
    </div>
    <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px;">也可以等到计时结束自动进入评分</div>
  `;

  mockState.timer = setInterval(() => {
    mockState.timeLeft--;
    const timerEl = document.getElementById('countdownTimer');
    if (timerEl) {
      const min = Math.floor(mockState.timeLeft / 60);
      const sec = mockState.timeLeft % 60;
      timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
      if (mockState.timeLeft <= 10) timerEl.style.color = 'var(--accent-red)';
    }
    if (mockState.timeLeft <= 0) {
      clearInterval(mockState.timer);
      renderMockSelfEval();
    }
  }, 1000);
}

function finishMockAnswer() {
  if (mockState.timer) clearInterval(mockState.timer);
  renderMockSelfEval();
}

function renderMockSelfEval() {
  const area = document.getElementById('mockArea');
  if (!area) return;

  mockState.phase = 'eval';

  area.innerHTML = `
    <div style="font-size:0.85rem;color:var(--gold-light);letter-spacing:0.08em;margin-bottom:16px;">📊 自我评估</div>
    <div id="evalRubric" style="text-align:left;"></div>
    <div id="evalResult" style="margin-top:16px;"></div>
  `;

  const rubricDiv = document.getElementById('evalRubric');
  INTERVIEW_RUBRIC.forEach((rubric, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:10px;';
    div.innerHTML = `
      <div style="font-size:0.8rem;color:var(--text);margin-bottom:4px;">${rubric.criterion}（权重${rubric.weight}%）</div>
      <div style="display:flex;gap:6px;">
        ${rubric.levels.map((lvl, j) => `
          <button class="eval-btn" data-criterion="${i}" data-level="${j}" style="
            flex:1;padding:6px 4px;font-size:0.68rem;border:1px solid rgba(200,169,110,0.2);
            border-radius:2px;background:transparent;color:var(--text-dim);cursor:pointer;
            font-family:inherit;letter-spacing:0.03em;transition:all 0.25s ease;
          ">${lvl}</button>
        `).join('')}
      </div>
    `;
    rubricDiv.appendChild(div);
  });

  // Eval button click
  document.querySelectorAll('.eval-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const criterionIdx = parseInt(this.dataset.criterion);
      const level = parseInt(this.dataset.level);
      // Highlight selected in this criterion group
      this.parentElement.querySelectorAll('.eval-btn').forEach(b => {
        b.style.borderColor = 'rgba(200,169,110,0.2)';
        b.style.color = 'var(--text-dim)';
        b.style.background = 'transparent';
      });
      this.style.borderColor = 'var(--gold)';
      this.style.color = 'var(--gold-light)';
      this.style.background = 'rgba(200,169,110,0.1)';
      // Store selection
      this.parentElement.dataset.selected = level;
      checkAllSelected();
    });
  });
}

function checkAllSelected() {
  const allGroups = document.querySelectorAll('#evalRubric > div');
  let allDone = true;
  allGroups.forEach(g => {
    if (g.dataset.selected === undefined) allDone = false;
  });
  if (allDone) calculateMockScore();
}

function calculateMockScore() {
  let totalScore = 0;
  INTERVIEW_RUBRIC.forEach((rubric, i) => {
    const group = document.querySelectorAll('#evalRubric > div')[i];
    const level = parseInt(group.dataset.selected || 0);
    const levelPct = level / (rubric.levels.length - 1); // 0 to 1
    totalScore += levelPct * rubric.weight;
  });

  const score = Math.round(totalScore);
  const question = mockState.question;

  // Save history
  const history = JSON.parse(localStorage.getItem('cd-mock-history') || '[]');
  history.push({ question: question.question, score, category: question.category, date: new Date().toISOString() });
  // Keep last 20
  if (history.length > 20) history.splice(0, history.length - 20);
  localStorage.setItem('cd-mock-history', JSON.stringify(history));

  // Show result
  const resultDiv = document.getElementById('evalResult');
  const emoji = score >= 80 ? '🏆' : score >= 60 ? '👍' : score >= 40 ? '📝' : '🌱';
  const msg = score >= 80 ? '表现优秀！面试时保持这个状态！' : score >= 60 ? '还不错，针对弱项再练练！' : score >= 40 ? '还有提升空间，多用框架练习！' : '别灰心！每次练习都是进步！';

  resultDiv.innerHTML = `
    <div style="font-size:3rem;">${emoji}</div>
    <div style="font-size:2rem;font-weight:700;color:var(--gold-light);">${score}%</div>
    <div style="font-size:0.85rem;color:var(--text-dim);margin:8px 0 16px;">${msg}</div>
    <div style="font-size:0.75rem;color:var(--gold-dim);margin-bottom:12px;line-height:1.8;">题目：${question.question}<br>参考框架：${question.framework}</div>
    <button class="btn-primary" onclick="renderMockIdle()">再练一题 →</button>
  `;

  // Disable eval buttons
  document.querySelectorAll('.eval-btn').forEach(b => { b.style.pointerEvents = 'none'; });
}

// ══════════════════════════════════════════════
//  Tab 4: Group Interview Guide
// ══════════════════════════════════════════════

function renderGroupCases() {
  const content = document.getElementById('z4Content');

  content.innerHTML = `
    <!-- Strategy -->
    <div style="margin-bottom:24px;">
      <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin-bottom:12px;">🧠 群面生存法则</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.78rem;color:var(--text-dim);line-height:1.8;">
        <div style="border:1px solid rgba(138,200,160,0.2);border-radius:3px;padding:12px 14px;">
          <div style="color:var(--accent-green);font-weight:600;margin-bottom:4px;">✅ DO</div>
          <div>✓ 做"好合作的队友"而非"抢眼的个人"</div>
          <div>✓ 用"而且"替代"但是"</div>
          <div>✓ 给他人发言后做简短总结再补充</div>
          <div>✓ 用"我们是否可以先明确..."来推动节奏</div>
          <div>✓ 注意时间管理，适时提醒团队进度</div>
        </div>
        <div style="border:1px solid rgba(200,138,126,0.2);border-radius:3px;padding:12px 14px;">
          <div style="color:var(--accent-red);font-weight:600;margin-bottom:4px;">❌ DON'T</div>
          <div>✗ 打断别人说话</div>
          <div>✗ 说"我不同意"（改为"我有一个补充角度"）</div>
          <div>✗ 沉默不语（至少贡献3次有效发言）</div>
          <div>✗ 垄断发言时间（每次不超过45秒）</div>
          <div>✗ 说"这个不对"（改为"我们能否换个思路"）</div>
        </div>
      </div>
    </div>

    <!-- Role guide -->
    <div style="margin-bottom:24px;">
      <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin-bottom:12px;">🎭 角色选择策略</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="rolesGrid"></div>
    </div>

    <!-- Cases -->
    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin-bottom:12px;">📋 经典群面案例</h4>
    <div id="casesContainer"></div>
  `;

  // Roles
  const roles = [
    { role: '🐺 Leader', desc: '推动讨论框架、把控节奏、确保产出', best: '适合逻辑清晰、善于组织的人', risk: '风险：如果没组织好，第一个被淘汰' },
    { role: '⏱️ Timer', desc: '管理时间分配、提醒关键节点', best: '适合细心、有全局观的人', risk: '风险：不能只报时间，要结合内容提醒' },
    { role: '📝 Recorder', desc: '记录要点、整理框架、做最后总结', best: '适合结构化思维强的人', risk: '风险：花了太多时间记录而没参与讨论' },
    { role: '💡 Contributor', desc: '贡献核心观点和解决方案', best: '适合有行业知识或创意的人', risk: '风险：说太少=没存在感，说太多=aggressive' },
  ];
  const rolesGrid = document.getElementById('rolesGrid');
  roles.forEach(r => {
    rolesGrid.innerHTML += `
      <div style="border:1px solid rgba(200,169,110,0.12);border-radius:3px;padding:12px 14px;font-size:0.78rem;">
        <div style="color:var(--gold-light);font-weight:600;margin-bottom:4px;">${r.role}</div>
        <div style="color:var(--text-dim);line-height:1.7;">${r.desc}</div>
        <div style="color:var(--accent-blue);font-size:0.7rem;margin-top:4px;">${r.best}</div>
        <div style="color:var(--accent-red);font-size:0.7rem;">${r.risk}</div>
      </div>
    `;
  });

  // Cases
  const casesDiv = document.getElementById('casesContainer');
  GROUP_CASES.forEach((gc, i) => {
    casesDiv.innerHTML += `
      <div class="group-case-card" style="border:1px solid rgba(200,169,110,0.12);border-radius:3px;padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:all 0.3s ease;">
        <div style="font-size:0.95rem;color:var(--gold-light);letter-spacing:0.06em;margin-bottom:6px;">案例${i + 1}：${gc.title}</div>
        <div style="font-size:0.82rem;color:var(--text-dim);line-height:1.8;">${gc.scenario}</div>
        <div class="gc-detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(200,169,110,0.08);">
          <div style="font-size:0.78rem;color:var(--gold-light);margin-bottom:4px;">📐 推荐框架</div>
          <div style="font-size:0.82rem;color:var(--accent-blue);margin-bottom:10px;">${gc.framework}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            ${Object.entries(gc.roles).map(([rk, rv]) => `<span style="font-size:0.7rem;padding:4px 10px;border:1px solid rgba(200,169,110,0.15);border-radius:2px;color:var(--text-dim);">${rk}: ${rv}</span>`).join('')}
          </div>
          <div style="font-size:0.78rem;color:var(--gold-light);margin-bottom:4px;">💡 破题思路</div>
          <ul style="font-size:0.78rem;color:var(--text-dim);line-height:1.9;padding-left:16px;">
            ${gc.hints.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  });

  // Click to expand cases
  document.querySelectorAll('.group-case-card').forEach(card => {
    card.addEventListener('click', function() {
      const detail = this.querySelector('.gc-detail');
      const isOpen = detail.style.display === 'block';
      detail.style.display = isOpen ? 'none' : 'block';
      this.style.borderColor = isOpen ? 'rgba(200,169,110,0.12)' : 'rgba(200,169,110,0.4)';
    });
  });
}
