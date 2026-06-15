// ===== EKAGRA — App Logic =====

const STORAGE_KEY = 'ekagra_v1';

let state = {
  weeks: {},        // weeks[weekKey][muscleId] = { customExercises: [], notes: '' }
  logs: {},         // logs[weekKey][muscleId][exerciseName][dayIdx] = [{reps, weight, effort}, ...]
  cuePrefs: {},      // cuePrefs[exerciseName] = 'internal' | 'external'
  overload: {},      // overload[exerciseName] = { weight, week: weekKey }
  readiness: {},     // readiness[weekKey] = { sleep, soreness, energy }
  streaks: {}        // streaks[muscleId] = number of consecutive weeks hitting target
};

let currentWeekOffset = 0;
let expandedMuscle = null;
let activeDayIdx = null; // for muscle detail day tabs

// ---- persistence ----
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
    }
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {}
}

// ---- date / week helpers ----
function getWeekKey(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `week_${y}_${m}_${d}`;
}

function getWeekLabel(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const suffix = offset === 0 ? ' (current)' : offset < 0 ? ` (${Math.abs(offset)}w ago)` : ` (+${offset}w)`;
  return `${fmt(monday)} – ${fmt(sunday)}${suffix}`;
}

function getTodayIdx() {
  const day = new Date().getDay(); // 0=Sun
  return (day + 6) % 7; // 0=Mon ... 6=Sun
}

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ---- muscle data with custom exercises ----
function getMuscleExercises(muscleId, weekKey) {
  const base = MUSCLES.find(m => m.id === muscleId);
  const wk = weekKey || getWeekKey(currentWeekOffset);
  const custom = (state.weeks[wk]?.[muscleId]?.customExercises) || [];
  const customObjs = custom.map(name => ({
    name, type: 'isolation', custom: true,
    cues: { internal: 'Focus on the target muscle, control the tempo', external: 'Move the weight smoothly through the full range' }
  }));
  return [...base.exercises, ...customObjs];
}

function ensureWeek(weekKey) {
  if (!state.weeks[weekKey]) state.weeks[weekKey] = {};
  if (!state.logs[weekKey]) state.logs[weekKey] = {};
}

function getMuscleLog(weekKey, muscleId) {
  ensureWeek(weekKey);
  if (!state.logs[weekKey][muscleId]) state.logs[weekKey][muscleId] = {};
  return state.logs[weekKey][muscleId];
}

function getExerciseSets(weekKey, muscleId, exName, dayIdx) {
  const ml = getMuscleLog(weekKey, muscleId);
  if (!ml[exName]) ml[exName] = {};
  if (!ml[exName][dayIdx]) ml[exName][dayIdx] = [];
  return ml[exName][dayIdx];
}

function getTotalSets(weekKey, muscleId) {
  const ml = state.logs[weekKey]?.[muscleId] || {};
  let total = 0;
  for (const exName in ml) {
    for (const dayIdx in ml[exName]) {
      total += ml[exName][dayIdx].length;
    }
  }
  return total;
}

// ---- toast ----
function showToast(msg, duration = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), duration);
}

// ===================== HEADER / FOCUS LINE =====================
function renderHeader() {
  const idx = (new Date().getDay() + 6) % 7; // 0=Mon
  // map to Sun=0 based DAY_FOCUS array (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
  const sunBasedIdx = new Date().getDay();
  const focus = DAY_FOCUS[sunBasedIdx];
  const schedDay = DEFAULT_SCHEDULE[idx];
  document.getElementById('dayPill').textContent = `${schedDay.day.toUpperCase()} · ${schedDay.label.toUpperCase()}`;
  document.getElementById('focusLine').textContent = focus.cue;
}

// ===================== TABS =====================
function switchTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'track') renderTrack();
  if (tab === 'train') renderTrain();
  if (tab === 'schedule') renderSchedule();
  if (tab === 'progress') renderProgress();
}

// ===================== TRACK TAB (rings + detail) =====================
function changeWeek(dir) {
  currentWeekOffset += dir;
  expandedMuscle = null;
  renderTrack();
}

function renderTrack() {
  document.getElementById('weekDisplay').textContent = getWeekLabel(currentWeekOffset);
  renderSummaryBar();
  renderRings();
  renderMuscleDetail();
}

function renderSummaryBar() {
  const wk = getWeekKey(currentWeekOffset);
  let totalSets = 0, onTarget = 0;
  for (const m of MUSCLES) {
    const done = getTotalSets(wk, m.id);
    totalSets += done;
    if (done >= m.targetMin) onTarget++;
  }
  document.getElementById('summaryBar').innerHTML = `
    <div class="summary-item">
      <div class="s-label">Total Sets</div>
      <div class="s-value">${totalSets}</div>
      <div class="s-sub">this week</div>
    </div>
    <div class="summary-item">
      <div class="s-label">On Target</div>
      <div class="s-value">${onTarget}/${MUSCLES.length}</div>
      <div class="s-sub">groups</div>
    </div>
  `;
}

function ringCircumference(r) { return 2 * Math.PI * r; }

function renderRings() {
  const grid = document.getElementById('ringGrid');
  const wk = getWeekKey(currentWeekOffset);
  const r = 28;
  const circ = ringCircumference(r);

  grid.innerHTML = MUSCLES.map(m => {
    const done = getTotalSets(wk, m.id);
    const max = m.targetMax || 1;
    const pct = Math.min(done / max, 1);
    const offset = circ * (1 - pct);
    let fillClass = '';
    let statusClass = 'under', statusText = 'UNDER';
    if (done >= m.targetMin && done < m.targetMax) { statusClass = 'ok'; statusText = 'ON TARGET'; }
    if (done >= m.targetMax) { fillClass = 'over'; statusClass = 'over'; statusText = 'OVER'; }
    if (done === 0) { statusClass = ''; statusText = '—'; }
    // fatigue flag: >= targetMax + 4 -> approaching MRV
    if (done >= m.targetMax + 4) { fillClass = 'danger-flag'; statusText = 'NEAR MRV'; statusClass = 'under'; }

    return `
      <div class="ring-card" onclick="toggleMuscleDetail('${m.id}')">
        <svg class="ring-svg" viewBox="0 0 70 70">
          <circle class="ring-track" cx="35" cy="35" r="${r}"/>
          <circle class="ring-fill ${fillClass}" cx="35" cy="35" r="${r}"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          <text class="ring-center-text" x="35" y="36">${done}</text>
        </svg>
        <div class="ring-label">${m.short}</div>
        <div class="ring-target">target ${m.targetMin}-${m.targetMax}</div>
        <div class="ring-status ${statusClass}">${statusText}</div>
      </div>
    `;
  }).join('');
}

function toggleMuscleDetail(muscleId) {
  expandedMuscle = expandedMuscle === muscleId ? null : muscleId;
  activeDayIdx = activeDayIdx === null ? getTodayIdx() : activeDayIdx;
  renderMuscleDetail();
  if (expandedMuscle) {
    setTimeout(() => {
      document.getElementById('muscleDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}

function renderMuscleDetail() {
  const container = document.getElementById('muscleDetail');
  if (!expandedMuscle) { container.innerHTML = ''; return; }

  const m = MUSCLES.find(x => x.id === expandedMuscle);
  const wk = getWeekKey(currentWeekOffset);
  const exercises = getMuscleExercises(m.id, wk);
  const dayIdx = activeDayIdx ?? getTodayIdx();

  container.innerHTML = `
    <div class="muscle-detail">
      <div class="md-header">
        <div>
          <div class="md-title">${m.name}</div>
          <div class="md-meta">${m.targetMin}-${m.targetMax} sets/week · ${m.freq}</div>
        </div>
        <button class="md-close" onclick="toggleMuscleDetail('${m.id}')">✕</button>
      </div>
      <div class="md-note">${m.note}</div>
      <div class="day-tabs">
        ${DAY_NAMES.map((d, i) => {
          const log = getMuscleLog(wk, m.id);
          let count = 0;
          for (const exName in log) count += (log[exName][i] || []).length;
          return `<div class="day-tab ${i === dayIdx ? 'active' : ''}" onclick="setActiveDay(${i})">${d}${count > 0 ? `<span class="day-count">${count}</span>` : ''}</div>`;
        }).join('')}
      </div>
      ${exercises.map(ex => renderExerciseBlock(m, ex, wk, dayIdx)).join('')}
      <div class="add-exercise-row">
        <input class="add-exercise-input" id="newExName-${m.id}" placeholder="Add custom exercise...">
        <button class="add-exercise-btn" onclick="addCustomExercise('${m.id}')">Add</button>
      </div>
    </div>
  `;
}

function setActiveDay(idx) {
  activeDayIdx = idx;
  renderMuscleDetail();
}

function renderExerciseBlock(muscle, ex, wk, dayIdx) {
  const sets = getExerciseSets(wk, muscle.id, ex.name, dayIdx);
  const pref = state.cuePrefs[ex.name];

  return `
    <div class="ex-block">
      <div class="ex-header">
        <div class="ex-title">${ex.name}</div>
        <div class="ex-type-badge">${ex.type}</div>
      </div>
      <div class="ex-cues">
        <div class="cue-tag ${pref === 'internal' ? 'preferred' : ''}" onclick="setCuePref('${escapeQ(ex.name)}','internal')">
          <span class="cue-label">Internal${pref === 'internal' ? ' ★' : ''}</span>${ex.cues.internal}
        </div>
        <div class="cue-tag ${pref === 'external' ? 'preferred' : ''}" onclick="setCuePref('${escapeQ(ex.name)}','external')">
          <span class="cue-label">External${pref === 'external' ? ' ★' : ''}</span>${ex.cues.external}
        </div>
      </div>
      <div class="input-labels">
        <span></span><span>Reps</span><span>Weight</span><span>Effort</span><span></span>
      </div>
      <div class="sets-list">
        ${sets.map((s, i) => `
          <div class="set-row">
            <div class="set-num">${i+1}</div>
            <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps ?? ''}"
              onchange="updateSet('${wk}','${muscle.id}','${escapeQ(ex.name)}',${dayIdx},${i},'reps',this.value)">
            <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight ?? ''}"
              onchange="updateSet('${wk}','${muscle.id}','${escapeQ(ex.name)}',${dayIdx},${i},'weight',this.value)">
            <input class="set-input" type="text" placeholder="-" value="${s.effort ?? ''}" readonly
              onclick="cycleEffort('${wk}','${muscle.id}','${escapeQ(ex.name)}',${dayIdx},${i})"
              style="cursor:pointer; color:${effortColor(s.effort)}">
            <button class="set-remove" onclick="removeSet('${wk}','${muscle.id}','${escapeQ(ex.name)}',${dayIdx},${i})">×</button>
          </div>
        `).join('')}
      </div>
      <div class="add-set-wrap">
        <button class="add-set-btn" onclick="addSet('${wk}','${muscle.id}','${escapeQ(ex.name)}',${dayIdx})">+ Add Set</button>
      </div>
    </div>
  `;
}

function escapeQ(str) { return str.replace(/'/g, "\\'"); }

function effortColor(effort) {
  if (effort === 'E') return 'var(--green-lit)';
  if (effort === 'M') return 'var(--accent)';
  if (effort === 'F') return 'var(--ember)';
  return 'var(--muted)';
}

function cycleEffort(wk, muscleId, exName, dayIdx, setIdx) {
  const sets = getExerciseSets(wk, muscleId, exName, dayIdx);
  const order = ['', 'E', 'M', 'F'];
  const cur = sets[setIdx].effort || '';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  sets[setIdx].effort = next;
  saveState();
  renderMuscleDetail();
}

function addSet(wk, muscleId, exName, dayIdx) {
  const sets = getExerciseSets(wk, muscleId, exName, dayIdx);
  const last = sets[sets.length - 1];
  sets.push({ reps: last?.reps ?? '', weight: last?.weight ?? '', effort: '' });
  saveState();
  renderMuscleDetail();
  renderRings();
  renderSummaryBar();
}

function removeSet(wk, muscleId, exName, dayIdx, idx) {
  const sets = getExerciseSets(wk, muscleId, exName, dayIdx);
  sets.splice(idx, 1);
  saveState();
  renderMuscleDetail();
  renderRings();
  renderSummaryBar();
}

function updateSet(wk, muscleId, exName, dayIdx, idx, field, val) {
  const sets = getExerciseSets(wk, muscleId, exName, dayIdx);
  sets[idx][field] = field === 'effort' ? val : (val === '' ? '' : Number(val));
  saveState();

  // track overload (max weight seen this session for this exercise)
  if (field === 'weight' && val !== '') {
    const w = Number(val);
    if (!state.overload[exName] || w >= state.overload[exName].weight) {
      state.overload[exName] = { weight: w, week: wk, exType: null };
      saveState();
    }
  }
}

function setCuePref(exName, pref) {
  state.cuePrefs[exName] = state.cuePrefs[exName] === pref ? null : pref;
  saveState();
  renderMuscleDetail();
}

function addCustomExercise(muscleId) {
  const input = document.getElementById(`newExName-${muscleId}`);
  const name = input.value.trim();
  if (!name) return;
  const wk = getWeekKey(currentWeekOffset);
  ensureWeek(wk);
  if (!state.weeks[wk][muscleId]) state.weeks[wk][muscleId] = {};
  if (!state.weeks[wk][muscleId].customExercises) state.weeks[wk][muscleId].customExercises = [];
  state.weeks[wk][muscleId].customExercises.push(name);
  saveState();
  input.value = '';
  renderMuscleDetail();
  showToast('Exercise added');
}

// ===================== SCHEDULE TAB =====================
function renderSchedule() {
  const todayIdx = getTodayIdx();
  document.getElementById('scheduleContent').innerHTML = DEFAULT_SCHEDULE.map((d, i) => {
    const muscles = d.focus.map(id => MUSCLES.find(m => m.id === id)?.short).join(' · ');
    const sunBasedIdx = (i + 1) % 7; // convert Mon=0 index to Sun=0 index for DAY_FOCUS
    const ruler = DAY_FOCUS[sunBasedIdx];
    return `
      <div class="schedule-day" style="${i === todayIdx ? 'border-color: var(--accent-dim);' : ''}">
        <div class="sd-header">
          <div class="sd-day">${d.day.toUpperCase()}${i === todayIdx ? ' · TODAY' : ''}</div>
          <div class="sd-label">${d.label}</div>
        </div>
        <div class="sd-muscles">${muscles}</div>
        <div class="sd-ruler">${ruler.cue}</div>
      </div>
    `;
  }).join('');
}

// ===================== TRAIN TAB (session launcher) =====================
function renderTrain() {
  const todayIdx = getTodayIdx();
  const today = DEFAULT_SCHEDULE[todayIdx];
  const wk = getWeekKey(0);

  let muscleSummaries = today.focus.map(id => {
    const m = MUSCLES.find(x => x.id === id);
    const done = getTotalSets(wk, id);
    return `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--faint); font-size:11px;">
      <span style="color:var(--text)">${m.short}</span>
      <span style="color:var(--muted)">${done} / ${m.targetMin}-${m.targetMax} sets this week</span>
    </div>`;
  }).join('');

  document.getElementById('trainContent').innerHTML = `
    <div class="muscle-detail" style="margin-bottom:16px;">
      <div class="md-header">
        <div>
          <div class="md-title">${today.day.toUpperCase()} — ${today.label.toUpperCase()}</div>
          <div class="md-meta">${today.focus.length} muscle groups</div>
        </div>
      </div>
      <div class="md-note">${DAY_FOCUS[new Date().getDay()].cue}</div>
      <div style="padding: 12px 16px;">
        ${muscleSummaries}
      </div>
      <div style="padding: 0 16px 16px;">
        <button class="session-log-btn" onclick="startSession()">Start Session</button>
      </div>
    </div>
  `;
}

// ===================== SESSION MODE =====================
let session = null; // { dayIdx, muscles: [], queue: [{muscleId, exName, ex, muscle}], idx, sessionStartTime, timerInterval, elapsed }

function startSession() {
  const todayIdx = getTodayIdx();
  const today = DEFAULT_SCHEDULE[todayIdx];

  const queue = [];
  const wk0 = getWeekKey(0);
  today.focus.forEach(muscleId => {
    const muscle = MUSCLES.find(m => m.id === muscleId);
    const exercises = getMuscleExercises(muscleId, wk0);
    exercises.forEach(ex => queue.push({ muscleId, muscle, ex }));
  });

  session = {
    dayIdx: todayIdx,
    today,
    queue,
    idx: 0,
    elapsed: 0,
    timerInterval: null
  };

  document.getElementById('sessionDayTitle').textContent = `${today.day.toUpperCase()} — ${today.label.toUpperCase()}`;
  document.getElementById('sessionOverlay').classList.add('active');

  session.timerInterval = setInterval(() => {
    session.elapsed++;
    const mins = Math.floor(session.elapsed / 60);
    const secs = session.elapsed % 60;
    document.getElementById('sessionTimerDisplay').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }, 1000);

  renderSessionStep();
}

function exitSession() {
  if (session?.timerInterval) clearInterval(session.timerInterval);
  document.getElementById('sessionOverlay').classList.remove('active');
  document.getElementById('restOverlay').classList.remove('active');
  if (restTimer.interval) clearInterval(restTimer.interval);
  session = null;
  renderTrack();
  renderTrain();
}

function renderSessionStep() {
  if (!session) return;
  if (session.idx >= session.queue.length) {
    document.getElementById('sessionBody').innerHTML = `
      <div style="text-align:center; padding-top: 60px;">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:4px; color: var(--accent); margin-bottom:12px;">SESSION COMPLETE</div>
        <div style="font-family:'Crimson Pro',serif; font-style:italic; color:var(--muted); margin-bottom:24px;">Quality over quantity. One-pointed focus, executed.</div>
        <button class="session-log-btn" onclick="exitSession()" style="max-width:240px; margin: 0 auto;">Finish</button>
      </div>
    `;
    return;
  }

  const step = session.queue[session.idx];
  const { muscle, ex, muscleId } = step;
  const wk = getWeekKey(0);
  const dayIdx = session.dayIdx;
  const sets = getExerciseSets(wk, muscleId, ex.name, dayIdx);
  const pref = state.cuePrefs[ex.name];
  const lastSet = sets[sets.length - 1];

  document.getElementById('sessionBody').innerHTML = `
    <div class="session-progress">EXERCISE ${session.idx + 1} / ${session.queue.length}</div>
    <div class="session-muscle">${muscle.short}</div>
    <div class="session-exercise">${ex.name}</div>
    <div class="session-cues">
      <div class="session-cue ${pref === 'internal' ? 'preferred' : ''}" onclick="setSessionCuePref('${escapeQ(ex.name)}','internal')">
        <span class="session-cue-label">Internal${pref === 'internal' ? ' ★' : ''}</span>${ex.cues.internal}
      </div>
      <div class="session-cue ${pref === 'external' ? 'preferred' : ''}" onclick="setSessionCuePref('${escapeQ(ex.name)}','external')">
        <span class="session-cue-label">External${pref === 'external' ? ' ★' : ''}</span>${ex.cues.external}
      </div>
    </div>
    <div class="session-input-row">
      <div class="session-input-group">
        <label>Reps</label>
        <input type="number" inputmode="numeric" id="sessReps" value="${lastSet?.reps ?? ''}">
      </div>
      <div class="session-input-group">
        <label>Weight (kg)</label>
        <input type="number" inputmode="decimal" id="sessWeight" value="${lastSet?.weight ?? ''}">
      </div>
      <div class="session-input-group">
        <label>Set #</label>
        <input type="text" value="${sets.length + 1}" readonly style="color: var(--muted);">
      </div>
    </div>
    <div class="effort-row">
      <button class="effort-btn easy" onclick="selectEffort('E')" id="effortE">Easy</button>
      <button class="effort-btn moderate" onclick="selectEffort('M')" id="effortM">Moderate</button>
      <button class="effort-btn failure" onclick="selectEffort('F')" id="effortF">Near Failure</button>
    </div>
    <button class="session-log-btn" onclick="logSessionSet()">Log Set & Rest</button>
    <div class="session-set-log">
      ${sets.map((s, i) => `<div class="session-set-log-item"><span>Set ${i+1}</span><span>${s.reps || '-'} reps × ${s.weight || '-'} kg ${s.effort ? '· ' + effortFull(s.effort) : ''}</span></div>`).join('')}
    </div>
    <div style="display:flex; gap:10px; margin-top:20px;">
      <button class="rest-btn" onclick="prevExercise()" style="flex:1;">← Prev</button>
      <button class="rest-btn" onclick="nextExercise()" style="flex:1;">Skip →</button>
    </div>
  `;

  session.selectedEffort = null;
}

function effortFull(e) {
  return { E: 'Easy', M: 'Moderate', F: 'Near Failure' }[e] || '';
}

function selectEffort(e) {
  session.selectedEffort = session.selectedEffort === e ? null : e;
  ['E','M','F'].forEach(x => document.getElementById('effort'+x).classList.remove('selected'));
  if (session.selectedEffort) document.getElementById('effort'+session.selectedEffort).classList.add('selected');
}

function setSessionCuePref(exName, pref) {
  state.cuePrefs[exName] = state.cuePrefs[exName] === pref ? null : pref;
  saveState();
  renderSessionStep();
}

function logSessionSet() {
  const step = session.queue[session.idx];
  const { muscleId, ex } = step;
  const wk = getWeekKey(0);
  const dayIdx = session.dayIdx;
  const sets = getExerciseSets(wk, muscleId, ex.name, dayIdx);

  const reps = document.getElementById('sessReps').value;
  const weight = document.getElementById('sessWeight').value;
  const effort = session.selectedEffort || '';

  sets.push({
    reps: reps === '' ? '' : Number(reps),
    weight: weight === '' ? '' : Number(weight),
    effort
  });

  if (weight !== '') {
    const w = Number(weight);
    if (!state.overload[ex.name] || w >= state.overload[ex.name].weight) {
      state.overload[ex.name] = { weight: w, week: wk };
    }
  }

  saveState();
  openRestPanel(ex.type, effort);
}

function nextExercise() {
  if (session.idx < session.queue.length - 1) {
    session.idx++;
  } else {
    session.idx = session.queue.length;
  }
  renderSessionStep();
}

function prevExercise() {
  if (session.idx > 0) session.idx--;
  renderSessionStep();
}

// ===================== ADAPTIVE REST TIMER (manual control) =====================
// You decide when rest starts — the timer never starts itself.
let restTimer = { remaining: 0, total: 0, interval: null, running: false };

function openRestPanel(exType, effort) {
  let base = REST_DEFAULTS[exType] || REST_DEFAULTS.isolation;
  let extended = false;
  if (effort === 'F') {
    base += 30;
    extended = true;
  }

  restTimer.total = base;
  restTimer.remaining = base;
  restTimer.running = false;
  if (restTimer.interval) clearInterval(restTimer.interval);

  document.getElementById('restExtendNote').textContent = extended
    ? 'Extended +30s — that set was near failure'
    : '';

  document.getElementById('restLabel').textContent = 'REST — TAP START WHEN READY';
  document.getElementById('restToggleBtn').textContent = 'Start';
  document.getElementById('restOverlay').classList.add('active');
  updateRestDisplay();
}

function toggleRest() {
  if (restTimer.running) {
    pauseRest();
  } else {
    resumeRest();
  }
}

function resumeRest() {
  if (restTimer.remaining <= 0) return;
  restTimer.running = true;
  document.getElementById('restToggleBtn').textContent = 'Pause';
  document.getElementById('restLabel').textContent = 'REST';

  if (restTimer.interval) clearInterval(restTimer.interval);
  restTimer.interval = setInterval(() => {
    restTimer.remaining--;
    updateRestDisplay();
    if (restTimer.remaining <= 0) {
      clearInterval(restTimer.interval);
      restTimer.running = false;
      playBeep();
      document.getElementById('restLabel').textContent = 'REST COMPLETE';
      document.getElementById('restToggleBtn').textContent = 'Start';
    }
  }, 1000);
}

function pauseRest() {
  restTimer.running = false;
  if (restTimer.interval) clearInterval(restTimer.interval);
  document.getElementById('restToggleBtn').textContent = 'Start';
  document.getElementById('restLabel').textContent = 'REST — PAUSED';
}

function resetRest() {
  if (restTimer.interval) clearInterval(restTimer.interval);
  restTimer.running = false;
  restTimer.remaining = restTimer.total;
  document.getElementById('restToggleBtn').textContent = 'Start';
  document.getElementById('restLabel').textContent = 'REST — TAP START WHEN READY';
  updateRestDisplay();
}

function updateRestDisplay() {
  const mins = Math.floor(Math.max(restTimer.remaining, 0) / 60);
  const secs = Math.max(restTimer.remaining, 0) % 60;
  document.getElementById('restTimeDisplay').textContent = `${mins}:${String(secs).padStart(2,'0')}`;
  const circ = 628;
  const pct = restTimer.total > 0 ? restTimer.remaining / restTimer.total : 0;
  document.getElementById('restRingFill').setAttribute('stroke-dashoffset', circ * (1 - Math.max(Math.min(pct, 1), 0)));
}

function addRestTime(sec) {
  restTimer.remaining = Math.max(restTimer.remaining + sec, 0);
  restTimer.total = Math.max(restTimer.total + sec, restTimer.remaining, 1);
  updateRestDisplay();
}

function skipRest() {
  if (restTimer.interval) clearInterval(restTimer.interval);
  restTimer.running = false;
  document.getElementById('restOverlay').classList.remove('active');
  renderSessionStep();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

// ===================== PROGRESS TAB =====================
function renderProgress() {
  renderReadiness();
  renderCharts();
  renderOverload();
  renderStreaks();
  const lbl = document.getElementById('resetWeekLabel');
  if (lbl) lbl.textContent = `Viewed week (${getWeekLabel(currentWeekOffset).split('(')[0].trim()})`;
}

function renderReadiness() {
  const wk = getWeekKey(0);
  const r = state.readiness[wk] || {};
  const questions = [
    { key: 'sleep', label: 'Sleep quality this week', opts: ['Poor','Okay','Good'] },
    { key: 'soreness', label: 'Overall soreness', opts: ['Low','Moderate','High'] },
    { key: 'energy', label: 'Energy / motivation', opts: ['Low','Okay','High'] }
  ];

  document.getElementById('readinessCard').innerHTML = `
    <div class="rc-title">Weekly Readiness Check-In</div>
    ${questions.map(q => `
      <div class="rc-question">
        <div class="rc-question-label">${q.label}</div>
        <div class="rc-options">
          ${q.opts.map(o => `<div class="rc-option ${r[q.key] === o ? 'selected' : ''}" onclick="setReadiness('${q.key}','${o}')">${o}</div>`).join('')}
        </div>
      </div>
    `).join('')}
    ${renderReadinessSummary(r)}
  `;
}

function setReadiness(key, val) {
  const wk = getWeekKey(0);
  if (!state.readiness[wk]) state.readiness[wk] = {};
  state.readiness[wk][key] = state.readiness[wk][key] === val ? null : val;
  saveState();
  renderReadiness();
}

function renderReadinessSummary(r) {
  if (!r.sleep && !r.soreness && !r.energy) return '';
  let note = '';
  if (r.soreness === 'High' && r.sleep === 'Poor') {
    note = 'Recovery signals are low — consider trimming a set or two off accessory work this week.';
  } else if (r.energy === 'High' && r.sleep === 'Good') {
    note = 'Strong recovery signals — a good week to push for overload on your priority lifts.';
  } else {
    note = 'Train as planned, adjust intensity by feel.';
  }
  return `<div style="font-family:'Crimson Pro',serif; font-style:italic; font-size:12px; color:var(--accent-dim); margin-top:8px; padding-top:12px; border-top:1px solid var(--border);">${note}</div>`;
}

function renderCharts() {
  const container = document.getElementById('chartsContent');
  let html = '';
  for (const m of MUSCLES) {
    const weeks = [];
    for (let i = -3; i <= 0; i++) {
      const wk = getWeekKey(i);
      weeks.push({ label: getWeekLabel(i).split('(')[0].split('–')[0].trim(), value: getTotalSets(wk, m.id) });
    }
    const maxVal = Math.max(m.targetMax, ...weeks.map(w => w.value), 1);
    html += `
      <div class="chart-card">
        <div class="chart-title">${m.short}</div>
        <div class="chart-bars">
          ${weeks.map(w => {
            let cls = '';
            if (w.value >= m.targetMin && w.value < m.targetMax) cls = 'in-target';
            if (w.value >= m.targetMax) cls = 'over';
            const h = Math.max((w.value / maxVal) * 100, 2);
            return `<div class="chart-bar-wrap">
              <div class="chart-bar ${cls}" style="height:${h}%"></div>
              <div class="chart-bar-label">${w.value}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex; gap:6px;">
          ${weeks.map(w => `<div class="chart-bar-wrap" style="flex:1;"><div class="chart-bar-label">${w.label}</div></div>`).join('')}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderOverload() {
  const entries = Object.entries(state.overload);
  if (entries.length === 0) {
    document.getElementById('overloadCard').innerHTML = `<div style="font-size:11px; color:var(--muted);">No weight logged yet — log sets in Train mode to build your overload history.</div>`;
    return;
  }

  // figure out rep ranges for flag: check most recent week logs for top-of-range reps
  const wk = getWeekKey(0);
  let html = '';
  for (const [exName, data] of entries) {
    let flag = '';
    // search this week's logs for this exercise, check if any set hit reps >= 12 (top of typical hypertrophy range)
    for (const muscleId in (state.logs[wk] || {})) {
      const exLog = state.logs[wk][muscleId][exName];
      if (exLog) {
        for (const dayIdx in exLog) {
          const sets = exLog[dayIdx];
          const allTopRange = sets.length > 0 && sets.every(s => s.reps >= 12 && s.weight === data.weight);
          if (allTopRange) flag = `+2.5KG NEXT`;
        }
      }
    }
    html += `
      <div class="overload-row">
        <div class="overload-name">${exName}</div>
        <div class="overload-weight">${data.weight}kg</div>
        ${flag ? `<div class="overload-flag">${flag}</div>` : '<div></div>'}
      </div>
    `;
  }
  document.getElementById('overloadCard').innerHTML = html;
}

function renderStreaks() {
  let html = '';
  for (const m of MUSCLES) {
    let streak = 0;
    for (let i = 0; i >= -12; i--) {
      const wk = getWeekKey(i);
      const done = getTotalSets(wk, m.id);
      if (i === 0 && done === 0) continue; // don't break streak on current incomplete week
      if (done >= m.targetMin) streak++;
      else break;
    }
    html += `
      <div class="streak-item">
        <div class="streak-flame">${streak}</div>
        <div class="streak-name">${m.short}</div>
      </div>
    `;
  }
  document.getElementById('streakGrid').innerHTML = html;
}

// ===================== RESET CONTROLS =====================
function confirmReset(type) {
  const messages = {
    today: 'Clear all sets logged for today? This cannot be undone.',
    week: `Clear all logs, custom exercises and notes for ${getWeekLabel(currentWeekOffset).split('(')[0].trim()}? This cannot be undone.`,
    overload: 'Clear all tracked overload weights for every exercise? This cannot be undone.',
    all: 'Wipe EVERYTHING — all weeks, logs, cue preferences, overload history and streaks? This cannot be undone.'
  };
  if (!confirm(messages[type])) return;

  if (type === 'today') resetToday();
  if (type === 'week') resetWeek();
  if (type === 'overload') resetOverload();
  if (type === 'all') resetAll();
}

function resetToday() {
  const wk = getWeekKey(0);
  const todayIdx = getTodayIdx();
  const muscleLogs = state.logs[wk] || {};
  for (const muscleId in muscleLogs) {
    for (const exName in muscleLogs[muscleId]) {
      if (muscleLogs[muscleId][exName][todayIdx]) {
        muscleLogs[muscleId][exName][todayIdx] = [];
      }
    }
  }
  saveState();
  showToast('Today\u2019s session cleared');
  renderTrain();
  renderTrack();
  renderProgress();
}

function resetWeek() {
  const wk = getWeekKey(currentWeekOffset);
  delete state.weeks[wk];
  delete state.logs[wk];
  delete state.readiness[wk];
  saveState();
  showToast('Week cleared');
  expandedMuscle = null;
  renderTrack();
  renderTrain();
  renderProgress();
}

function resetOverload() {
  state.overload = {};
  saveState();
  showToast('Overload history cleared');
  renderProgress();
}

function resetAll() {
  // double-confirm for full wipe
  if (!confirm('Are you absolutely sure? Everything will be permanently deleted.')) return;
  state = {
    weeks: {},
    logs: {},
    cuePrefs: {},
    overload: {},
    readiness: {},
    streaks: {}
  };
  saveState();
  expandedMuscle = null;
  currentWeekOffset = 0;
  showToast('All data reset');
  renderHeader();
  renderTrain();
  renderTrack();
  renderSchedule();
  renderProgress();
}


loadState();
renderHeader();
renderTrain();
renderTrack();
