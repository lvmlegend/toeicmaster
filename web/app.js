// ============================================================================
// 🌸 SAKURA TOEIC 650+ ACADEMY - MAIN APPLICATION LOGIC (EYE-FRIENDLY EDITION)
// ============================================================================

const PART_RANGES = {
  1: [1, 6],
  2: [7, 31],
  3: [32, 70],
  4: [71, 100],
  5: [101, 130],
  6: [131, 146],
  7: [147, 200]
};

const MASCOT_TIPS = [
  'Ganbatte ne, Senpai~! 🌸 Để đạt TOEIC 650+, bạn chỉ cần đúng khoảng 132/200 câu (LC ~67 câu + RC ~65 câu) thôi đó!',
  '💡 Mẹo Part 1: Nếu tranh KHÔNG có người mà nghe thấy "being + V3/ed" (ví dụ: is being repaired/displayed) thì 95% là đáp án SAI nhé!',
  '🎧 Mẹo Part 2: Câu hỏi bắt đầu bằng Who / When / Where / Why thì loại ngay các đáp án bắt đầu bằng Yes / No nha Senpai!',
  '⚡ Mẹo Part 3 & 4: Hãy tận dụng 8 giây đọc hướng dẫn để đọc trước 3 câu hỏi và gạch chân từ khóa trước khi băng phát!',
  '📖 Mẹo Part 5: Nhìn ngay từ đứng trước và sau chỗ trống! Nếu trước là mạo từ (a/an/the) hoặc tính từ sở hữu thì điền Danh từ (Noun) nhé!',
  '✍️ Mẹo TOEIC Writing: Ở phần Viết Email (Q6–7), hãy luôn đảm bảo trả lời đủ cả 3 yêu cầu trong đề bài và dùng các cụm "I am writing to...", "Could you please..." nhé!',
  '🎹 Bạn có thể bật "Nhạc" trên thanh công cụ để vừa giải Reading & Writing vừa thư giãn với giai điệu Music Box dễ thương đó~ ✨'
];

const RANKS = [
  { minLv: 1, title: 'Tân Binh Sakura' },
  { minLv: 3, title: 'Kouhai Chăm Chỉ' },
  { minLv: 6, title: 'Học Viên Ưu Tú' },
  { minLv: 10, title: 'Senpai Học Viện' },
  { minLv: 15, title: 'Cao Thủ TOEIC 650+' },
  { minLv: 22, title: 'Huyền Thoại Sakura 800+' }
];

const App = {
  catalog: null,
  currentView: 'dashboard',
  currentEdition: '2024',
  currentTest: 1,
  currentDocType: 'lc',
  omrPartFilter: 'all',
  instantGrade: false,
  petalsEnabled: true,

  // Reading & Writing Studio State
  rwMode: 'p5',
  rwAnswers: {},
  rwShowTrans: {},
  rwCurrentP6Idx: 0,
  rwCurrentP7Idx: 0,
  rwCurrentPicIdx: 0,
  rwCurrentEmailIdx: 0,
  rwCurrentEssayIdx: 0,
  rwDrafts: {},

  // Exam Timer (120 mins = 7200 sec)
  timerSeconds: 7200,
  timerRunning: false,
  timerInterval: null,

  // Drill Studio State
  drillGroups: [],
  currentDrillGroupIdx: 0,
  currentDrillClipIdx: 0,
  drillAnswers: {},

  // Persistent User State
  state: {
    exp: 0,
    questionsChecked: 0,
    questionsCorrect: 0,
    savedTests: {}
  },

  async init() {
    this.loadState();
    this.initSakuraCanvas();
    this.updateRpgHeader();

    this.catalog = window.TOEIC_STATIC_CATALOG || null;

    if (!this.catalog) {
      try {
        const res = await fetch('./api/catalog');
        if (res.ok) this.catalog = await res.json();
      } catch (e) {
        console.warn('Using static catalog mode for GitHub Pages.');
      }
    }

    this.populateExamSelectors();
    this.renderDashboard();
    this.renderRwStage();
    this.initDrillStudio();
    this.renderLibrary();
    this.loadExamTest('2024', 1, false);
  },

  loadState() {
    try {
      const raw = localStorage.getItem('sakura_toeic_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
  },

  saveState() {
    try {
      localStorage.setItem('sakura_toeic_state_v1', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  },

  // ==========================================================================
  // MASTER & SECTION RESET FUNCTIONS
  // ==========================================================================
  resetAllProgress() {
    AnimeSound.click();
    if (!confirm('🔄 Bạn có chắc muốn Reset toàn bộ lịch sử làm đề, điểm số, EXP và các bài Đọc/Viết về trạng thái ban đầu không?')) {
      return;
    }

    localStorage.removeItem('sakura_toeic_state_v1');
    this.state = {
      exp: 0,
      questionsChecked: 0,
      questionsCorrect: 0,
      savedTests: {}
    };
    this.rwAnswers = {};
    this.rwDrafts = {};
    this.drillAnswers = {};
    const notesEl = document.getElementById('drill-notes');
    if (notesEl) notesEl.value = '';

    this.resetExamTimer(false);
    this.updateRpgHeader();
    this.renderDashboard();
    this.loadExamTest(this.currentEdition, this.currentTest, false);
    this.renderRwStage();
    this.renderDrillQuestions();

    this.mascotSay('🔄 Đã Reset toàn bộ dữ liệu học tập về trạng thái mới tinh! Chúng mình cùng bắt đầu hành trình mới nhé Senpai! 🌸');
  },

  resetRwAll() {
    AnimeSound.click();
    this.rwAnswers = {};
    this.rwDrafts = {};
    this.rwShowTrans = {};
    this.renderRwStage();
    this.mascotSay('🔄 Đã làm mới toàn bộ phần Luyện Đọc & Viết! Senpai có thể thử sức lại từ đầu rồi nha! ✨');
  },

  resetRwCurrentSet(prefix) {
    AnimeSound.click();
    Object.keys(this.rwAnswers).forEach(k => {
      if (k.startsWith(prefix)) delete this.rwAnswers[k];
    });
    this.renderRwStage();
    this.mascotSay('🔄 Đã xóa các câu trả lời của bài đọc hiện tại để bạn làm lại! 🌸');
  },

  resetWritingDraft(draftId, inputId, feedbackId) {
    AnimeSound.click();
    delete this.rwDrafts[draftId];
    const inp = document.getElementById(inputId);
    if (inp) inp.value = '';
    const fb = document.getElementById(feedbackId);
    if (fb) fb.innerHTML = '';
    this.renderRwStage();
    this.mascotSay('🔄 Đã xóa trắng bài viết hiện tại! Hãy thử viết một cách diễn đạt mới nhé Senpai! ✍️');
  },

  addExp(amount, reasonMsg) {
    const oldLv = this.getLevel();
    this.state.exp += amount;
    const newLv = this.getLevel();
    this.saveState();
    this.updateRpgHeader();
    this.updateDashboardKpis();

    if (newLv > oldLv) {
      AnimeSound.fanfare();
      this.mascotSay(`🎉 LEVEL UP! Chúc mừng Senpai đã thăng cấp lên Lv.${newLv} (${this.getRankTitle(newLv)})! Cứ đà này 650+ nằm chắc trong tầm tay! 🌸`);
    } else if (reasonMsg) {
      this.mascotSay(reasonMsg);
    }
  },

  getLevel() {
    return Math.floor(this.state.exp / 100) + 1;
  },

  getRankTitle(lv) {
    let r = RANKS[0].title;
    for (const item of RANKS) {
      if (lv >= item.minLv) r = item.title;
    }
    return r;
  },

  updateRpgHeader() {
    const lv = this.getLevel();
    const expInLv = this.state.exp % 100;
    document.getElementById('rpg-level').textContent = `Lv.${lv}`;
    document.getElementById('rpg-rank').textContent = this.getRankTitle(lv);
    document.getElementById('rpg-exp-bar').style.width = `${expInLv}%`;
  },

  // ==========================================================================
  // NAVIGATION & THEME / AUDIO CONTROLS
  // ==========================================================================
  switchView(viewName) {
    AnimeSound.tabSwitch();
    this.currentView = viewName;

    document.querySelectorAll('.top-navbar .nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'rw') {
      this.renderRwStage();
    }
  },

  toggleNightMode() {
    AnimeSound.click();
    document.body.classList.toggle('night-mode');
    const isNight = document.body.classList.contains('night-mode');
    document.getElementById('btn-theme-toggle').textContent = isNight ? '☀️ Sáng' : '🌙 Đêm';
  },

  togglePetals(enabled) {
    this.petalsEnabled = enabled;
    const canvas = document.getElementById('sakura-canvas');
    if (canvas) canvas.style.display = enabled ? 'block' : 'none';
  },

  toggleBgm() {
    const on = AnimeSound.toggleBgm();
    const btn = document.getElementById('btn-bgm-toggle');
    btn.textContent = on ? '🎵 Nhạc: BẬT' : '🎵 Nhạc: TẮT';
    btn.classList.toggle('active-toggle', on);
    if (on) {
      this.mascotSay('🎹 Đã bật nhạc nền Anime Music Box êm dịu~ Chúc Senpai học thật vào nhé! 🌸');
    }
  },

  toggleSoundPopover() {
    AnimeSound.click();
    document.getElementById('sound-popover').classList.toggle('open');
  },

  updateAudioSettings() {
    const sfxOn = document.getElementById('chk-sfx').checked;
    const sfxVol = parseInt(document.getElementById('rng-sfx').value, 10) / 100;
    const bgmVol = parseInt(document.getElementById('rng-bgm').value, 10) / 100;

    AnimeSound.sfxEnabled = sfxOn;
    AnimeSound.sfxVolume = sfxVol;
    AnimeSound.bgmVolume = bgmVol;
    document.getElementById('lbl-bgm-vol').textContent = `${Math.round(bgmVol * 100)}%`;
  },

  mascotSay(text, playVoice = true) {
    const el = document.getElementById('mascot-text');
    const bubble = document.getElementById('mascot-bubble');
    if (el) el.textContent = text;
    if (bubble) {
      bubble.style.transform = 'scale(1.04)';
      setTimeout(() => { bubble.style.transform = 'scale(1)'; }, 200);
    }
    if (playVoice) AnimeSound.mascotSpeak();
  },

  triggerMascotRandomTip() {
    const tip = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
    this.mascotSay(tip, true);
  },

  // ==========================================================================
  // READING & WRITING STUDIO (PART 5, PART 6, PART 7 & TOEIC WRITING)
  // ==========================================================================
  switchRwMode(mode) {
    AnimeSound.click();
    this.rwMode = mode;
    document.querySelectorAll('#rw-subnav .nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rwmode === mode);
    });
    this.renderRwStage();
  },

  renderRwStage() {
    const stage = document.getElementById('rw-content-stage');
    if (!stage || !window.TOEIC_RW_DATA) return;

    if (this.rwMode === 'p5') {
      this.renderRwPart5(stage);
    } else if (this.rwMode === 'p6') {
      this.renderRwPart6(stage);
    } else if (this.rwMode === 'p7') {
      this.renderRwPart7(stage);
    } else if (this.rwMode === 'w_pic') {
      this.renderRwWritingPic(stage);
    } else if (this.rwMode === 'w_email') {
      this.renderRwWritingEmail(stage);
    } else if (this.rwMode === 'w_essay') {
      this.renderRwWritingEssay(stage);
    }
  },

  // --- Mode 1: Part 5 Interactive Grammar & Vocab ---
  renderRwPart5(stage) {
    const list = window.TOEIC_RW_DATA.part5 || [];
    let html = `
      <div class="rw-card" style="background:var(--bg-secondary);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size:1.15rem;">⚡ Luyện Đọc Part 5: Điền Câu Ngữ Pháp & Từ Vựng Trọng Tâm (12 Câu)</h3>
            <p style="font-size:0.86rem; color:var(--text-muted);">Chọn đáp án A/B/C/D để xem giải thích ngữ pháp + từ vựng chi tiết từ Hina-sensei!</p>
          </div>
          <button class="btn-anime btn-reset" style="padding:7px 14px; font-size:0.82rem;" onclick="App.resetRwCurrentSet('p5_')">
            🔄 Reset Part 5
          </button>
        </div>
      </div>
    `;

    list.forEach((item, idx) => {
      const chosen = this.rwAnswers[item.id];
      let optsHtml = '';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        let cls = 'rw-option-btn';
        if (chosen) {
          if (letter === item.answer) cls += ' correct-choice';
          else if (chosen === letter && chosen !== item.answer) cls += ' wrong-choice';
        }
        optsHtml += `
          <button class="${cls}" onclick="App.answerRwQuestion('${item.id}', '${letter}', '${item.answer}')">
            <span class="bubble-btn" style="width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">${letter}</span>
            <span>${item.options[letter]}</span>
          </button>
        `;
      });

      const expHtml = chosen ? `
        <div class="explanation-box">
          <div style="font-weight:900; color:${chosen === item.answer ? 'var(--correct-green)' : 'var(--wrong-red)'}; margin-bottom:4px;">
            ${chosen === item.answer ? '🔔 Pin-Pon! Chính xác!' : `💢 Bubu~ Đáp án đúng là (${item.answer})`}
          </div>
          <div><strong>🇻🇳 Dịch nghĩa:</strong> ${item.translation}</div>
          <div style="margin-top:4px;"><strong>💡 Giải thích của Hina-sensei:</strong> ${item.explanation}</div>
          <div style="margin-top:6px; font-size:0.82rem; color:var(--lavender); font-weight:800;">
            📌 Từ vựng cần nhớ: ${(item.vocab || []).join(' • ')}
          </div>
        </div>
      ` : '';

      html += `
        <div class="rw-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <span class="edition-badge">Câu ${101 + idx} • ${item.topic}</span>
            ${chosen ? `<button class="mini-btn mini-reset" onclick="delete App.rwAnswers['${item.id}']; AnimeSound.click(); App.renderRwStage();">🔄 Làm lại câu này</button>` : ''}
          </div>
          <p style="font-size:1.02rem; font-weight:800; margin-bottom:12px; line-height:1.55;">
            ${item.question}
          </p>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:8px;">
            ${optsHtml}
          </div>
          ${expHtml}
        </div>
      `;
    });

    stage.innerHTML = html;
  },

  // --- Mode 2: Part 6 Text Completion ---
  renderRwPart6(stage) {
    const sets = window.TOEIC_RW_DATA.part6 || [];
    const set = sets[this.rwCurrentP6Idx] || sets[0];
    if (!set) return;

    const navBtns = sets.map((s, idx) => `
      <button class="doc-btn ${idx === this.rwCurrentP6Idx ? 'active' : ''}" onclick="App.rwCurrentP6Idx=${idx}; AnimeSound.click(); App.renderRwStage();">
        📄 ${s.title.split(':')[0]}
      </button>
    `).join('');

    const formattedContent = set.content.replace(/\[(\d+)\]/g, '<span class="blank-tag">[$1]</span>');
    const showTrans = !!this.rwShowTrans[set.id];

    let qHtml = '';
    set.questions.forEach(q => {
      const qKey = `${set.id}_${q.qNum}`;
      const chosen = this.rwAnswers[qKey];
      let optsHtml = '';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        let cls = 'rw-option-btn';
        if (chosen) {
          if (letter === q.answer) cls += ' correct-choice';
          else if (chosen === letter && chosen !== q.answer) cls += ' wrong-choice';
        }
        optsHtml += `
          <button class="${cls}" onclick="App.answerRwQuestion('${qKey}', '${letter}', '${q.answer}')">
            <span class="bubble-btn" style="width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">${letter}</span>
            <span>${q.options[letter]}</span>
          </button>
        `;
      });

      qHtml += `
        <div class="rw-card" style="padding:14px 16px; margin-bottom:12px;">
          <strong style="display:block; margin-bottom:8px; color:var(--sakura-pink);">Câu [${q.qNum}]: Chọn từ/câu điền vào chỗ trống</strong>
          ${optsHtml}
          ${chosen ? `
            <div class="explanation-box">
              <strong>${chosen === q.answer ? '✅ Đúng rồi!' : `❌ Đáp án đúng: (${q.answer})`}</strong><br/>
              💡 ${q.explanation}
            </div>
          ` : ''}
        </div>
      `;
    });

    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">${navBtns}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-anime btn-secondary" style="padding:7px 14px; font-size:0.83rem;" onclick="App.toggleRwTrans('${set.id}')">
            🇻🇳 ${showTrans ? 'Ẩn Bản Dịch Song Ngữ' : 'Hiện Bản Dịch Song Ngữ'}
          </button>
          <button class="btn-anime btn-reset" style="padding:7px 14px; font-size:0.83rem;" onclick="App.resetRwCurrentSet('${set.id}_')">
            🔄 Reset Đoạn Văn Này
          </button>
        </div>
      </div>

      <div class="rw-split-grid">
        <div class="rw-card">
          <span class="edition-badge">${set.docType}</span>
          <h3 style="margin:8px 0 12px;">${set.title}</h3>
          <div class="passage-header-meta">${set.header}</div>
          <div class="passage-box">${formattedContent}</div>
          ${showTrans ? `
            <div class="explanation-box" style="margin-top:14px;">
              <strong>🇻🇳 Bản dịch tiếng Việt:</strong><br/>
              <div style="white-space:pre-wrap; margin-top:6px;">${set.translation}</div>
            </div>
          ` : ''}
        </div>
        <div>${qHtml}</div>
      </div>
    `;
  },

  // --- Mode 3: Part 7 Single & Double Passages ---
  renderRwPart7(stage) {
    const sets = window.TOEIC_RW_DATA.part7 || [];
    const set = sets[this.rwCurrentP7Idx] || sets[0];
    if (!set) return;

    const navBtns = sets.map((s, idx) => `
      <button class="doc-btn ${idx === this.rwCurrentP7Idx ? 'active' : ''}" onclick="App.rwCurrentP7Idx=${idx}; AnimeSound.click(); App.renderRwStage();">
        📰 ${s.title.split(':')[0]}
      </button>
    `).join('');

    const showTrans = !!this.rwShowTrans[set.id];

    const passagesHtml = set.passages.map(p => `
      <div style="margin-bottom:16px;">
        <span class="edition-badge" style="margin-bottom:6px; display:inline-block;">${p.type}</span>
        <div class="passage-header-meta">${p.header}</div>
        <div class="passage-box">${p.body}</div>
      </div>
    `).join('');

    const qHtml = set.questions.map(q => {
      const qKey = `${set.id}_${q.qNum}`;
      const chosen = this.rwAnswers[qKey];
      let optsHtml = '';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        let cls = 'rw-option-btn';
        if (chosen) {
          if (letter === q.answer) cls += ' correct-choice';
          else if (chosen === letter && chosen !== q.answer) cls += ' wrong-choice';
        }
        optsHtml += `
          <button class="${cls}" onclick="App.answerRwQuestion('${qKey}', '${letter}', '${q.answer}')">
            <span class="bubble-btn" style="width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">${letter}</span>
            <span>${q.options[letter]}</span>
          </button>
        `;
      });

      return `
        <div class="rw-card" style="padding:14px 16px; margin-bottom:12px;">
          <strong style="display:block; margin-bottom:8px; font-size:0.95rem;">Câu ${q.qNum}. ${q.question}</strong>
          ${optsHtml}
          ${chosen ? `
            <div class="explanation-box">
              <strong>${chosen === q.answer ? '🔔 Chính xác!' : `💢 Đáp án đúng: (${q.answer})`}</strong><br/>
              💡 ${q.explanation}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">${navBtns}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-anime btn-secondary" style="padding:7px 14px; font-size:0.83rem;" onclick="App.toggleRwTrans('${set.id}')">
            🇻🇳 ${showTrans ? 'Ẩn Bản Dịch Song Ngữ' : 'Hiện Bản Dịch Song Ngữ'}
          </button>
          <button class="btn-anime btn-reset" style="padding:7px 14px; font-size:0.83rem;" onclick="App.resetRwCurrentSet('${set.id}_')">
            🔄 Reset Bài Đọc Này
          </button>
        </div>
      </div>

      <div class="rw-split-grid">
        <div class="rw-card">
          <span class="edition-badge">${set.badge}</span>
          <h3 style="margin:8px 0 12px;">${set.title}</h3>
          ${passagesHtml}
          ${showTrans ? `
            <div class="explanation-box">
              <strong>🇻🇳 Bản dịch & Tóm tắt:</strong><br/>
              <div style="white-space:pre-wrap; margin-top:6px;">${set.translation}</div>
            </div>
          ` : ''}
        </div>
        <div>${qHtml}</div>
      </div>
    `;
  },

  toggleRwTrans(id) {
    AnimeSound.click();
    this.rwShowTrans[id] = !this.rwShowTrans[id];
    this.renderRwStage();
  },

  answerRwQuestion(qKey, chosenLetter, correctLetter) {
    this.rwAnswers[qKey] = chosenLetter;
    this.state.questionsChecked++;

    if (chosenLetter === correctLetter) {
      this.state.questionsCorrect++;
      AnimeSound.correct();
      this.addExp(5, `🔔 Pin-Pon! Đáp án (${chosenLetter}) chuẩn xác! Hãy đọc thêm phần giải thích bên dưới để nhớ lâu nhé Senpai! (+5 EXP) 🌸`);
    } else {
      AnimeSound.wrong();
      this.mascotSay(`💢 Bubu~ Câu này đáp án là (${correctLetter}) cơ! Xem ngay giải thích của mình bên dưới nhé!`, false);
    }

    this.saveState();
    this.renderRwStage();
  },

  // --- Mode 4: TOEIC Writing Q1-5 (Write a Sentence Based on a Picture) ---
  renderRwWritingPic(stage) {
    const items = window.TOEIC_RW_DATA.writing.pictureSentences || [];
    const item = items[this.rwCurrentPicIdx] || items[0];
    if (!item) return;

    const navBtns = items.map((it, idx) => `
      <button class="doc-btn ${idx === this.rwCurrentPicIdx ? 'active' : ''}" onclick="App.rwCurrentPicIdx=${idx}; AnimeSound.click(); App.renderRwStage();">
        🖼️ Tranh ${idx + 1} (${it.word1} / ${it.word2})
      </button>
    `).join('');

    const draft = this.rwDrafts[item.id] || '';

    stage.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">${navBtns}</div>

      <div class="rw-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span class="edition-badge">TOEIC WRITING PART 1 (QUESTIONS 1–5) • THANG ĐIỂM 0–3</span>
          <button class="mini-btn mini-reset" onclick="App.resetWritingDraft('${item.id}', 'inp-writing-pic', 'writing-pic-feedback')">
            🔄 Reset Câu Này
          </button>
        </div>
        <h3 style="margin:8px 0;">${item.title}</h3>
        <div style="background:var(--bg-secondary); border:1.5px solid var(--border-anime); border-radius:14px; padding:18px; margin:12px 0; display:flex; align-items:center; gap:18px; flex-wrap:wrap;">
          <div style="font-size:3rem; background:var(--bg-card); border:1.5px solid var(--border-anime); border-radius:14px; padding:12px 18px;">
            ${item.sceneIcon}
          </div>
          <div style="flex:1; min-width:240px;">
            <strong style="font-size:0.95rem;">📸 Mô tả ngữ cảnh bức tranh:</strong>
            <p style="font-size:0.92rem; margin-top:4px; line-height:1.55;">${item.sceneDesc}</p>
            <div style="margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span style="font-weight:900; font-size:0.86rem;">🔑 2 từ bắt buộc phải có trong câu:</span>
              <span class="keyword-badge">${item.word1}</span>
              <span class="keyword-badge">${item.word2}</span>
            </div>
          </div>
        </div>

        <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:8px;">
          💡 <strong>Gợi ý cấu trúc:</strong> ${item.grammarHint} (Bạn có thể biến đổi thì của động từ hoặc số ít/số nhiều của danh từ).
        </p>

        <textarea id="inp-writing-pic" class="writing-editor" rows="3" placeholder="Viết 1 câu tiếng Anh hoàn chỉnh chứa cả 2 từ '${item.word1}' và '${item.word2}'..." oninput="App.rwDrafts['${item.id}']=this.value">${draft}</textarea>

        <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn-anime btn-primary" onclick="App.gradeWritingPicture()">
            ✨ Chấm Điểm Câu Này & Xem Câu Mẫu
          </button>
          <button class="btn-anime btn-secondary" onclick="document.getElementById('inp-writing-pic').value='${item.sampleAnswers[0].replace(/'/g, "\\'")}'; App.rwDrafts['${item.id}']=document.getElementById('inp-writing-pic').value; AnimeSound.click();">
            🪄 Điền Thử Câu Mẫu Điểm Tuyệt Đối
          </button>
          <button class="btn-anime btn-reset" onclick="App.resetWritingDraft('${item.id}', 'inp-writing-pic', 'writing-pic-feedback')">
            🔄 Xóa Viết Lại
          </button>
        </div>

        <div id="writing-pic-feedback"></div>
      </div>
    `;
  },

  gradeWritingPicture() {
    const items = window.TOEIC_RW_DATA.writing.pictureSentences || [];
    const item = items[this.rwCurrentPicIdx];
    const text = (document.getElementById('inp-writing-pic').value || '').trim();
    const box = document.getElementById('writing-pic-feedback');

    if (!text) {
      AnimeSound.wrong();
      this.mascotSay('Senpai hãy gõ ít nhất 1 câu tiếng Anh trước khi bấm chấm điểm nhé! 🌸', false);
      return;
    }

    const lower = text.toLowerCase();
    const hasWord1 = item.acceptedForms1.some(w => lower.includes(w.toLowerCase()));
    const hasWord2 = item.acceptedForms2.some(w => lower.includes(w.toLowerCase()));
    const startsUpper = /^[A-Z]/.test(text);
    const endsPunct = /[.!?]$/.test(text);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    let score = 0;
    if (hasWord1) score++;
    if (hasWord2) score++;
    if (startsUpper && endsPunct && wordCount >= 6) score++;

    if (score === 3) {
      AnimeSound.fanfare();
      this.addExp(15, `🏆 3/3 ĐIỂM TUYỆT ĐỐI! Câu mô tả tranh của Senpai dùng đủ cả 2 từ khóa "${item.word1}" & "${item.word2}" và đúng chuẩn cấu trúc! (+15 EXP) 🌸`);
    } else if (score === 2) {
      AnimeSound.correct();
      this.addExp(8, `🔔 Đạt ${score}/3 điểm! Chỉ cần chỉnh nhẹ một chút nữa là hoàn hảo! (+8 EXP)`);
    } else {
      AnimeSound.wrong();
      this.mascotSay(`💢 Đạt ${score}/3 điểm. Hãy kiểm tra lại xem đã dùng đủ cả 2 từ bắt buộc chưa nhé Senpai!`, false);
    }

    box.innerHTML = `
      <div class="writing-feedback-box">
        <div style="font-size:1.02rem; font-weight:900; margin-bottom:8px;">
          🎯 Kết quả đánh giá của Hina-sensei: <span style="color:var(--sakura-pink);">${score} / 3 Điểm</span> (${wordCount} từ)
        </div>
        <ul style="padding-left:20px; font-size:0.88rem; line-height:1.65; font-weight:700;">
          <li>Từ khóa 1 (<strong>${item.word1}</strong>): ${hasWord1 ? '✅ Đã sử dụng' : '❌ Chưa thấy xuất hiện trong câu'}</li>
          <li>Từ khóa 2 (<strong>${item.word2}</strong>): ${hasWord2 ? '✅ Đã sử dụng' : '❌ Chưa thấy xuất hiện trong câu'}</li>
          <li>Viết hoa đầu câu & dấu chấm cuối câu (độ dài ≥ 6 từ): ${(startsUpper && endsPunct && wordCount >= 6) ? '✅ Đạt chuẩn ngữ pháp câu' : '⚠️ Nhớ viết hoa chữ cái đầu, đặt dấu chấm (.) cuối câu và viết câu ≥ 6 từ nhé!'}</li>
        </ul>
        <div style="margin-top:12px; padding-top:10px; border-top:1.5px dashed var(--border-anime);">
          <strong style="color:var(--lavender);">🌟 3 Câu Mẫu Điểm Tuyệt Đối (Band 200):</strong>
          <ul style="padding-left:20px; margin-top:4px; font-size:0.9rem; line-height:1.6;">
            ${item.sampleAnswers.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  },

  // --- Mode 5: TOEIC Writing Q6-7 (Respond to a Written Request - Business Email) ---
  renderRwWritingEmail(stage) {
    const tasks = window.TOEIC_RW_DATA.writing.emailTasks || [];
    const task = tasks[this.rwCurrentEmailIdx] || tasks[0];
    if (!task) return;

    const navBtns = tasks.map((t, idx) => `
      <button class="doc-btn ${idx === this.rwCurrentEmailIdx ? 'active' : ''}" onclick="App.rwCurrentEmailIdx=${idx}; AnimeSound.click(); App.renderRwStage();">
        📧 ${t.title}
      </button>
    `).join('');

    const draft = this.rwDrafts[task.id] || '';
    const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

    const phrasesHtml = task.usefulPhrases.map(p => `
      <button class="phrase-chip" onclick="App.insertIntoEditor('inp-writing-email', '${task.id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})">
        ➕ ${p.length > 62 ? p.slice(0, 62) + '...' : p}
      </button>
    `).join('');

    stage.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">${navBtns}</div>

      <div class="rw-split-grid">
        <div class="rw-card">
          <span class="edition-badge">TOEIC WRITING PART 2 (QUESTIONS 6–7) • 10 PHÚT</span>
          <h3 style="margin:8px 0;">${task.title}</h3>
          <div class="passage-header-meta">${task.sender}</div>
          <div class="passage-box">${task.promptEmail}</div>
          <div class="explanation-box" style="margin-top:14px;">
            <strong>📌 Yêu cầu đề bài (Directions):</strong><br/>
            ${task.directions}
          </div>
        </div>

        <div class="rw-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <strong>✍️ Soạn Email Phản Hồi Của Bạn:</strong>
            <span class="edition-badge" id="email-word-count">Số từ: ${words} (Mục tiêu: 80–140 từ)</span>
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-size:0.78rem; font-weight:800; color:var(--text-muted); margin-bottom:4px;">
              ✨ Click để chèn nhanh Mẫu Câu Vàng TOEIC Writing:
            </div>
            <div>${phrasesHtml}</div>
          </div>

          <textarea id="inp-writing-email" class="writing-editor" rows="10" placeholder="Dear ...,&#10;&#10;Thank you for contacting us..." oninput="App.onUpdateEmailDraft('${task.id}', this.value)">${draft}</textarea>

          <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button class="btn-anime btn-primary" onclick="App.gradeWritingEmail()">
              ✨ Chấm Điểm Email (Thang 0–4)
            </button>
            <button class="btn-anime btn-secondary" onclick="App.loadSampleEmail()">
              📖 Xem & Điền Bài Mẫu 4/4 Điểm
            </button>
            <button class="btn-anime btn-reset" onclick="App.resetWritingDraft('${task.id}', 'inp-writing-email', 'writing-email-feedback')">
              🔄 Reset Email Này
            </button>
          </div>

          <div id="writing-email-feedback"></div>
        </div>
      </div>
    `;
  },

  onUpdateEmailDraft(taskId, val) {
    this.rwDrafts[taskId] = val;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    const el = document.getElementById('email-word-count');
    if (el) el.textContent = `Số từ: ${words} (Mục tiêu: 80–140 từ)`;
  },

  insertIntoEditor(editorId, draftKey, phrase) {
    AnimeSound.click();
    const el = document.getElementById(editorId);
    if (!el) return;
    const prefix = el.value && !el.value.endsWith('\n') && !el.value.endsWith(' ') ? '\n\n' : '';
    el.value = el.value + prefix + phrase;
    this.rwDrafts[draftKey] = el.value;
    this.onUpdateEmailDraft(draftKey, el.value);
    el.focus();
  },

  loadSampleEmail() {
    AnimeSound.click();
    const task = window.TOEIC_RW_DATA.writing.emailTasks[this.rwCurrentEmailIdx];
    const el = document.getElementById('inp-writing-email');
    el.value = task.sampleResponse;
    this.onUpdateEmailDraft(task.id, el.value);
    this.gradeWritingEmail();
  },

  gradeWritingEmail() {
    const task = window.TOEIC_RW_DATA.writing.emailTasks[this.rwCurrentEmailIdx];
    const text = (document.getElementById('inp-writing-email').value || '').trim();
    const box = document.getElementById('writing-email-feedback');

    if (!text) {
      AnimeSound.wrong();
      this.mascotSay('Senpai hãy viết nội dung Email hoặc bấm vào các Mẫu Câu Vàng để chèn trước khi chấm nhé! 🌸', false);
      return;
    }

    const words = text.split(/\s+/).filter(Boolean).length;
    let passedCount = 0;

    const checkResults = task.checklist.map(item => {
      const ok = item.regex.test(text);
      if (ok) passedCount++;
      return { label: item.label, ok };
    });

    const lengthOk = words >= 60;
    const finalScore = Math.min(4, Math.round((passedCount / task.checklist.length) * 3) + (lengthOk ? 1 : 0));

    if (finalScore >= 3) {
      AnimeSound.fanfare();
      this.addExp(25, `🏆 Email của Senpai đạt ${finalScore}/4 điểm chuẩn ETS (${words} từ)! Cấu trúc rất chuyên nghiệp! (+25 EXP) 🌸`);
    } else {
      AnimeSound.correct();
      this.addExp(10, `📧 Email đạt ${finalScore}/4 điểm. Hãy bổ sung thêm các ý còn thiếu trong bảng kiểm bên dưới nhé!`);
    }

    box.innerHTML = `
      <div class="writing-feedback-box">
        <div style="font-size:1.02rem; font-weight:900; margin-bottom:8px;">
          🎯 Điểm Email TOEIC Writing: <span style="color:var(--sakura-pink);">${finalScore} / 4 Điểm</span> (${words} từ)
        </div>
        <ul style="padding-left:20px; font-size:0.86rem; line-height:1.65; font-weight:700;">
          ${checkResults.map(c => `<li>${c.ok ? '✅' : '❌'} ${c.label}</li>`).join('')}
          <li>${lengthOk ? '✅' : '⚠️'} Độ dài chuẩn Email thương mại (≥ 60 từ): Hiện tại <strong>${words} từ</strong></li>
        </ul>
      </div>
    `;
  },

  // --- Mode 6: TOEIC Writing Q8 (Opinion Essay - 300 words) ---
  renderRwWritingEssay(stage) {
    const topics = window.TOEIC_RW_DATA.writing.essayTopics || [];
    const topic = topics[this.rwCurrentEssayIdx] || topics[0];
    if (!topic) return;

    const navBtns = topics.map((t, idx) => `
      <button class="doc-btn ${idx === this.rwCurrentEssayIdx ? 'active' : ''}" onclick="App.rwCurrentEssayIdx=${idx}; AnimeSound.click(); App.renderRwStage();">
        🖋️ ${t.title}
      </button>
    `).join('');

    const draft = this.rwDrafts[topic.id] || '';
    const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

    const connHtml = topic.connectors.map(c => `
      <button class="phrase-chip" onclick="App.insertIntoEditor('inp-writing-essay', '${topic.id}', ${JSON.stringify(c).replace(/"/g, '&quot;')})">
        ➕ ${c}
      </button>
    `).join('');

    stage.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">${navBtns}</div>

      <div class="rw-card">
        <span class="edition-badge">TOEIC WRITING PART 3 (QUESTION 8) • 30 PHÚT • MỤC TIÊU 200–300 TỪ</span>
        <h3 style="margin:8px 0;">${topic.title}</h3>
        <div class="passage-box" style="background:var(--bg-secondary); font-weight:800;">
          📋 Prompt: "${topic.prompt}"
        </div>

        <div style="margin:12px 0;">
          <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin-bottom:4px;">
            ✨ Click để chèn Cụm Từ Nối Học Thuật (Academic Linking Phrases) cho 4 đoạn văn:
          </div>
          <div>${connHtml}</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="font-size:0.9rem;">✍️ Bài Luận Của Bạn:</strong>
          <span class="edition-badge" id="essay-word-count">Số từ: ${words} / 250+ từ</span>
        </div>

        <textarea id="inp-writing-essay" class="writing-editor" rows="12" placeholder="Paragraph 1 (Introduction): State your opinion clearly...&#10;&#10;Paragraph 2 (First reason + example)...&#10;&#10;Paragraph 3 (Second reason + detail)...&#10;&#10;Paragraph 4 (Conclusion)..." oninput="App.rwDrafts['${topic.id}']=this.value; document.getElementById('essay-word-count').textContent='Số từ: '+(this.value.trim()?this.value.trim().split(/\\s+/).length:0)+' / 250+ từ';">${draft}</textarea>

        <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn-anime btn-primary" onclick="App.gradeWritingEssay()">
            ✨ Chấm Điểm Bài Luận (Thang 0–5)
          </button>
          <button class="btn-anime btn-secondary" onclick="App.loadSampleEssay()">
            📖 Xem & Điền Bài Luận Mẫu Band 200
          </button>
          <button class="btn-anime btn-reset" onclick="App.resetWritingDraft('${topic.id}', 'inp-writing-essay', 'writing-essay-feedback')">
            🔄 Reset Bài Luận
          </button>
        </div>

        <div id="writing-essay-feedback"></div>
      </div>
    `;
  },

  loadSampleEssay() {
    AnimeSound.click();
    const topic = window.TOEIC_RW_DATA.writing.essayTopics[this.rwCurrentEssayIdx];
    const el = document.getElementById('inp-writing-essay');
    el.value = topic.sampleEssay;
    this.rwDrafts[topic.id] = el.value;
    document.getElementById('essay-word-count').textContent = `Số từ: ${el.value.trim().split(/\s+/).length} / 250+ từ`;
    this.gradeWritingEssay();
  },

  gradeWritingEssay() {
    const text = (document.getElementById('inp-writing-essay').value || '').trim();
    const box = document.getElementById('writing-essay-feedback');

    if (!text) {
      AnimeSound.wrong();
      this.mascotSay('Senpai hãy viết bài luận hoặc bấm xem Bài Luận Mẫu trước khi chấm nhé! 🌸', false);
      return;
    }

    const words = text.split(/\s+/).filter(Boolean).length;
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
    const hasIntro = /perspective|believe|agree|disagree|opinion/i.test(text);
    const hasTransitions = /first|furthermore|moreover|instance|example|addition|however/i.test(text);
    const hasConclusion = /conclusion|sum up|therefore|overall/i.test(text);

    let score = 1;
    if (words >= 120) score++;
    if (words >= 200 && paragraphs >= 3) score++;
    if (hasIntro && hasTransitions) score++;
    if (hasConclusion) score++;

    AnimeSound.fanfare();
    this.addExp(30, `🏆 Bài luận Opinion Essay của Senpai đạt ${score}/5 điểm (${words} từ, ${paragraphs} đoạn văn)! (+30 EXP) 🌸`);

    box.innerHTML = `
      <div class="writing-feedback-box">
        <div style="font-size:1.02rem; font-weight:900; margin-bottom:8px;">
          🎯 Đánh giá Essay TOEIC Writing: <span style="color:var(--sakura-pink);">${score} / 5 Điểm</span> (${words} từ • ${paragraphs} đoạn)
        </div>
        <ul style="padding-left:20px; font-size:0.86rem; line-height:1.65; font-weight:700;">
          <li>${hasIntro ? '✅' : '⚠️'} Mở bài nêu rõ quan điểm cá nhân (Thesis Statement)</li>
          <li>${hasTransitions ? '✅' : '⚠️'} Sử dụng từ nối luận điểm & ví dụ cụ thể (First, Furthermore, For instance...)</li>
          <li>${hasConclusion ? '✅' : '⚠️'} Có đoạn Kết luận khẳng định lại quan điểm (In conclusion / To sum up...)</li>
          <li>${words >= 200 ? '✅' : '⚠️'} Độ dài khuyến nghị ≥ 200–300 từ (Hiện tại: <strong>${words} từ</strong>)</li>
        </ul>
      </div>
    `;
  },

  // ==========================================================================
  // DASHBOARD & KPI TRACKING
  // ==========================================================================
  updateDashboardKpis() {
    let bestScore = 0;
    let testsCompleted = 0;

    Object.values(this.state.savedTests).forEach(t => {
      if (t.graded) {
        testsCompleted++;
        if (t.scoreTotal > bestScore) bestScore = t.scoreTotal;
      }
    });

    document.getElementById('stat-best-score').textContent = `${bestScore} / 990`;
    const gapEl = document.getElementById('stat-goal-gap');
    if (bestScore >= 650) {
      gapEl.textContent = '🎉 ĐÃ VƯỢT MỤC TIÊU 650+! Tuyệt vời Senpai!';
      gapEl.style.color = 'var(--correct-green)';
    } else if (bestScore > 0) {
      gapEl.textContent = `Còn cách mục tiêu 650+: ${650 - bestScore} điểm nữa!`;
      gapEl.style.color = 'var(--sakura-pink)';
    } else {
      gapEl.textContent = 'Mục tiêu: 650+ điểm (Cần ~132/200 câu)';
      gapEl.style.color = 'var(--sakura-pink)';
    }

    document.getElementById('stat-tests-done').textContent = `${testsCompleted} / 30 Đề`;
    document.getElementById('stat-questions-done').textContent = `${this.state.questionsChecked} Câu`;
    const acc = this.state.questionsChecked > 0
      ? Math.round((this.state.questionsCorrect / this.state.questionsChecked) * 100)
      : 0;
    document.getElementById('stat-accuracy').textContent = `Tỉ lệ chính xác: ${acc}%`;
    document.getElementById('stat-level-card').textContent = `Lv.${this.getLevel()} (${this.state.exp} EXP)`;
  },

  renderDashboard() {
    this.updateDashboardKpis();
    if (!this.catalog) return;

    const container = document.getElementById('dashboard-editions');
    container.innerHTML = '';

    ['2024', '2023', '2022'].forEach(year => {
      const ed = this.catalog.editions[year];
      if (!ed) return;

      const card = document.createElement('div');
      card.className = 'edition-card';

      let pillsHtml = '';
      for (let i = 1; i <= 10; i++) {
        const key = `${year}_${i}`;
        const saved = this.state.savedTests[key];
        const doneClass = saved && saved.graded ? 'completed' : '';
        const ansCount = saved && saved.answers ? Object.keys(saved.answers).length : 0;
        const subLabel = saved && saved.graded
          ? `${saved.scoreTotal}đ`
          : (ansCount > 0 ? `${ansCount}/200` : 'Mới');

        pillsHtml += `
          <button class="test-pill-btn ${doneClass}" onclick="App.openExam('${year}', ${i})">
            <span>Test ${String(i).padStart(2, '0')}</span>
            <span class="test-pill-score">${subLabel}</span>
          </button>
        `;
      }

      card.innerHTML = `
        <span class="edition-badge">${ed.badge}</span>
        <h3>${ed.title}</h3>
        <p>${ed.description}</p>
        <div class="test-pills-grid">${pillsHtml}</div>
      `;
      container.appendChild(card);
    });
  },

  openExam(edition, testNumber) {
    this.switchView('exam');
    this.loadExamTest(edition, testNumber, true);
  },

  // ==========================================================================
  // INTERACTIVE EXAM ROOM (PDF + AUDIO + 200-QUESTION OMR)
  // ==========================================================================
  populateExamSelectors() {
    const selTest = document.getElementById('sel-test');
    selTest.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Test ${String(i).padStart(2, '0')} (200 Câu)`;
      selTest.appendChild(opt);
    }
  },

  onExamSelectionChange() {
    const ed = document.getElementById('sel-edition').value;
    const testNum = parseInt(document.getElementById('sel-test').value, 10);
    AnimeSound.click();
    this.loadExamTest(ed, testNum, true);
  },

  loadExamTest(edition, testNum, announce = true) {
    this.currentEdition = String(edition);
    this.currentTest = parseInt(testNum, 10);

    document.getElementById('sel-edition').value = this.currentEdition;
    document.getElementById('sel-test').value = this.currentTest;

    const testKey = `${this.currentEdition}_${this.currentTest}`;
    if (!this.state.savedTests[testKey]) {
      this.state.savedTests[testKey] = {
        answers: {},
        revealed: {},
        graded: false,
        scoreTotal: 0,
        lcScore: 0,
        rcScore: 0
      };
    }

    const testObj = this.getCurrentTestCatalogObj();
    if (testObj) {
      this.renderExamAudioTracks(testObj);
      this.switchExamDoc(this.currentDocType === 'key' ? 'lc' : this.currentDocType, false);
    }

    this.renderOmrSheet();
    this.updateScoreBanner();

    if (announce) {
      this.mascotSay(`📝 Đã mở bộ đề ETS ${this.currentEdition} - Test ${String(this.currentTest).padStart(2, '0')}! Chúc Senpai làm bài thật tốt nha! 🌸`, false);
    }
  },

  getCurrentTestCatalogObj() {
    if (!this.catalog || !this.catalog.editions[this.currentEdition]) return null;
    return this.catalog.editions[this.currentEdition].tests.find(t => t.testNumber === this.currentTest);
  },

  renderExamAudioTracks(testObj) {
    const group = document.getElementById('exam-audio-tracks');
    const player = document.getElementById('exam-audio-player');
    group.innerHTML = '';

    const tracks = [
      { label: '💿 Full Audio (45 Phút)', url: testObj.fullAudio }
    ];

    if (testObj.partAudio) {
      [1, 2, 3, 4].forEach(p => {
        if (testObj.partAudio[`part${p}`]) {
          tracks.push({
            label: `🎵 Cắt Riêng Part ${p}`,
            url: testObj.partAudio[`part${p}`]
          });
        }
      });
    }

    tracks.forEach((tr, idx) => {
      const btn = document.createElement('button');
      btn.className = 'track-chip' + (idx === 0 ? ' active' : '');
      btn.textContent = tr.label;
      btn.onclick = () => {
        AnimeSound.click();
        group.querySelectorAll('.track-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        player.src = tr.url;
        player.playbackRate = parseFloat(document.getElementById('sel-audio-speed').value || '1');
        player.play().catch(() => {});
      };
      group.appendChild(btn);
    });

    if (tracks[0] && tracks[0].url) {
      player.src = tracks[0].url;
    }
  },

  seekAudio(deltaSec) {
    const player = document.getElementById('exam-audio-player');
    if (!player) return;
    player.currentTime = Math.max(0, (player.currentTime || 0) + deltaSec);
  },

  changeAudioSpeed(rateStr) {
    const rate = parseFloat(rateStr);
    const player = document.getElementById('exam-audio-player');
    if (player) player.playbackRate = rate;
  },

  switchExamDoc(docType, playSfx = true) {
    if (playSfx) AnimeSound.click();
    this.currentDocType = docType;

    ['lc', 'rc', 'script', 'key'].forEach(t => {
      const btn = document.getElementById(`docbtn-${t}`);
      if (btn) btn.classList.toggle('active', t === docType);
    });

    const testObj = this.getCurrentTestCatalogObj();
    if (!testObj) return;

    const iframe = document.getElementById('exam-pdf-frame');
    const imgBox = document.getElementById('exam-key-image-box');
    const imgEl = document.getElementById('exam-key-img');
    const titleEl = document.getElementById('pdf-pane-title');
    const newTabLink = document.getElementById('btn-open-newtab');

    iframe.style.display = 'block';
    imgBox.style.display = 'none';

    let targetUrl = testObj.lcPdf;
    let label = 'Đề Nghe (Listening)';

    if (docType === 'lc') {
      targetUrl = testObj.lcPdf;
      label = 'Đề Nghe (LC)';
    } else if (docType === 'rc') {
      targetUrl = testObj.rcPdf;
      label = 'Đề Đọc (RC)';
    } else if (docType === 'script') {
      targetUrl = testObj.scriptPdf;
      label = 'Transcript & Giải Thích';
    } else if (docType === 'key') {
      label = 'Bản Đáp Án Gốc';
      if (testObj.keyImage) {
        iframe.style.display = 'none';
        imgBox.style.display = 'flex';
        imgEl.src = testObj.keyImage;
        targetUrl = testObj.keyImage;
      } else {
        targetUrl = testObj.keyLcPdf;
      }
    }

    if (iframe.style.display !== 'none') {
      iframe.src = targetUrl;
    }
    newTabLink.href = targetUrl;
    titleEl.textContent = `📄 ETS ${this.currentEdition} - Test ${String(this.currentTest).padStart(2, '0')} • ${label}`;
  },

  togglePdfExpand() {
    AnimeSound.click();
    document.getElementById('exam-split-layout').classList.toggle('pdf-expanded');
  },

  onToggleInstantGrade() {
    this.instantGrade = document.getElementById('chk-instant-grade').checked;
    AnimeSound.click();
    this.renderOmrSheet();
  },

  setOmrPartFilter(part) {
    AnimeSound.click();
    this.omrPartFilter = part;
    document.querySelectorAll('#omr-part-tabs .part-chip').forEach(btn => {
      btn.classList.toggle('active', String(btn.dataset.part) === String(part));
    });

    if (part !== 'all') {
      const pNum = parseInt(part, 10);
      if (pNum >= 1 && pNum <= 4 && this.currentDocType === 'rc') {
        this.switchExamDoc('lc', false);
      } else if (pNum >= 5 && pNum <= 7 && this.currentDocType === 'lc') {
        this.switchExamDoc('rc', false);
      }
    }

    this.renderOmrSheet();
  },

  getCorrectAnswer(edition, testNum, qNum) {
    const keys = window.TOEIC_ANSWER_KEYS;
    if (!keys || !keys[edition] || !keys[edition][String(testNum)]) return null;
    return keys[edition][String(testNum)][qNum - 1] || null;
  },

  renderOmrSheet() {
    const list = document.getElementById('omr-questions-list');
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];
    const answers = testState.answers || {};
    const revealed = testState.revealed || {};
    const isGraded = testState.graded;

    const totalAnswered = Object.keys(answers).length;
    document.getElementById('omr-sheet-title').textContent =
      `Phiếu OMR • ETS ${this.currentEdition} Test ${String(this.currentTest).padStart(2, '0')}`;
    document.getElementById('omr-progress-text').textContent =
      `Đã chọn: ${totalAnswered}/200 câu`;

    let qStart = 1;
    let qEnd = 200;
    if (this.omrPartFilter !== 'all') {
      const range = PART_RANGES[this.omrPartFilter];
      if (range) {
        qStart = range[0];
        qEnd = range[1];
      }
    }

    const fragment = document.createDocumentFragment();

    for (let q = qStart; q <= qEnd; q++) {
      const userAns = answers[q];
      const correctAns = this.getCorrectAnswer(this.currentEdition, this.currentTest, q);
      const showResult = isGraded || revealed[q] || (this.instantGrade && userAns);

      const row = document.createElement('div');
      let rowClass = 'omr-row';
      if (showResult && userAns) {
        rowClass += (userAns === correctAns) ? ' row-correct' : ' row-wrong';
      }
      row.className = rowClass;

      const options = (q >= 7 && q <= 31) ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

      let bubblesHtml = '';
      options.forEach(opt => {
        let bClass = 'bubble-btn';
        if (userAns === opt) bClass += ' selected';
        if (showResult) {
          if (opt === correctAns) bClass += ' correct-ans';
          else if (userAns === opt && userAns !== correctAns) bClass += ' wrong-ans';
        }
        bubblesHtml += `<button class="${bClass}" onclick="App.selectOmrAnswer(${q}, '${opt}')">${opt}</button>`;
      });

      const statusBadge = showResult
        ? `<span style="font-size:0.76rem; font-weight:900; min-width:34px; text-align:right;">${
            userAns === correctAns ? '✅' : `❌(${correctAns})`
          }</span>`
        : `<button class="peek-btn" title="Xem đáp án câu ${q}" onclick="App.peekQuestion(${q})">👁️</button>`;

      row.innerHTML = `
        <span class="q-num">Câu ${q}</span>
        <div class="q-bubbles">${bubblesHtml}</div>
        ${statusBadge}
      `;
      fragment.appendChild(row);
    }

    list.innerHTML = '';
    list.appendChild(fragment);
  },

  selectOmrAnswer(qNum, option) {
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];
    testState.answers[qNum] = option;

    const correctAns = this.getCorrectAnswer(this.currentEdition, this.currentTest, qNum);

    if (this.instantGrade) {
      this.state.questionsChecked++;
      if (option === correctAns) {
        this.state.questionsCorrect++;
        AnimeSound.correct();
        this.addExp(5, `🔔 Pin-Pon! Câu ${qNum} đáp án ${option} hoàn toàn chính xác! (+5 EXP) 🌸`);
      } else {
        AnimeSound.wrong();
        this.mascotSay(`💢 Bubu~ Câu ${qNum} đáp án đúng là (${correctAns}) cơ Senpai ơi! Cố lên nhé!`, false);
      }
    } else {
      AnimeSound.selectOption(option);
      this.addExp(1);
    }

    if (!this.timerRunning && this.timerSeconds === 7200) {
      this.toggleExamTimer(true);
    }

    this.saveState();
    this.renderOmrSheet();
  },

  peekQuestion(qNum) {
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];
    if (!testState.revealed) testState.revealed = {};
    testState.revealed[qNum] = true;

    const userAns = testState.answers[qNum];
    const correctAns = this.getCorrectAnswer(this.currentEdition, this.currentTest, qNum);

    if (userAns) {
      if (userAns === correctAns) AnimeSound.correct();
      else AnimeSound.wrong();
    } else {
      AnimeSound.click();
    }

    this.saveState();
    this.renderOmrSheet();
  },

  convertToeicScore(lcCorrect, rcCorrect) {
    const calcLc = c => {
      if (c <= 6) return 5;
      if (c >= 96) return 495;
      return Math.min(495, Math.round(((c - 6) / 90) * 490 / 5) * 5 + 5);
    };
    const calcRc = c => {
      if (c <= 9) return 5;
      if (c >= 97) return 495;
      return Math.min(495, Math.round(((c - 9) / 88) * 490 / 5) * 5 + 5);
    };
    const lcScore = calcLc(lcCorrect);
    const rcScore = calcRc(rcCorrect);
    return { lcScore, rcScore, total: lcScore + rcScore };
  },

  gradeCurrentTest() {
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];
    const answers = testState.answers || {};

    let lcCorrect = 0;
    let rcCorrect = 0;
    let answeredCount = 0;

    for (let q = 1; q <= 200; q++) {
      const u = answers[q];
      const c = this.getCorrectAnswer(this.currentEdition, this.currentTest, q);
      if (u) {
        answeredCount++;
        if (u === c) {
          if (q <= 100) lcCorrect++;
          else rcCorrect++;
        }
      }
    }

    const { lcScore, rcScore, total } = this.convertToeicScore(lcCorrect, rcCorrect);
    testState.graded = true;
    testState.lcCorrect = lcCorrect;
    testState.rcCorrect = rcCorrect;
    testState.lcScore = lcScore;
    testState.rcScore = rcScore;
    testState.scoreTotal = total;

    this.state.questionsChecked += answeredCount;
    this.state.questionsCorrect += (lcCorrect + rcCorrect);

    AnimeSound.fanfare();
    this.addExp(50);
    this.saveState();
    this.renderOmrSheet();
    this.updateScoreBanner();

    if (total >= 650) {
      this.mascotSay(`🏆 SUGOI SENPAI!! Bạn đạt ${total}/990 điểm (LC: ${lcScore} + RC: ${rcScore}) — VƯỢT MỤC TIÊU TOEIC 650+ rồi!! (+50 EXP) 🌸🎉`, false);
    } else {
      this.mascotSay(`✨ Đã chấm xong! Tổng điểm: ${total}/990 (Đúng ${lcCorrect + rcCorrect}/200 câu: LC ${lcCorrect}/100, RC ${rcCorrect}/100). Xem lại các câu báo đỏ để tiến tới mốc 650+ nhé!`, false);
    }
  },

  updateScoreBanner() {
    const banner = document.getElementById('omr-score-banner');
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];

    if (!testState || !testState.graded) {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'block';
    const goalBadge = testState.scoreTotal >= 650
      ? '<span style="background:var(--correct-green); color:#fff; padding:2px 8px; border-radius:99px;">ĐẠT 650+ 🎉</span>'
      : `<span style="background:var(--wrong-red); color:#fff; padding:2px 8px; border-radius:99px;">Cần +${650 - testState.scoreTotal}đ để đạt 650</span>`;

    banner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <span style="font-size:1.0rem;">🏆 Điểm TOEIC: <strong>${testState.scoreTotal} / 990</strong></span>
        ${goalBadge}
      </div>
      <div style="margin-top:4px; font-size:0.8rem;">
        🎧 Listening: <strong>${testState.lcCorrect || 0}/100</strong> (${testState.lcScore}đ) &nbsp;|&nbsp;
        📖 Reading: <strong>${testState.rcCorrect || 0}/100</strong> (${testState.rcScore}đ)
      </div>
    `;
  },

  resetCurrentTest() {
    AnimeSound.click();
    const testKey = `${this.currentEdition}_${this.currentTest}`;
    this.state.savedTests[testKey] = {
      answers: {},
      revealed: {},
      graded: false,
      scoreTotal: 0,
      lcScore: 0,
      rcScore: 0
    };
    this.resetExamTimer(false);
    this.saveState();
    this.renderOmrSheet();
    this.updateScoreBanner();
    this.mascotSay('🔄 Đã Reset toàn bộ 200 câu và đồng hồ của đề này! Senpai sẵn sàng làm lại chưa nào? 🌸');
  },

  resetCurrentPart() {
    AnimeSound.click();
    if (this.omrPartFilter === 'all') {
      this.resetCurrentTest();
      return;
    }
    const range = PART_RANGES[this.omrPartFilter];
    if (!range) return;

    const testKey = `${this.currentEdition}_${this.currentTest}`;
    const testState = this.state.savedTests[testKey];
    for (let q = range[0]; q <= range[1]; q++) {
      if (testState.answers) delete testState.answers[q];
      if (testState.revealed) delete testState.revealed[q];
    }
    testState.graded = false;
    this.saveState();
    this.renderOmrSheet();
    this.updateScoreBanner();
    this.mascotSay(`🧹 Đã Reset các câu thuộc Part ${this.omrPartFilter} (${range[0]}–${range[1]})! 🌸`);
  },

  resetExamTimer(playSfx = true) {
    if (playSfx) AnimeSound.click();
    this.timerRunning = false;
    this.timerSeconds = 7200;
    this.renderTimerDisplay();
    const stateEl = document.getElementById('exam-timer-state');
    if (stateEl) stateEl.textContent = '(Sẵn sàng)';
  },

  toggleExamTimer(forceStart) {
    AnimeSound.click();
    this.timerRunning = typeof forceStart === 'boolean' ? forceStart : !this.timerRunning;
    const stateEl = document.getElementById('exam-timer-state');

    if (this.timerRunning) {
      stateEl.textContent = '(Đang chạy)';
      if (!this.timerInterval) {
        this.timerInterval = setInterval(() => {
          if (!this.timerRunning) return;
          if (this.timerSeconds > 0) {
            this.timerSeconds--;
            this.renderTimerDisplay();
          } else {
            this.timerRunning = false;
            AnimeSound.fanfare();
            this.mascotSay('⏰ Hết 120 phút làm bài rồi Senpai ơi! Hãy bấm Chấm Điểm để xem kết quả nhé!');
          }
        }, 1000);
      }
    } else {
      stateEl.textContent = '(Tạm dừng)';
    }
  },

  renderTimerDisplay() {
    const m = Math.floor(this.timerSeconds / 60);
    const s = this.timerSeconds % 60;
    document.getElementById('exam-timer-display').textContent =
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ==========================================================================
  // LISTENING DRILL STUDIO
  // ==========================================================================
  initDrillStudio() {
    if (!this.catalog) return;

    this.drillGroups = [];
    if (this.catalog.partDrill2024 && this.catalog.partDrill2024.length > 0) {
      this.drillGroups.push({
        id: 'ets2024-parts',
        title: `🌸 ETS 2024 - Audio Cắt Từng Part (${this.catalog.partDrill2024.length} file)`,
        defaultKeyYear: '2024',
        clips: this.catalog.partDrill2024.map(c => ({
          ...c,
          questions: Array.from({ length: Math.min(10, c.qEnd - c.qStart + 1) }, (_, i) => c.qStart + i)
        }))
      });
    }

    (this.catalog.drillSets || []).forEach(ds => {
      this.drillGroups.push({
        id: ds.id,
        title: `🎧 File Nghe Cắt Lẻ - ${ds.title}`,
        defaultKeyYear: '2022',
        testNumber: ds.testNumber,
        clips: ds.clips.map(c => ({ ...c, testNumber: ds.testNumber }))
      });
    });

    const sel = document.getElementById('sel-drill-set');
    sel.innerHTML = '';
    this.drillGroups.forEach((g, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = g.title;
      sel.appendChild(opt);
    });

    const player = document.getElementById('drill-audio-player');
    const vis = document.getElementById('drill-visualizer');
    player.addEventListener('play', () => vis.classList.add('playing'));
    player.addEventListener('pause', () => vis.classList.remove('playing'));
    player.addEventListener('ended', () => vis.classList.remove('playing'));

    if (this.drillGroups.length > 0) {
      const defaultIdx = this.drillGroups.length > 1 ? 1 : 0;
      sel.value = defaultIdx;
      this.onSelectDrillSet();
    }
  },

  onSelectDrillSet() {
    const idx = parseInt(document.getElementById('sel-drill-set').value || '0', 10);
    this.currentDrillGroupIdx = idx;
    this.currentDrillClipIdx = 0;

    const grp = this.drillGroups[idx];
    if (grp && grp.defaultKeyYear) {
      document.getElementById('sel-drill-key-year').value = grp.defaultKeyYear;
    }

    this.renderDrillClipList();
    this.selectDrillClip(0, false);
  },

  renderDrillClipList() {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    const listEl = document.getElementById('drill-clip-list');
    const query = (document.getElementById('inp-drill-search').value || '').toLowerCase().trim();
    listEl.innerHTML = '';
    if (!grp) return;

    grp.clips.forEach((clip, idx) => {
      if (query && !clip.label.toLowerCase().includes(query) && !clip.filename.toLowerCase().includes(query)) {
        return;
      }
      const item = document.createElement('div');
      item.className = 'clip-item' + (idx === this.currentDrillClipIdx ? ' active' : '');
      item.innerHTML = `
        <span>🎵 ${clip.label}</span>
        <span style="font-size:0.74rem; opacity:0.8;">▶</span>
      `;
      item.onclick = () => this.selectDrillClip(idx, true);
      listEl.appendChild(item);
    });
  },

  selectDrillClip(clipIdx, autoPlay = true) {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    if (!grp || !grp.clips[clipIdx]) return;

    this.currentDrillClipIdx = clipIdx;
    const clip = grp.clips[clipIdx];

    document.getElementById('drill-badge').textContent = grp.title;
    document.getElementById('drill-clip-title').textContent = `${clip.label} (${clip.filename})`;

    const player = document.getElementById('drill-audio-player');
    player.src = clip.url;
    if (autoPlay) {
      AnimeSound.click();
      player.play().catch(() => {});
    }

    this.renderDrillClipList();
    this.renderDrillQuestions();
  },

  prevDrillClip() {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    if (!grp) return;
    const nextIdx = Math.max(0, this.currentDrillClipIdx - 1);
    this.selectDrillClip(nextIdx, true);
  },

  nextDrillClip() {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    if (!grp) return;
    const nextIdx = Math.min(grp.clips.length - 1, this.currentDrillClipIdx + 1);
    this.selectDrillClip(nextIdx, true);
  },

  resetDrillProgress() {
    AnimeSound.click();
    this.drillAnswers = {};
    const notesEl = document.getElementById('drill-notes');
    if (notesEl) notesEl.value = '';
    this.renderDrillQuestions();
    this.mascotSay('🔄 Đã xóa toàn bộ đáp án và ghi chú trong Phòng Luyện Nghe! 🌸');
  },

  resetCurrentDrillClip() {
    AnimeSound.click();
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    if (!grp) return;
    const clip = grp.clips[this.currentDrillClipIdx];
    if (!clip) return;
    (clip.questions || [clip.qStart || 1]).forEach(qNum => {
      delete this.drillAnswers[`${grp.id}_${this.currentDrillClipIdx}_${qNum}`];
    });
    this.renderDrillQuestions();
  },

  renderDrillQuestions() {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    if (!grp) return;
    const clip = grp.clips[this.currentDrillClipIdx];
    if (!clip) return;

    const keyYear = document.getElementById('sel-drill-key-year').value || '2022';
    const box = document.getElementById('drill-questions-box');
    box.innerHTML = '';

    const questions = clip.questions || [clip.qStart || 1];
    questions.forEach(qNum => {
      const stateKey = `${grp.id}_${this.currentDrillClipIdx}_${qNum}`;
      const chosen = this.drillAnswers[stateKey];
      const correctAns = this.getCorrectAnswer(keyYear, clip.testNumber || 1, qNum);

      const row = document.createElement('div');
      row.className = 'omr-row ' + (chosen ? (chosen === correctAns ? 'row-correct' : 'row-wrong') : '');

      const opts = (qNum >= 7 && qNum <= 31) ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      let bHtml = '';
      opts.forEach(opt => {
        let cls = 'bubble-btn';
        if (chosen === opt) cls += ' selected';
        if (chosen) {
          if (opt === correctAns) cls += ' correct-ans';
          else if (chosen === opt && chosen !== correctAns) cls += ' wrong-ans';
        }
        bHtml += `<button class="${cls}" onclick="App.answerDrillQuestion(${qNum}, '${opt}')">${opt}</button>`;
      });

      row.innerHTML = `
        <span class="q-num">Câu ${qNum} (Test ${clip.testNumber || 1})</span>
        <div class="q-bubbles">${bHtml}</div>
        <span style="font-size:0.82rem; font-weight:900;">
          ${chosen ? (chosen === correctAns ? '✅ Chính xác!' : `❌ Đáp án: ${correctAns}`) : 'Chọn A/B/C/D'}
        </span>
      `;
      box.appendChild(row);
    });
  },

  answerDrillQuestion(qNum, opt) {
    const grp = this.drillGroups[this.currentDrillGroupIdx];
    const clip = grp.clips[this.currentDrillClipIdx];
    const keyYear = document.getElementById('sel-drill-key-year').value || '2022';
    const stateKey = `${grp.id}_${this.currentDrillClipIdx}_${qNum}`;

    this.drillAnswers[stateKey] = opt;
    const correctAns = this.getCorrectAnswer(keyYear, clip.testNumber || 1, qNum);

    this.state.questionsChecked++;
    if (opt === correctAns) {
      this.state.questionsCorrect++;
      AnimeSound.correct();
      this.addExp(5, `🔔 Pin-Pon! Phản xạ nghe quá đỉnh Senpai ơi! Câu ${qNum} là (${opt})! (+5 EXP) 🌸`);
    } else {
      AnimeSound.wrong();
      this.mascotSay(`💢 Bubu~ Câu ${qNum} đáp án là (${correctAns}). Hãy bấm tua lại nghe thêm 1 lần nữa nhé!`, false);
    }

    this.renderDrillQuestions();
  },

  // ==========================================================================
  // LIBRARY VIEW
  // ==========================================================================
  renderLibrary() {
    const list = document.getElementById('library-files-list');
    if (!list || !this.catalog) return;

    const items = [
      { title: '📕 Full Book: ETS 2024 - LISTENING (10 Tests)', url: this.catalog.editions['2024'].fullBooks.lc },
      { title: '📘 Full Book: ETS 2024 - READING (10 Tests)', url: this.catalog.editions['2024'].fullBooks.rc },
      { title: '📜 Full Script Giải Thích: ETS 2024 LC', url: this.catalog.editions['2024'].fullBooks.script },
      { title: '🔑 Đáp Án Gốc: ETS 2024 LC & RC', url: this.catalog.editions['2024'].fullBooks.keyLc },
      { title: '📙 Full Book: ETS 2023 Listening (10 Tests)', url: this.catalog.editions['2023'].fullBooks.lc },
      { title: '📗 Full Book: ETS 2023 Reading (10 Tests)', url: this.catalog.editions['2023'].fullBooks.rc },
      { title: '📜 Full Transcript: ETS 2023 LC', url: this.catalog.editions['2023'].fullBooks.script },
      { title: '📕 Full Book: ETS 2022 Listening (10 Tests)', url: this.catalog.editions['2022'].fullBooks.lc },
      { title: '📘 Full Book: ETS 2022 Reading (10 Tests)', url: this.catalog.editions['2022'].fullBooks.rc },
      { title: '📜 Full Script: ETS 2022 LC', url: this.catalog.editions['2022'].fullBooks.script }
    ];

    list.innerHTML = items.map(it => `
      <a href="${it.url}" target="_blank" class="clip-item" style="text-decoration:none; color:var(--text-main);">
        <span>${it.title}</span>
        <span style="color:var(--sakura-pink); font-weight:900;">Mở PDF ↗</span>
      </a>
    `).join('');
  },

  // ==========================================================================
  // FALLING SAKURA PETALS CANVAS ANIMATION (GENTLE & SOFT)
  // ==========================================================================
  initSakuraCanvas() {
    const canvas = document.getElementById('sakura-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const petals = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 5 + Math.random() * 6,
      speedY: 0.4 + Math.random() * 0.7,
      speedX: -0.3 + Math.random() * 0.6,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      opacity: 0.22 + Math.random() * 0.25
    }));

    const draw = () => {
      if (!this.petalsEnabled) {
        requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.25;
        p.angle += p.spin;

        if (p.y > canvas.height + 20) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 20) p.x = -15;
        if (p.x < -20) p.x = canvas.width + 15;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 109, 125, ${p.opacity})`;
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, p.size / 3, 0, p.size);
        ctx.bezierCurveTo(-p.size, p.size / 3, -p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
