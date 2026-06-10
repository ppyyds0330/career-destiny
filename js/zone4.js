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

  content.innerHTML = `
    <div style="margin-bottom:24px;">
      <p style="font-size:0.9rem;color:var(--text-dim);line-height:1.9;text-align:center;">
        逐项检查你的简历，勾选已完成的条目。<br>
        完成后系统会给出<strong style="color:var(--gold-light);">综合评分</strong>和改进建议。
      </p>
    </div>

    <!-- Score Display -->
    <div style="text-align:center;margin-bottom:24px;" id="resumeScore"></div>

    <!-- Checklist -->
    <div id="checklistContainer"></div>

    <!-- Industry Templates -->
    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin:28px 0 14px;">📝 行业简历模板</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="templateContainer"></div>
  `;

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
