/* ============================================================
   Career Destiny — Application Logic
   Starfield, Navigation, Zone 1/2/3 controllers
   ============================================================ */

// ── State ────────────────────────────────────
const STATE = {
  activeZone: 'zone1',
  // Zone 1
  quizStep: 1,
  quizAnswers: [],       // { questionId, choiceIndex, effects }
  mbtiScores: { IE: 0, TF: 0, JP: 0, SN: 0 },
  profile: {
    grade: '',
    major: '',
    skills: [],
    targetIndustries: [],
  },
  willingness: {
    industries: [],
    priorities: [],      // [id, id, id] top 3 in order
    salary: '',
  },
  recommendations: [],
  lockedJobId: null,      // ID of the job locked in Zone 1
  // Zone 2
  selectedJobId: null,
  // Zone 3
  skillProgress: {},      // { skillName: percentage }
  milestones: {},          // { milestoneKey: true/false }
};

// Load from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('career-destiny-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(STATE, parsed);
    }
  } catch (e) { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem('career-destiny-state', JSON.stringify(STATE));
  } catch (e) { /* ignore */ }
}

// ── Toast ────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Zone Navigation ──────────────────────────
function switchZone(zoneId) {
  STATE.activeZone = zoneId;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-tab[data-zone="${zoneId}"]`)?.classList.add('active');
  document.querySelectorAll('.zone-container').forEach(z => z.classList.remove('active'));
  document.getElementById(zoneId)?.classList.add('active');

  if (zoneId === 'zone1') renderZone1();
  if (zoneId === 'zone2') renderZone2();
  if (zoneId === 'zone3') renderZone3();

  updateNavBadge();
  saveState();
}

function updateNavBadge() {
  const badge = document.querySelector('.nav-tab[data-zone="zone2"] .badge');
  if (badge) {
    if (STATE.lockedJobId && STATE.activeZone !== 'zone2') {
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }
}

// ── Starfield ────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], dusts = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function create() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 1800);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        speed: Math.random() * 0.015 + 0.005,
        offset: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.5 + 0.4,
      });
    }
    dusts = [];
    for (let i = 0; i < 30; i++) {
      dusts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 40 + 20,
        alpha: Math.random() * 0.03 + 0.01,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.1 - 0.05,
      });
    }
  }
  create();
  window.addEventListener('resize', create);

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dusts.forEach(d => {
      d.x += d.speedX;
      d.y += d.speedY;
      if (d.x < -60) d.x = canvas.width + 60;
      if (d.x > canvas.width + 60) d.x = -60;
      if (d.y < -60) d.y = canvas.height + 60;
      if (d.y > canvas.height + 60) d.y = -60;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      g.addColorStop(0, `rgba(180,160,120,${d.alpha})`);
      g.addColorStop(0.5, `rgba(140,120,180,${d.alpha * 0.5})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    });
    stars.forEach(s => {
      const alpha = s.baseAlpha + Math.sin(time * s.speed + s.offset) * 0.3;
      ctx.fillStyle = `rgba(200,190,170,${Math.max(0.1, alpha)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// ══════════════════════════════════════════════
//  ZONE 1 — 职业罗盘 (Career Compass)
// ══════════════════════════════════════════════

function renderZone1() {
  const container = document.getElementById('zone1');
  if (!container) return;

  switch (STATE.quizStep) {
    case 1: renderZ1_Opening(container); break;
    case 2: renderZ1_Quiz(container); break;
    case 3: renderZ1_Profile(container); break;
    case 4: renderZ1_Willingness(container); break;
    case 5: renderZ1_Results(container); break;
    default: renderZ1_Opening(container);
  }
}

// ── Step 1: Opening ──────────────────────────
function renderZ1_Opening(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="step-indicator">
        <div class="step-dot"><div class="step-circle current">1</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">2</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">3</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">4</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">5</div></div>
      </div>
      <div style="display:flex;justify-content:center;gap:72px;margin-top:-20px;margin-bottom:32px;">
        <span class="step-label active" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;">开启</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;">性格测评</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;">我的档案</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;">我的意愿</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;">推荐结果</span>
      </div>

      <div class="section-title">职业罗盘</div>
      <div class="section-subtitle">CAREER COMPASS</div>
      <div class="divider-line"></div>
      <p style="text-align:center;font-size:0.9rem;line-height:2.1;color:#9a9080;letter-spacing:0.06em;margin-bottom:36px;">
        不知道自己适合做什么？<br>
        让我们用<strong style="color:var(--gold-light);">8道选择题</strong>来读懂你的性格，<br>
        再结合你的专业背景和内心意愿，<br>
        为你找到那个让你<strong style="color:var(--gold-light);">"眼睛发光"</strong>的方向。
      </p>
      <button class="btn-primary btn-block" style="max-width:280px;margin:0 auto;" onclick="Z1_nextStep(2)">
        开 始 测 评
      </button>
    </div>
  `;
}

// ── Step 2: MBTI Quiz ────────────────────────
let z1_currentQuestion = 0;
let z1_quizFinished = false;

function renderZ1_Quiz(container) {
  STATE.quizAnswers = [];
  STATE.mbtiScores = { IE: 0, TF: 0, JP: 0, SN: 0 };
  z1_currentQuestion = 0;
  z1_quizFinished = false;

  renderZ1_QuizQuestion(container);
}

function renderZ1_QuizQuestion(container) {
  const q = QUIZ_QUESTIONS[z1_currentQuestion];
  const total = QUIZ_QUESTIONS.length;
  const pct = ((z1_currentQuestion + 1) / total) * 100;

  container.innerHTML = `
    <div class="card" id="quizCard">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="step-indicator">
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle current">2</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">3</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">4</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">5</div></div>
      </div>
      <div style="display:flex;justify-content:center;gap:72px;margin-top:-20px;margin-bottom:32px;">
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">开启</span>
        <span class="step-label active" style="font-size:0.7rem;color:var(--text-dim);">性格测评</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的档案</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的意愿</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">推荐结果</span>
      </div>

      <div class="section-title" style="font-size:1.4rem;">第 ${z1_currentQuestion + 1} / ${total} 题</div>
      <p style="text-align:center;font-size:0.85rem;color:var(--text-dim);margin-bottom:20px;letter-spacing:0.08em;">${q.narrative}</p>
      <p style="text-align:center;font-size:1.1rem;color:var(--gold-light);margin-bottom:28px;letter-spacing:0.06em;line-height:1.7;">${q.text}</p>

      <div class="quiz-choices" id="quizChoices"></div>

      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-text">${z1_currentQuestion + 1}/${total}</span>
      </div>
    </div>
  `;

  const choicesDiv = document.getElementById('quizChoices');
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-choice';
    btn.innerHTML = `<span class="q-icon">${c.icon}</span>${c.text}`;
    btn.style.animationDelay = `${i * 0.1}s`;
    btn.addEventListener('click', () => handleQuizAnswer(i, btn));
    choicesDiv.appendChild(btn);
    // Trigger animation
    requestAnimationFrame(() => {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        btn.style.transition = 'all 0.4s ease';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      });
    });
  });
}

function handleQuizAnswer(choiceIndex, btn) {
  if (z1_quizFinished) return;

  const q = QUIZ_QUESTIONS[z1_currentQuestion];
  const choice = q.choices[choiceIndex];

  // Highlight selected
  document.querySelectorAll('.quiz-choice').forEach(b => b.classList.add('disabled'));
  btn.classList.add('selected');

  // Apply scores
  Object.entries(choice.effect).forEach(([dim, val]) => {
    STATE.mbtiScores[dim] += val;
  });
  STATE.quizAnswers.push({ questionId: q.id, choiceIndex, effects: choice.effect });

  // Next after delay
  setTimeout(() => {
    z1_currentQuestion++;
    if (z1_currentQuestion < QUIZ_QUESTIONS.length) {
      const container = document.getElementById('zone1');
      renderZ1_QuizQuestion(container);
    } else {
      z1_quizFinished = true;
      Z1_nextStep(3);
    }
  }, 500);
}

// ── Step 3: Profile ──────────────────────────
function renderZ1_Profile(container) {
  const selectedSkills = STATE.profile.skills || [];
  const selectedIndustries = STATE.profile.targetIndustries || [];

  container.innerHTML = `
    <div class="card" style="max-width:720px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="step-indicator">
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle current">3</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">4</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">5</div></div>
      </div>
      <div style="display:flex;justify-content:center;gap:72px;margin-top:-20px;margin-bottom:32px;">
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">开启</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">性格测评</span>
        <span class="step-label active" style="font-size:0.7rem;color:var(--text-dim);">我的档案</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的意愿</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">推荐结果</span>
      </div>

      <div class="section-title" style="font-size:1.4rem;">我的档案</div>
      <div class="section-subtitle">告诉系统你的基本情况</div>

      <div class="form-group">
        <label class="form-label">年级</label>
        <select class="form-select" id="inputGrade">
          <option value="">请选择年级</option>
          ${GRADE_OPTIONS.map(g => `<option value="${g}" ${STATE.profile.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">专业</label>
        <input class="form-input" id="inputMajor" placeholder="输入专业名称，支持模糊搜索" value="${STATE.profile.major || ''}" autocomplete="off">
        <div id="majorSuggestions" style="margin-top:4px;max-height:140px;overflow-y:auto;display:none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label">我已掌握的技能（多选）</label>
        <div class="tag-group" id="skillTags">
          ${SKILL_TAGS.map(s => {
            const sel = selectedSkills.includes(s) ? ' selected' : '';
            return `<button class="tag-chip${sel}" data-skill="${s}">${s}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">感兴趣的方向（多选）</label>
        <div class="tag-group" id="industryTags">
          ${INDUSTRY_TAGS.map(ind => {
            const sel = selectedIndustries.includes(ind) ? ' selected' : '';
            return `<button class="tag-chip${sel}" data-industry="${ind}">${ind}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="btn-row">
        <button class="btn-secondary" onclick="Z1_nextStep(2)">← 上一步</button>
        <button class="btn-primary" id="btnProfileNext" onclick="Z1_saveProfile()">下一步 →</button>
      </div>
    </div>
  `;

  // Tag click handlers
  document.querySelectorAll('#skillTags .tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
  });
  document.querySelectorAll('#industryTags .tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
  });

  // Major autocomplete
  const majorInput = document.getElementById('inputMajor');
  const suggestionsDiv = document.getElementById('majorSuggestions');
  majorInput.addEventListener('input', () => {
    const query = majorInput.value.trim();
    if (query.length < 1) { suggestionsDiv.style.display = 'none'; return; }
    const results = searchMajors(query);
    if (results.length > 0) {
      suggestionsDiv.innerHTML = results.map(m =>
        `<div style="padding:8px 14px;cursor:pointer;font-size:0.85rem;color:#b0a088;border-bottom:1px solid rgba(255,255,255,0.03);" onmousedown="event.preventDefault();document.getElementById('inputMajor').value='${m}';document.getElementById('majorSuggestions').style.display='none';">${m}</div>`
      ).join('');
      suggestionsDiv.style.display = 'block';
      suggestionsDiv.style.background = 'rgba(20,20,35,0.98)';
      suggestionsDiv.style.border = '1px solid rgba(200,169,110,0.2)';
      suggestionsDiv.style.borderRadius = '3px';
    } else {
      suggestionsDiv.style.display = 'none';
    }
  });
  majorInput.addEventListener('blur', () => {
    setTimeout(() => { suggestionsDiv.style.display = 'none'; }, 200);
  });
}

function Z1_saveProfile() {
  const grade = document.getElementById('inputGrade').value;
  const major = document.getElementById('inputMajor').value.trim();

  if (!grade) { showToast('请选择年级'); return; }
  if (!major) { showToast('请输入专业'); return; }

  const skills = [];
  document.querySelectorAll('#skillTags .tag-chip.selected').forEach(b => {
    skills.push(b.dataset.skill);
  });
  const industries = [];
  document.querySelectorAll('#industryTags .tag-chip.selected').forEach(b => {
    industries.push(b.dataset.industry);
  });

  STATE.profile = { grade, major, skills, targetIndustries: industries };
  saveState();
  Z1_nextStep(4);
}

// ── Step 4: Willingness ──────────────────────
function renderZ1_Willingness(container) {
  const selInd = STATE.willingness.industries || [];
  const priorities = STATE.willingness.priorities || [];
  const salary = STATE.willingness.salary || '';

  // Ensure top 3 priorities with defaults
  const top3 = [];
  for (const p of PRIORITY_OPTIONS) {
    if (priorities.includes(p.id)) top3.push(p.id);
  }
  // Fill remaining from PRIORITY_OPTIONS
  for (const p of PRIORITY_OPTIONS) {
    if (top3.length >= 3) break;
    if (!top3.includes(p.id)) top3.push(p.id);
  }
  STATE.willingness.priorities = top3.slice(0, 3);

  container.innerHTML = `
    <div class="card" style="max-width:720px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="step-indicator">
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle current">4</div><div class="step-line"></div></div>
        <div class="step-dot"><div class="step-circle">5</div></div>
      </div>
      <div style="display:flex;justify-content:center;gap:72px;margin-top:-20px;margin-bottom:32px;">
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">开启</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">性格测评</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的档案</span>
        <span class="step-label active" style="font-size:0.7rem;color:var(--text-dim);">我的意愿</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">推荐结果</span>
      </div>

      <div class="section-title" style="font-size:1.4rem;">我的意愿</div>
      <div class="section-subtitle">你心里想去哪里？</div>

      <div class="form-group">
        <label class="form-label">你想去哪些方向？（多选）</label>
        <div class="tag-group" id="wIndustryTags">
          ${INDUSTRY_TAGS.map(ind => {
            const sel = selInd.includes(ind) ? ' selected' : '';
            return `<button class="tag-chip${sel}" data-ind="${ind}">${ind}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">你最看重什么？（点击 ↑↓ 排序，第1最重要）</label>
        <div class="priority-list" id="priorityList">
          ${top3.map((id, rank) => {
            const opt = PRIORITY_OPTIONS.find(o => o.id === id);
            return `
              <div class="priority-item" data-pid="${opt.id}">
                <span class="priority-rank p${rank + 1}">${rank + 1}</span>
                <div>
                  <div class="priority-label">${opt.label}</div>
                  <div style="font-size:0.7rem;color:var(--text-dim);margin-top:2px;">${opt.desc}</div>
                </div>
                <div class="priority-arrows">
                  ${rank > 0 ? `<button onclick="Z1_movePriority('${opt.id}', -1)">▲</button>` : ''}
                  ${rank < 2 ? `<button onclick="Z1_movePriority('${opt.id}', 1)">▼</button>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">期望薪资（应届起薪）</label>
        <select class="form-select" id="inputSalary">
          <option value="">请选择</option>
          <option value="low" ${salary === 'low' ? 'selected' : ''}>8K 以下</option>
          <option value="mid" ${salary === 'mid' ? 'selected' : ''}>8K - 15K</option>
          <option value="high" ${salary === 'high' ? 'selected' : ''}>15K - 25K</option>
          <option value="any" ${salary === 'any' ? 'selected' : ''}>不在意薪资</option>
        </select>
      </div>

      <div class="btn-row">
        <button class="btn-secondary" onclick="Z1_nextStep(3)">← 上一步</button>
        <button class="btn-primary" onclick="Z1_saveWillingness()">查看推荐结果 →</button>
      </div>
    </div>
  `;

  // Tag handlers
  document.querySelectorAll('#wIndustryTags .tag-chip').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
}

function Z1_movePriority(pid, direction) {
  const priorities = [...STATE.willingness.priorities];
  const idx = priorities.indexOf(pid);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= priorities.length) return;
  [priorities[idx], priorities[newIdx]] = [priorities[newIdx], priorities[idx]];
  STATE.willingness.priorities = priorities;
  renderZ1_Willingness(document.getElementById('zone1'));
}

function Z1_saveWillingness() {
  const industries = [];
  document.querySelectorAll('#wIndustryTags .tag-chip.selected').forEach(b => {
    industries.push(b.dataset.ind);
  });
  const salary = document.getElementById('inputSalary').value;

  STATE.willingness.industries = industries;
  STATE.willingness.salary = salary;
  saveState();

  // Compute recommendations
  computeRecommendations();
  Z1_nextStep(5);
}

// ── Recommendation Engine ────────────────────
function computeRecommendations() {
  const { mbtiScores, profile, willingness } = STATE;

  // Determine MBTI type profile
  const ieLabel = mbtiScores.IE >= 0 ? 'E' : 'I';
  const tfLabel = mbtiScores.TF >= 0 ? 'T' : 'F';
  const jpLabel = mbtiScores.JP >= 0 ? 'J' : 'P';
  const snLabel = mbtiScores.SN >= 0 ? 'N' : 'S';

  const scored = JOB_DATABASE.map(job => {
    // Personality match (0-40)
    const personalityScore = (() => {
      let s = 0;
      const mp = job.matchProfile;
      // Weighted personality alignment
      s += (mp.IE >= 0) === (mbtiScores.IE >= 0) ? 8 : 2;
      s += Math.abs(mbtiScores.IE) >= 3 ? (Math.sign(mp.IE) === Math.sign(mbtiScores.IE) ? 4 : 0) : 2;
      s += (mp.TF >= 0) === (mbtiScores.TF >= 0) ? 8 : 2;
      s += Math.abs(mbtiScores.TF) >= 3 ? (Math.sign(mp.TF) === Math.sign(mbtiScores.TF) ? 4 : 0) : 2;
      s += (mp.JP >= 0) === (mbtiScores.JP >= 0) ? 6 : 3;
      s += (mp.SN >= 0) === (mbtiScores.SN >= 0) ? 6 : 3;
      return s;
    })();

    // Industry match (0-30)
    const industryScore = (() => {
      if (!willingness.industries || willingness.industries.length === 0) return 15;
      if (willingness.industries.includes(job.industry)) return 30;
      // Check profile industries
      if (profile.targetIndustries && profile.targetIndustries.includes(job.industry)) return 20;
      return 5;
    })();

    // Background match (0-20)
    const bgScore = (() => {
      let s = 10;
      const major = (profile.major || '').toLowerCase();
      const skills = (profile.skills || []).map(sk => sk.toLowerCase());

      // Major-job keyword matching
      if ((job.id === 'frontend-dev' || job.id === 'backend-dev' || job.id === 'ai-engineer') &&
          (major.includes('计算机') || major.includes('软件') || major.includes('人工智能') || major.includes('数据'))) s += 6;
      if ((job.id === 'data-analyst') && (major.includes('统计') || major.includes('数学') || major.includes('数据') || major.includes('计算机'))) s += 6;
      if ((job.id === 'investment-analyst') && (major.includes('金融') || major.includes('经济') || major.includes('会计'))) s += 6;
      if ((job.id === 'product-manager' || job.id === 'product-operations') && (major.includes('管理') || major.includes('市场') || major.includes('计算机'))) s += 5;
      if ((job.id === 'consulting-analyst') && (major.includes('管理') || major.includes('经济') || major.includes('金融'))) s += 5;
      if ((job.id === 'civil-service') && (major.includes('行政') || major.includes('法学') || major.includes('政治') || major.includes('公共'))) s += 5;
      if ((job.id === 'marketing-brand') && (major.includes('市场') || major.includes('广告') || major.includes('传媒') || major.includes('新闻'))) s += 5;
      if ((job.id === 'hr-specialist') && (major.includes('人力') || major.includes('心理') || major.includes('管理'))) s += 5;
      if ((job.id === 'game-planner') && (major.includes('计算机') || major.includes('设计') || major.includes('数字媒体'))) s += 5;
      if ((job.id === 'new-media') && (major.includes('新闻') || major.includes('传媒') || major.includes('广告') || major.includes('中文'))) s += 5;
      if ((job.id === 'management-trainee') && (major.includes('管理') || major.includes('市场') || major.includes('经济'))) s += 4;
      // New jobs matching
      if ((job.id === 'ux-ui-designer') && (major.includes('设计') || major.includes('数字媒体') || major.includes('计算机'))) s += 6;
      if ((job.id === 'sre-devops' || job.id === 'security-engineer') && (major.includes('计算机') || major.includes('软件') || major.includes('网络') || major.includes('信息安全'))) s += 6;
      if ((job.id === 'embedded-engineer') && (major.includes('电子') || major.includes('自动化') || major.includes('计算机') || major.includes('通信'))) s += 6;
      if ((job.id === 'quantitative-analyst') && (major.includes('数学') || major.includes('统计') || major.includes('金融') || major.includes('计算机'))) s += 6;
      if ((job.id === 'accountant-auditor') && (major.includes('会计') || major.includes('财务') || major.includes('审计') || major.includes('金融'))) s += 6;
      if ((job.id === 'teacher') && (major.includes('教育') || major.includes('中文') || major.includes('数学') || major.includes('英语') || major.includes('物理'))) s += 5;
      if ((job.id === 'test-qa-engineer' || job.id === 'bi-engineer') && (major.includes('计算机') || major.includes('软件') || major.includes('数据') || major.includes('统计'))) s += 5;
      if ((job.id === 'ecommerce-ops') && (major.includes('电商') || major.includes('市场') || major.includes('管理') || major.includes('计算机'))) s += 5;
      if ((job.id === 'medical-pharma-sales') && (major.includes('药学') || major.includes('临床') || major.includes('生物') || major.includes('医学'))) s += 6;
      if ((job.id === 'automobile-engineer') && (major.includes('车辆') || major.includes('机械') || major.includes('自动化') || major.includes('电子') || major.includes('能源'))) s += 6;
      if ((job.id === 'legal-professional') && (major.includes('法学') || major.includes('法律'))) s += 6;
      if ((job.id === 'customer-success') && (major.includes('管理') || major.includes('市场') || major.includes('计算机') || major.includes('经济'))) s += 4;
      if ((job.id === 'content-editor') && (major.includes('新闻') || major.includes('中文') || major.includes('传媒') || major.includes('文学'))) s += 5;
      if ((job.id === 'architect-designer') && (major.includes('建筑') || major.includes('规划') || major.includes('设计') || major.includes('土木'))) s += 6;
      if ((job.id === 'real-estate-planning') && (major.includes('房地产') || major.includes('管理') || major.includes('经济') || major.includes('建筑'))) s += 5;
      if ((job.id === 'translator-localization') && (major.includes('英语') || major.includes('日语') || major.includes('翻译') || major.includes('外语'))) s += 6;
      if ((job.id === 'risk-manager') && (major.includes('金融') || major.includes('数学') || major.includes('统计') || major.includes('经济'))) s += 6;
      if ((job.id === 'sales-engineer') && (major.includes('计算机') || major.includes('电子') || major.includes('机械') || major.includes('自动化'))) s += 5;

      // Skill matching
      job.skills.forEach(sk => {
        if (skills.some(us => sk.name.toLowerCase().includes(us) || us.includes(sk.name.toLowerCase().split('/')[0]))) s += 2;
      });

      return Math.min(20, s);
    })();

    // Salary preference (0-10)
    const salaryScore = (() => {
      const pref = willingness.salary;
      if (!pref || pref === 'any') return 7;
      const salNum = parseInt(job.salary.match(/\d+/)?.[0] || '10');
      if (pref === 'low' && salNum <= 10) return 10;
      if (pref === 'low' && salNum > 10) return 4;
      if (pref === 'mid' && salNum >= 10 && salNum <= 18) return 10;
      if (pref === 'mid' && salNum > 18) return 5;
      if (pref === 'high' && salNum >= 18) return 10;
      if (pref === 'high' && salNum < 18) return 3;
      return 5;
    })();

    const total = personalityScore + industryScore + bgScore + salaryScore;
    const percent = Math.min(98, Math.round((total / 100) * 100));

    return {
      job,
      total,
      percent,
      personalityScore,
      industryScore,
      bgScore,
      salaryScore,
    };
  });

  scored.sort((a, b) => b.total - a.total);

  // Top matches
  const topMatches = scored.slice(0, 6);

  // Separate into "wanted" and "surprise"
  const wantedJobs = willingness.industries && willingness.industries.length > 0
    ? topMatches.filter(r => willingness.industries.includes(r.job.industry))
    : topMatches.slice(0, 3);

  const surpriseJobs = topMatches.filter(r => !wantedJobs.includes(r));

  STATE.recommendations = {
    all: topMatches,
    wanted: wantedJobs.slice(0, 3),
    surprise: surpriseJobs.slice(0, 2),
    mbtiType: `${ieLabel}${snLabel}${tfLabel}${jpLabel}`,
  };

  saveState();
}

// ── Step 5: Results ──────────────────────────
function renderZ1_Results(container) {
  const recs = STATE.recommendations;
  if (!recs || !recs.all) {
    Z1_nextStep(1);
    return;
  }

  const { wanted, surprise, mbtiType } = recs;

  container.innerHTML = `
    <div class="card" style="max-width:760px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="step-indicator">
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle done">✓</div><div class="step-line done"></div></div>
        <div class="step-dot"><div class="step-circle current">5</div></div>
      </div>
      <div style="display:flex;justify-content:center;gap:72px;margin-top:-20px;margin-bottom:32px;">
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">开启</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">性格测评</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的档案</span>
        <span class="step-label" style="font-size:0.7rem;color:var(--text-dim);">我的意愿</span>
        <span class="step-label active" style="font-size:0.7rem;color:var(--text-dim);">推荐结果</span>
      </div>

      <div class="section-title" style="font-size:1.3rem;">你的专属推荐</div>
      <div class="section-subtitle">性格类型：${mbtiType} · 综合匹配分析</div>

      <div id="resultContent"></div>

      <div class="btn-row" style="margin-top:24px;">
        <button class="btn-secondary" onclick="Z1_nextStep(1)">重新测评</button>
      </div>
    </div>
  `;

  const resultContent = document.getElementById('resultContent');

  // Wanted jobs section
  if (wanted.length > 0) {
    const wantedLabel = document.createElement('div');
    wantedLabel.className = 'reco-section-label';
    wantedLabel.textContent = '✦ 你心之所向的方向 ✦';
    resultContent.appendChild(wantedLabel);

    wanted.forEach(r => {
      resultContent.appendChild(createJobResultCard(r, false));
    });
  }

  // Surprise jobs section
  if (surprise.length > 0 && surprise[0].total > wanted[wanted.length - 1]?.total - 5) {
    const surpriseLabel = document.createElement('div');
    surpriseLabel.className = 'reco-section-label';
    surpriseLabel.style.marginTop = '28px';
    surpriseLabel.textContent = '✦ 你可能没想到的隐藏选项 ✦';
    resultContent.appendChild(surpriseLabel);

    surprise.slice(0, 2).forEach(r => {
      resultContent.appendChild(createJobResultCard(r, true));
    });
  }

  // Add click handlers for job cards
  resultContent.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('job-card-lock')) return;
      this.classList.toggle('expanded');
    });
  });

  // Lock buttons
  resultContent.querySelectorAll('.job-card-lock').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const jobId = this.dataset.jobId;
      STATE.lockedJobId = jobId;
      STATE.selectedJobId = jobId;
      saveState();
      // Update all lock buttons
      resultContent.querySelectorAll('.job-card-lock').forEach(b => {
        if (b.dataset.jobId === jobId) {
          b.textContent = '✓ 已锁定';
          b.classList.add('locked');
        } else {
          b.style.display = 'none';
        }
      });
      updateNavBadge();
      showToast('目标已锁定！前往「成长地图」查看详细培养计划');
    });
  });

  // Re-apply locked state
  if (STATE.lockedJobId) {
    resultContent.querySelectorAll('.job-card-lock').forEach(b => {
      if (b.dataset.jobId === STATE.lockedJobId) {
        b.textContent = '✓ 已锁定';
        b.classList.add('locked');
      } else {
        b.style.display = 'none';
      }
    });
  }
}

function createJobResultCard(result, isSurprise) {
  const { job, percent } = result;
  const matchClass = percent >= 85 ? 'high' : percent >= 70 ? 'medium' : 'low';

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="job-card" style="${isSurprise ? 'border-left: 2px solid var(--accent-purple);' : ''}">
      ${isSurprise ? '<span class="job-card-special surprise">性格契合</span>' : ''}
      <div class="job-card-header">
        <span class="job-card-title">${job.icon} ${job.title}</span>
        <span class="job-card-match ${matchClass}">★ 匹配度 ${percent}%</span>
      </div>
      <div class="job-card-meta">${job.industry} · ${job.salary}</div>
      <div class="job-card-tags">
        ${job.tags.map(t => `<span class="job-card-tag">${t}</span>`).join('')}
      </div>
      <div class="job-card-detail">
        <p>${job.description}</p>
        <h4>👤 适合谁</h4>
        <p>${job.personality}</p>
        <h4>☀️ 典型的一天</h4>
        <p style="font-size:0.82rem;color:var(--text-dim);">${job.dayInLife}</p>
        <h4>🏢 头部公司</h4>
        <p style="font-size:0.82rem;color:var(--text-dim);">${job.companies}</p>
        <h4>💰 薪资发展</h4>
        <p style="font-size:0.82rem;color:var(--text-dim);">${job.salaryRange}</p>
        <button class="job-card-lock" data-job-id="${job.id}">🔒 锁定这个目标</button>
      </div>
    </div>
  `;
  return wrapper.firstElementChild;
}

// ── Zone 1 Navigation ────────────────────────
function Z1_nextStep(step) {
  STATE.quizStep = step;
  saveState();
  renderZone1();
  // Scroll to top of card
  document.getElementById('zone1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════════════
//  ZONE 2 — 成长地图 (Growth Roadmap)
// ══════════════════════════════════════════════

function renderZone2() {
  const container = document.getElementById('zone2');
  if (!container) return;

  const selectedId = STATE.selectedJobId || STATE.lockedJobId;

  container.innerHTML = `
    <div class="card" style="max-width:780px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="section-title">成长地图</div>
      <div class="section-subtitle">GROWTH ROADMAP</div>
      <div class="divider-line"></div>

      <div class="form-group">
        <label class="form-label">选择你要查看的岗位</label>
        <div class="roadmap-job-selector" id="jobSelector">
          ${JOB_DATABASE.map(j => {
            const active = j.id === selectedId ? ' active' : '';
            const locked = j.id === STATE.lockedJobId ? ' locked-target' : '';
            return `<button class="roadmap-job-chip${active}${locked}" data-job-id="${j.id}">${j.icon} ${j.title}</button>`;
          }).join('')}
        </div>
      </div>

      <div id="roadmapContent"></div>
    </div>
  `;

  // Job selector handlers
  document.querySelectorAll('#jobSelector .roadmap-job-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      STATE.selectedJobId = this.dataset.jobId;
      saveState();
      renderZone2();
    });
  });

  // Render selected job roadmap
  if (selectedId) {
    renderRoadmapForJob(selectedId);
  } else {
    document.getElementById('roadmapContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗺️</div>
        <p>请选择一个岗位，查看详细的培养计划<br>或前往「职业罗盘」锁定你的目标</p>
      </div>
    `;
  }
}

function renderRoadmapForJob(jobId) {
  const job = getJobById(jobId);
  if (!job) return;

  const content = document.getElementById('roadmapContent');
  const years = ['freshman', 'sophomore', 'junior', 'senior'];

  content.innerHTML = `
    <div style="margin-bottom:24px;">
      <h3 style="color:var(--gold-light);font-size:1.2rem;letter-spacing:0.08em;">${job.icon} ${job.title}</h3>
      <p style="color:var(--text-dim);font-size:0.85rem;margin-top:6px;line-height:1.8;">${job.description}</p>
      <div class="job-card-tags" style="margin-top:8px;">${job.tags.map(t => `<span class="job-card-tag">${t}</span>`).join('')}</div>
    </div>

    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin-bottom:8px;">🎯 四年培养路线图</h4>
    <div class="timeline" id="timelineContainer"></div>

    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin:24px 0 12px;">🌳 技能树</h4>
    <div class="skill-tree" id="skillTreeContainer"></div>

    <h4 style="color:var(--gold-light);font-size:0.95rem;letter-spacing:0.1em;margin:24px 0 12px;">🏭 行业全景</h4>
    <div id="industryOverview"></div>
  `;

  // Render timeline
  const timelineDiv = document.getElementById('timelineContainer');
  years.forEach((yr, idx) => {
    const data = job.roadmap[yr];
    const isCurrent = idx === 0;
    timelineDiv.innerHTML += `
      <div class="timeline-item ${isCurrent ? 'current' : ''}">
        <div class="tl-title">${data.title}</div>
        <div class="tl-desc">
          ${data.items.map(i => `— ${i}`).join('<br>')}
        </div>
      </div>
    `;
  });

  // Render skill tree
  const skillDiv = document.getElementById('skillTreeContainer');
  job.skills.forEach(sk => {
    const typeClass = sk.type === 'required' ? 'required' : sk.type === 'recommended' ? 'recommended' : 'advanced';
    const typeTag = sk.type === 'required' ? 'required-tag' : sk.type === 'recommended' ? 'recommended-tag' : 'advanced-tag';
    const typeLabel = sk.type === 'required' ? '必修' : sk.type === 'recommended' ? '推荐' : '进阶';
    skillDiv.innerHTML += `
      <div class="skill-node ${typeClass}">
        <div class="sn-name">${sk.name}</div>
        <span class="sn-type ${typeTag}">${typeLabel}</span>
        <div class="sn-desc">${sk.desc}</div>
      </div>
    `;
  });

  // Render industry overview
  const overviewDiv = document.getElementById('industryOverview');
  const industryData = INDUSTRY_OVERVIEWS[job.industry] || INDUSTRY_OVERVIEWS['互联网/科技'];
  if (industryData) {
    overviewDiv.innerHTML = `
      <div style="border:1px solid rgba(200,169,110,0.15);border-radius:3px;padding:18px 20px;background:rgba(255,255,255,0.015);margin-bottom:14px;">
        <p style="font-size:0.9rem;line-height:1.9;color:#b0a090;letter-spacing:0.04em;">${industryData.summary}</p>
      </div>
      <div style="margin-bottom:14px;">
        <h5 style="color:var(--gold-light);font-size:0.8rem;letter-spacing:0.1em;margin-bottom:8px;">📈 行业趋势</h5>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${industryData.trends.map(t => `<span style="padding:5px 12px;border:1px solid rgba(126,168,200,0.3);border-radius:2px;font-size:0.75rem;color:var(--accent-blue);letter-spacing:0.04em;">${t}</span>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <h5 style="color:var(--accent-green);font-size:0.78rem;letter-spacing:0.1em;margin-bottom:6px;">✅ 优势</h5>
          <ul style="list-style:none;padding:0;font-size:0.8rem;color:var(--text-dim);line-height:2;">
            ${industryData.pros.map(p => `<li>+ ${p}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h5 style="color:var(--accent-red);font-size:0.78rem;letter-spacing:0.1em;margin-bottom:6px;">⚠️ 挑战</h5>
          <ul style="list-style:none;padding:0;font-size:0.8rem;color:var(--text-dim);line-height:2;">
            ${industryData.cons.map(c => `<li>- ${c}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div style="margin-top:12px;">
        <span style="font-size:0.75rem;color:var(--gold-dim);letter-spacing:0.08em;">热门城市：</span>
        <span style="font-size:0.78rem;color:var(--text-dim);">${industryData.topCities.join(' · ')}</span>
      </div>
      <div style="margin-top:6px;">
        <span style="font-size:0.75rem;color:var(--gold-dim);letter-spacing:0.08em;">稀缺技能：</span>
        <span style="font-size:0.78rem;color:var(--text-dim);">${industryData.hotSkills.join(' · ')}</span>
      </div>
    `;
  }
}

// ══════════════════════════════════════════════
//  ZONE 3 — 成长仪表盘 (Growth Dashboard)
// ══════════════════════════════════════════════

function renderZone3() {
  const container = document.getElementById('zone3');
  if (!container) return;

  const jobId = STATE.lockedJobId || STATE.selectedJobId;
  const job = jobId ? getJobById(jobId) : null;

  if (!job) {
    container.innerHTML = `
      <div class="card">
        <div class="card-ornament">◆ ◇ ◆</div>
        <div class="section-title">成长仪表盘</div>
        <div class="section-subtitle">GROWTH DASHBOARD</div>
        <div class="divider-line"></div>
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p>请先在「职业罗盘」锁定目标岗位<br>或在「成长地图」选择一个岗位</p>
        </div>
      </div>
    `;
    return;
  }

  // Calculate admission probability
  const skillProgress = STATE.skillProgress || {};
  const milestones = STATE.milestones || {};

  // Compute skill completion
  const totalSkills = job.skills.length;
  let skillCompletionSum = 0;
  job.skills.forEach(sk => {
    skillCompletionSum += (skillProgress[sk.name] || 0);
  });
  const skillAvg = totalSkills > 0 ? skillCompletionSum / totalSkills : 0;

  // Compute milestone completion
  const milestoneKeys = ['certificate', 'internship', 'project', 'competition'];
  let milestoneDone = 0;
  milestoneKeys.forEach(k => {
    if (milestones[`${job.id}_${k}`]) milestoneDone++;
  });
  const milestoneRate = milestoneKeys.length > 0 ? milestoneDone / milestoneKeys.length : 0;

  // Admission probability: weighted
  const probability = Math.round(skillAvg * 0.6 + milestoneRate * 100 * 0.4);

  container.innerHTML = `
    <div class="card" style="max-width:780px;">
      <div class="card-ornament">◆ ◇ ◆</div>
      <div class="section-title">成长仪表盘</div>
      <div class="section-subtitle">${job.icon} ${job.title} · 录取概率追踪</div>
      <div class="divider-line"></div>

      <div class="dashboard-grid">
        <!-- Gauge -->
        <div class="dash-card" style="text-align:center;">
          <h4>录取概率指数</h4>
          <div class="gauge-wrap">
            <svg width="160" height="90" viewBox="0 0 160 90" id="gaugeSvg">
              <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round"/>
              <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke="url(#gaugeGrad)" stroke-width="12" stroke-linecap="round"
                stroke-dasharray="${probability * 2.04} 204" id="gaugeFill"/>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#c88a7e"/>
                  <stop offset="50%" stop-color="#e0c882"/>
                  <stop offset="100%" stop-color="#8ac8a0"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="gauge-value" id="gaugeValue">${probability}%</div>
            <div class="gauge-label">${probability >= 70 ? '大有希望！' : probability >= 40 ? '继续加油' : '任重道远'}</div>
          </div>
        </div>

        <!-- Milestones -->
        <div class="dash-card">
          <h4>里程碑打卡</h4>
          <div class="milestone-list" id="milestoneList"></div>
        </div>

        <!-- Skill progress -->
        <div class="dash-card full-width">
          <h4>技能掌握度（点击进度条更新进度）</h4>
          <div class="skill-progress-list" id="skillProgressList"></div>
        </div>

        <!-- Next Steps -->
        <div class="dash-card full-width">
          <h4>📋 下一步行动建议</h4>
          <div id="nextSteps" style="font-size:0.85rem;color:var(--text-dim);line-height:2;"></div>
        </div>
      </div>

      <div class="btn-row" style="margin-top:20px;">
        <button class="btn-secondary" onclick="Z3_resetProgress()">重置进度</button>
      </div>
    </div>
  `;

  // Render milestones
  const msList = document.getElementById('milestoneList');
  const msConfig = [
    { key: 'certificate', label: '相关证书/认证', icon: '📜' },
    { key: 'internship', label: '完成一段实习', icon: '💼' },
    { key: 'project', label: '完整项目/作品集', icon: '🛠️' },
    { key: 'competition', label: '参加比赛/获得奖项', icon: '🏆' },
  ];
  msConfig.forEach(ms => {
    const fullKey = `${job.id}_${ms.key}`;
    const done = milestones[fullKey] || false;
    const div = document.createElement('div');
    div.className = 'milestone-item';
    div.innerHTML = `
      <div class="milestone-check ${done ? 'done' : ''}">${done ? '✓' : ''}</div>
      <span class="milestone-text ${done ? 'done' : ''}">${ms.icon} ${ms.label}</span>
    `;
    div.addEventListener('click', () => {
      STATE.milestones[fullKey] = !(STATE.milestones[fullKey] || false);
      saveState();
      renderZone3();
    });
    msList.appendChild(div);
  });

  // Render skill progress bars
  const skillList = document.getElementById('skillProgressList');
  job.skills.forEach(sk => {
    const pct = skillProgress[sk.name] || 0;
    const div = document.createElement('div');
    div.className = 'skill-progress-item';
    div.innerHTML = `
      <div class="skill-progress-header">
        <span class="skill-progress-name">${sk.name} <span style="font-size:0.68rem;color:var(--gold-dim);">(${sk.type === 'required' ? '必修' : sk.type === 'recommended' ? '推荐' : '进阶'})</span></span>
        <span class="skill-progress-pct">${pct}%</span>
      </div>
      <div class="skill-progress-bar" data-skill="${sk.name}">
        <div class="skill-progress-fill" style="width:${pct}%"></div>
      </div>
    `;
    // Click to update progress
    div.querySelector('.skill-progress-bar').addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newPct = Math.round((x / rect.width) * 100);
      STATE.skillProgress[sk.name] = Math.max(0, Math.min(100, newPct));
      saveState();
      renderZone3();
    });
    skillList.appendChild(div);
  });

  // Next steps
  const nextDiv = document.getElementById('nextSteps');
  const suggestions = [];
  // Find lowest skill
  let lowestSkill = null, lowestPct = 100;
  job.skills.forEach(sk => {
    const pct = skillProgress[sk.name] || 0;
    if (pct < lowestPct) { lowestPct = pct; lowestSkill = sk; }
  });
  if (lowestSkill && lowestPct < 60) {
    suggestions.push(`<strong style="color:var(--gold-light);">最需要提升：</strong>${lowestSkill.name} —— ${lowestSkill.desc}`);
  }
  if (milestoneRate < 0.5) {
    suggestions.push('<strong style="color:var(--accent-red);">里程碑差距较大</strong>，建议优先完成证书和实习');
  }
  if (probability >= 70) {
    suggestions.push('🎉 整体准备不错，可以开始关注目标公司的<strong style="color:var(--gold-light);">招聘动态</strong>和<strong style="color:var(--gold-light);">内推渠道</strong>');
  }
  if (probability < 40) {
    suggestions.push('<strong style="color:var(--accent-red);">距离目标还有差距</strong>，建议制定每天2小时的系统学习计划');
  }
  if (suggestions.length === 0) {
    suggestions.push('开始更新你的学习进度吧！点击进度条可以快速调整完成度。');
  }
  nextDiv.innerHTML = suggestions.map(s => `<div>— ${s}</div>`).join('');

  // Animate gauge
  setTimeout(() => {
    const gaugeFill = document.getElementById('gaugeFill');
    if (gaugeFill) {
      gaugeFill.style.transition = 'all 1s ease';
      gaugeFill.setAttribute('stroke-dasharray', `${probability * 2.04} 204`);
    }
  }, 200);
}

function Z3_resetProgress() {
  if (confirm('确定要重置所有学习进度吗？此操作不可恢复。')) {
    STATE.skillProgress = {};
    STATE.milestones = {};
    saveState();
    renderZone3();
  }
}

// ══════════════════════════════════════════════
//  Initialization
// ══════════════════════════════════════════════

function init() {
  loadState();
  initStarfield();
  renderZone1();
  updateNavBadge();

  // Navigation click handlers
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      switchZone(this.dataset.zone);
    });
  });

  // Keyboard: Enter to progress in Zone 1
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && STATE.activeZone === 'zone1') {
      if (STATE.quizStep === 1) {
        Z1_nextStep(2);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
