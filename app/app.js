const { h, Component } = DC;

const STORAGE_KEY = 'workoutTracker.v1';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const SEED_PROGRAM = [
  { id: 'a', name: 'Day A', focus: 'Squat · Push · Hinge', ex: [
    { id: 'a1', n: 'Back Squat', sets: 4, reps: '5', step: 5, base: 205, inc: 5 },
    { id: 'a2', n: 'DB Bench Press', sets: 3, reps: '8', step: 5, ss: 'A', base: 70, inc: 5 },
    { id: 'a3', n: 'Pull-up', sets: 3, reps: '6', step: 5, ss: 'A', bw: true, base: 0, inc: 0 },
    { id: 'a4', n: 'Romanian Deadlift', sets: 3, reps: '8', step: 5, base: 185, inc: 5 },
    { id: 'a5', n: 'Ab Wheel', sets: 3, reps: '8–12', step: 5, bw: true, base: 0, inc: 0 }
  ] },
  { id: 'b', name: 'Day B', focus: 'Deadlift · Press · Carry', ex: [
    { id: 'b1', n: 'Deadlift', sets: 3, reps: '5', step: 10, base: 315, inc: 10 },
    { id: 'b2', n: 'Overhead Press', sets: 4, reps: '6', step: 5, ss: 'A', base: 115, inc: 5 },
    { id: 'b3', n: 'Pull-up', sets: 4, reps: '6–8', step: 5, ss: 'A', bw: true, base: 0, inc: 0 },
    { id: 'b4', n: 'Bulgarian Split Squat', sets: 3, reps: '8 / leg', step: 5, base: 50, inc: 5 },
    { id: 'b5', n: 'Suitcase Carry', sets: 3, reps: '120 ft', step: 10, base: 80, inc: 10 }
  ] },
  { id: 'c', name: 'Day C', focus: 'Front Squat · Hinge · Detail', ex: [
    { id: 'c1', n: 'Front Squat', sets: 3, reps: '8', step: 5, base: 165, inc: 5 },
    { id: 'c2', n: 'DB Floor Press', sets: 3, reps: '10', step: 5, ss: 'A', base: 65, inc: 5 },
    { id: 'c3', n: 'One-arm DB Row', sets: 3, reps: '12 / side', step: 5, ss: 'A', base: 75, inc: 5 },
    { id: 'c4', n: 'Hip Thrust', sets: 3, reps: '10', step: 10, base: 225, inc: 10 },
    { id: 'c5', n: 'Kettlebell Swing', sets: 6, reps: '10', step: 5, base: 53, inc: 0 },
    { id: 'c6', n: 'Lateral Raise + Curl', sets: 2, reps: '12–15', step: 5, base: 20, inc: 0 }
  ] }
];

const LIBRARY = ['Back Squat','Front Squat','Deadlift','Romanian Deadlift','Overhead Press','Bench Press','DB Bench Press','DB Floor Press','Pull-up','Chin-up','One-arm DB Row','Barbell Row','Hip Thrust','Bulgarian Split Squat','Kettlebell Swing','Suitcase Carry','Ab Wheel','Lateral Raise + Curl','Face Pull','Calf Raise'];

function pad2(n) { return String(n).padStart(2, '0'); }
function iso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function midnight(d) { const c = new Date(d.getTime()); c.setHours(0, 0, 0, 0); return c; }
function daysAgoDate(n, from) { const d = midnight(from || new Date()); d.setDate(d.getDate() - n); return d; }
function repsNum(reps) { const m = String(reps).match(/\d+/); return m ? parseInt(m[0], 10) : 8; }
function shortDate(isoStr) { const p = isoStr.split('-'); return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1]; }
function agoLabel(isoStr) {
  const p = isoStr.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  const n = Math.round((midnight(new Date()) - d) / 86400000);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  return n + ' days ago';
}

function buildSeedLogs(program, refDate) {
  const logs = [];
  const order = ['c', 'b', 'a'];
  for (let k = 0; k < 21; k++) {
    const dayId = order[k % 3];
    const day = program.find((d) => d.id === dayId);
    const cycle = Math.floor(k / 3);
    const date = iso(daysAgoDate(2 + k * 2, refDate));
    logs.push({
      id: 'seed' + k, dayId, date,
      ex: day.ex.map((e) => {
        const w = e.bw ? 0 : Math.max(e.inc * 2, e.base - e.inc * cycle);
        const target = repsNum(e.reps);
        return { n: e.n, sets: Array.from({ length: e.sets }, (_, i) => ({
          w, r: i === e.sets - 1 && cycle > 0 ? Math.max(1, target - 1) : target
        })) };
      })
    });
  }
  return logs.reverse();
}

// ---------- small icon factory ----------
function icon(paths, { size = 18, stroke = '#201e1d', sw = 2.75, fill = 'none', cap = 'round', join = 'round' } = {}) {
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill },
    paths.map((d) => h('path', { d, stroke: fill === 'none' ? stroke : undefined, fill: fill !== 'none' ? stroke : 'none', 'stroke-width': sw, 'stroke-linecap': cap, 'stroke-linejoin': join })));
}
const Icon = {
  chevronRight: (c) => icon(['M9 6l6 6-6 6'], { size: 18, stroke: c || '#8c491a' }),
  chevronUp: (c) => icon(['M6 15l6-6 6 6'], { size: 14, stroke: c || '#645c50' }),
  back: (c) => icon(['M15 6l-6 6 6 6'], { size: 18, stroke: c || '#201e1d' }),
  checkBig: (c) => icon(['M20 6L9 17l-5-5'], { size: 19, stroke: c || '#56633f', sw: 3 }),
  checkSmall: (c) => icon(['M20 6L9 17l-5-5'], { size: 12, stroke: c || '#fffaf1', sw: 3.5 }),
  minus: (c, size) => icon(['M5 12h14'], { size: size || 15, stroke: c || '#645c50', sw: 3 }),
  plus: (c, size) => icon(['M12 5v14M5 12h14'], { size: size || 15, stroke: c || '#645c50', sw: 3 }),
  pause: () => icon(['M9 5v14M15 5v14'], { size: 16, stroke: '#fffaf1', sw: 3 }),
  play: () => icon(['M7 4l13 8-13 8z'], { size: 16, stroke: '#fffaf1', sw: 2.4, fill: '#fffaf1' }),
  skip: () => h('svg', { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none' },
    h('path', { d: 'M5 5l9 7-9 7z', fill: '#645c50', stroke: '#645c50', 'stroke-width': 2.75, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('path', { d: 'M19 5v14', stroke: '#645c50', 'stroke-width': 2.75, 'stroke-linecap': 'round' })),
  gear: (c) => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: c || '#645c50', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    h('circle', { cx: 12, cy: 12, r: 3.2 }),
    h('path', { d: 'M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1.04-1.56V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.56 1.04H19.5a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z' }))
};

class App extends Component {
  state = {
    ready: false, screen: 'home', dayIdx: 0, planIdx: 0,
    program: null, logs: [], entries: null, extra: [],
    drag: null, rest: null, sheet: null, summary: null,
    trendPick: null, startedAt: null,
    settings: { units: 'lb', carryOver: true, restTimer: true }
  };

  unit() { return this.state.settings.units || 'lb'; }

  componentDidMount() {
    let program = null, logs = null, settings = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); program = p.program; logs = p.logs; settings = p.settings; }
    } catch (_) {}
    if (!program) {
      program = JSON.parse(JSON.stringify(SEED_PROGRAM));
      logs = buildSeedLogs(program, new Date());
    }
    this.setState({
      program, logs: logs || [], ready: true,
      settings: Object.assign({ units: 'lb', carryOver: true, restTimer: true }, settings || {})
    });
    this._t = setInterval(() => {
      const r = this.state.rest;
      if (!r || !r.running || r.secs <= 0) return;
      this.setState({ rest: Object.assign({}, r, { secs: r.secs - 1 }) });
    }, 1000);
  }
  componentWillUnmount() { clearInterval(this._t); }

  save(patch) {
    this.setState(patch, () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          program: this.state.program, logs: this.state.logs, settings: this.state.settings
        }));
      } catch (_) {}
    });
  }

  cloneProgram() { return this.state.program.map((d) => Object.assign({}, d, { ex: d.ex.map((e) => Object.assign({}, e)) })); }

  lastLogFor(dayId) {
    for (let i = this.state.logs.length - 1; i >= 0; i--) if (this.state.logs[i].dayId === dayId) return this.state.logs[i];
    return null;
  }
  lastSetsFor(name) {
    for (let i = this.state.logs.length - 1; i >= 0; i--) {
      const hit = this.state.logs[i].ex.find((e) => e.n === name);
      if (hit && hit.sets.length) return { sets: hit.sets, date: this.state.logs[i].date };
    }
    return null;
  }

  sessionEx() {
    const day = this.state.program[this.state.dayIdx];
    return day.ex.concat(this.state.extra);
  }

  openDay(i) {
    const day = this.state.program[i];
    const entries = day.ex.map((e) => this.seedRows(e));
    this.setState({ screen: 'session', dayIdx: i, entries, extra: [], drag: null, rest: null, startedAt: Date.now() });
  }

  seedRows(e) {
    const prev = this.lastSetsFor(e.n);
    const carry = this.state.settings.carryOver !== false;
    return Array.from({ length: e.sets }, (_, i) => {
      const l = prev ? prev.sets[Math.min(i, prev.sets.length - 1)] : null;
      return {
        w: carry && l ? l.w : (e.bw ? 0 : e.base || 0),
        r: carry && l ? l.r : repsNum(e.reps),
        done: false, touchedW: false, touchedR: false
      };
    });
  }

  patchRow(ei, si, patch) {
    const entries = this.state.entries.map((a) => a.map((o) => Object.assign({}, o)));
    entries[ei][si] = Object.assign({}, entries[ei][si], patch);
    this.setState({ entries });
  }

  setDone(ei, si, val) {
    this.patchRow(ei, si, { done: val });
    if (val && this.state.settings.restTimer !== false) this.startRest(ei, si);
  }

  startRest(ei, si) {
    const list = this.sessionEx();
    const e = list[ei];
    const total = e.step >= 10 ? 180 : (e.ss ? 75 : 120);
    let next = 'then set ' + (si + 2) + ' · ' + e.n;
    if (si + 1 >= this.state.entries[ei].length) {
      const nx = list[ei + 1];
      next = nx ? 'then ' + nx.n : 'last set done';
    } else if (e.ss) {
      const partner = list.find((o, i) => i !== ei && o.ss === e.ss);
      if (partner) next = 'then ' + partner.n;
    }
    this.setState({ rest: { secs: total, total, running: true, next } });
  }

  finishSession() {
    const list = this.sessionEx();
    const entries = this.state.entries;
    const logged = [];
    const lines = [];
    let sets = 0, volume = 0, wins = 0;
    list.forEach((e, ei) => {
      const done = entries[ei].filter((r) => r.done);
      if (!done.length) return;
      const prev = this.lastSetsFor(e.n);
      logged.push({ n: e.n, sets: done.map((r) => ({ w: r.w, r: r.r })) });
      sets += done.length;
      done.forEach((r) => { volume += (r.w || 0) * (r.r || 0); });
      const top = done.reduce((a, b) => (b.w > a.w || (b.w === a.w && b.r > a.r) ? b : a), done[0]);
      const prevTop = prev ? prev.sets.reduce((a, b) => (b.w > a.w || (b.w === a.w && b.r > a.r) ? b : a), prev.sets[0]) : null;
      const better = prevTop ? (top.w > prevTop.w || (top.w === prevTop.w && top.r > prevTop.r)) : true;
      if (better) wins++;
      lines.push({
        n: e.n,
        detail: done.length + ' sets · top ' + (e.bw && top.w === 0 ? 'BW' : top.w + ' ' + this.unit()) + ' × ' + top.r,
        delta: prevTop ? (better ? 'up' : (top.w === prevTop.w && top.r === prevTop.r ? 'matched' : 'down')) : 'new',
        deltaColor: better ? '#56633f' : 'rgba(32,30,29,.45)'
      });
    });
    if (!logged.length) { this.setState({ screen: 'home', rest: null }); return; }
    const day = this.state.program[this.state.dayIdx];
    const mins = Math.max(1, Math.round((Date.now() - (this.state.startedAt || Date.now())) / 60000));
    const logs = this.state.logs.concat([{ id: 'l' + Date.now(), dayId: day.id, date: iso(new Date()), ex: logged }]);
    this.save({
      logs, screen: 'summary', rest: null, entries: null, extra: [],
      summary: { kicker: day.name + ' · ' + mins + ' min', title: 'Logged.', sets, volume, wins, total: logged.length, lines }
    });
  }

  editSets(i, d) {
    const program = this.cloneProgram();
    const e = program[this.state.planIdx].ex[i];
    e.sets = Math.max(1, Math.min(10, e.sets + d));
    this.save({ program });
  }

  moveLift(i) {
    if (i === 0) return;
    const program = this.cloneProgram();
    const ex = program[this.state.planIdx].ex;
    const t = ex[i - 1]; ex[i - 1] = ex[i]; ex[i] = t;
    this.save({ program });
  }

  openExSheet(i) {
    const e = i == null ? { n: '', sets: 3, reps: '8', step: 5, ss: '' } : this.state.program[this.state.planIdx].ex[i];
    this.setState({ sheet: { kind: 'ex', idx: i, name: e.n, sets: String(e.sets), reps: e.reps, step: String(e.step), ss: e.ss || '' } });
  }
  openDaySheet(isNew) {
    const d = this.state.program[this.state.planIdx];
    this.setState({ sheet: { kind: 'day', isNew, name: isNew ? '' : d.name, focus: isNew ? '' : d.focus } });
  }
  openSessionAddSheet() {
    this.setState({ sheet: { kind: 'ex', idx: null, session: true, name: '', sets: '3', reps: '8', step: '5', ss: '' } });
  }
  openSettingsSheet() {
    this.setState({ sheet: { kind: 'settings' } });
  }

  saveSheet() {
    const s = this.state.sheet;
    if (!s) return;
    if (s.kind === 'day') {
      const program = this.cloneProgram();
      const name = (s.name || '').trim() || ('Day ' + String.fromCharCode(65 + program.length));
      const focus = (s.focus || '').trim() || 'New day';
      if (s.isNew) {
        program.push({ id: 'd' + Date.now(), name, focus, ex: [] });
        this.save({ program, sheet: null, planIdx: program.length - 1 });
      } else {
        program[this.state.planIdx].name = name;
        program[this.state.planIdx].focus = focus;
        this.save({ program, sheet: null });
      }
      return;
    }
    const name = (s.name || '').trim();
    if (!name) { this.setState({ sheet: null }); return; }
    const rec = {
      n: name, sets: Math.max(1, Math.min(10, parseInt(s.sets, 10) || 3)),
      reps: (String(s.reps).trim() || '8'), step: parseFloat(s.step) || 5,
      ss: s.ss || undefined, base: 0, inc: 0, bw: false
    };
    if (s.session) {
      const e = Object.assign({}, rec, { id: 'x' + Date.now() });
      const entries = this.state.entries.concat([this.seedRows(e)]);
      this.setState({ extra: this.state.extra.concat([e]), entries, sheet: null });
      return;
    }
    const program = this.cloneProgram();
    const ex = program[this.state.planIdx].ex;
    if (s.idx == null) ex.push(Object.assign({}, rec, { id: 'x' + Date.now() }));
    else ex[s.idx] = Object.assign({}, ex[s.idx], rec);
    this.save({ program, sheet: null });
  }

  removeSheet() {
    const s = this.state.sheet;
    const program = this.cloneProgram();
    if (s.kind === 'day') {
      if (program.length <= 1) { this.setState({ sheet: null }); return; }
      program.splice(this.state.planIdx, 1);
      this.save({ program, sheet: null, planIdx: 0, dayIdx: 0 });
    } else {
      program[this.state.planIdx].ex.splice(s.idx, 1);
      this.save({ program, sheet: null });
    }
  }

  setSheetField(key, value) {
    this.setState({ sheet: Object.assign({}, this.state.sheet, { [key]: value }) });
  }

  // ---------------------------------------------------------------- render

  render() {
    const st = this.state;
    if (!st.ready || !st.program) {
      return h('div', { class: 'app' },
        h('div', { class: 'home-pad' },
          h('div', { class: 'eyebrow' }, 'Loading'),
          h('h1', { class: 'display' }, 'Loading…')));
    }

    let screenNode;
    if (st.screen === 'home') screenNode = this.renderHome();
    else if (st.screen === 'session') screenNode = this.renderSession();
    else if (st.screen === 'summary') screenNode = this.renderSummary();
    else if (st.screen === 'plan') screenNode = this.renderPlan();
    else if (st.screen === 'progress') screenNode = this.renderProgress();

    const showNav = st.screen !== 'session' && st.screen !== 'summary';

    return h('div', { class: 'app' },
      screenNode,
      showNav && this.renderNav(),
      st.sheet && this.renderSheet());
  }

  renderHome() {
    const st = this.state;
    const program = st.program;
    const today = DOW[new Date().getDay()] + ' · ' + new Date().getDate() + ' ' + MONTHS[new Date().getMonth()];

    const days = program.map((d, i) => {
      const last = this.lastLogFor(d.id);
      return { d, i, last, exCount: d.ex.length, setCount: d.ex.reduce((s, e) => s + e.sets, 0) };
    });
    let oldest = null;
    days.forEach((row) => {
      const t = row.last ? row.last.date : '0000-00-00';
      if (!oldest || t < oldest._t) { oldest = row; oldest._t = t; }
    });

    const dayOf = {};
    st.logs.forEach((l) => { dayOf[l.date] = l.dayId; });
    const weekBars = [];
    for (let k = 13; k >= 0; k--) {
      const d = daysAgoDate(k);
      const key = iso(d);
      const hit = dayOf[key];
      weekBars.push({
        label: DOW[d.getDay()][0],
        height: hit ? 34 + (key.charCodeAt(9) % 3) * 6 : 10,
        fill: hit ? (hit === program[0].id ? '#c67139' : '#8fa073') : 'rgba(32,30,29,.13)'
      });
    }
    const recent = st.logs.filter((l) => l.date >= iso(daysAgoDate(13))).length;
    const homeSub = recent
      ? 'You have trained ' + recent + ' times in the last two weeks. ' + (oldest ? oldest.d.name + ' is the one you have left longest.' : '')
      : 'Nothing logged yet — pick a day and start.';

    return h('div', { class: 'scroll home-pad' },
      h('div', { class: 'home-head-row' },
        h('div', { style: { minWidth: 0 } },
          h('div', { class: 'eyebrow' }, today),
          h('h1', { class: 'display' }, 'Pick your day.'),
          h('div', { class: 'sub' }, homeSub)),
        h('div', { class: 'icon-btn tap', onClick: () => this.openSettingsSheet() }, Icon.gear())),

      days.map((row) => h('div', { class: 'day-card tap', key: row.d.id, onClick: () => this.openDay(row.i) },
        h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' } },
          h('div', { style: { minWidth: 0 } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
              h('span', { class: 'day-name' }, row.d.name),
              row === oldest && h('span', { class: 'next-badge' }, 'Up next')),
            h('div', { class: 'day-focus' }, row.d.focus)),
          h('div', { class: 'icon-btn' }, Icon.chevronRight())),
        h('div', { class: 'day-footer' },
          h('span', {}, h('b', {}, row.exCount), ' lifts'),
          h('span', {}, h('b', {}, row.setCount), ' sets'),
          h('span', { style: { marginLeft: 'auto' } }, row.last ? 'Last done ' + agoLabel(row.last.date) : 'Not logged yet')))),

      h('div', { class: 'week-card' },
        h('div', { class: 'week-head' },
          h('span', { class: 'week-head-label' }, 'Last 14 days'),
          h('span', { class: 'week-head-count' }, recent + ' sessions')),
        h('div', { class: 'week-bars' },
          weekBars.map((w, i) => h('div', { class: 'week-bar-col', key: i },
            h('div', { class: 'week-bar', style: { background: w.fill, height: w.height + 'px' } }),
            h('span', { class: 'week-bar-label' }, w.label))))));
  }

  renderSession() {
    const st = this.state;
    const day = st.program[st.dayIdx];
    const list = this.sessionEx();
    const unit = this.unit();
    let doneCount = 0, totalSets = 0;

    const exCards = list.map((e, ei) => {
      const prev = this.lastSetsFor(e.n);
      const top = prev ? prev.sets.reduce((a, b) => (b.w > a.w || (b.w === a.w && b.r > a.r) ? b : a), prev.sets[0]) : null;
      const rows = (st.entries[ei] || []).map((v, si) => {
        const l = prev ? prev.sets[Math.min(si, prev.sets.length - 1)] : null;
        const isDrag = st.drag && st.drag.ei === ei && st.drag.si === si;
        const better = l && (v.w > l.w || (v.w === l.w && v.r > l.r));
        totalSets++; if (v.done) doneCount++;
        const wVal = e.bw && !v.touchedW && v.w === 0 ? 'BW' : String(v.w);
        const hint = v.done ? (better ? 'up' : (l && v.w === l.w && v.r === l.r ? 'same' : (l ? 'down' : 'new'))) : (l ? 'last' : '');
        const hintColor = v.done && better ? '#56633f' : 'rgba(32,30,29,.34)';
        const dx = isDrag ? st.drag.dx : 0;

        const onDown = (ev) => { this._d = { ei, si, x0: ev.clientX, pointerId: ev.pointerId, captured: false }; };
        const onMove = (ev) => {
          const d = this._d; if (!d || d.ei !== ei || d.si !== si) return;
          const raw = ev.clientX - d.x0;
          if (Math.abs(raw) > 3) {
            // Only take pointer capture once this is actually a drag, not a
            // tap — capturing on every pointerdown would hijack click
            // delivery to the row and swallow taps on the checkmark/steppers.
            if (!d.captured) { try { ev.currentTarget.setPointerCapture(d.pointerId); } catch (_) {} d.captured = true; }
            this.setState({ drag: { ei, si, dx: Math.max(-28, Math.min(90, raw)) } });
          }
        };
        const onUp = () => {
          if (!this._d) return;
          const cur = this.state.drag && this.state.drag.ei === ei && this.state.drag.si === si ? this.state.drag.dx : 0;
          this._d = null;
          if (cur > 52) this.setDone(ei, si, true);
          else if (cur < -20) this.setDone(ei, si, false);
          this.setState({ drag: null });
        };

        return h('div', { class: 'set-row-wrap', key: si },
          !v.done && h('div', { class: 'set-row-check-underlay' }, Icon.checkBig()),
          h('div', {
            class: 'set-row', onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp,
            style: { background: v.done ? '#f0fae1' : '#fffaf1', transform: 'translateX(' + dx + 'px)', transition: isDrag ? 'none' : 'transform .22s cubic-bezier(.2,.9,.3,1)' }
          },
            h('div', { class: 'set-mark', onClick: () => this.setDone(ei, si, !v.done) },
              v.done ? h('div', { class: 'set-mark-done' }, Icon.checkSmall()) : h('span', { style: { fontSize: '13px', fontWeight: '800', color: 'rgba(32,30,29,.4)' } }, si + 1)),
            h('div', { class: 'stepper stepper-w' },
              h('div', { class: 'stepper-btn stepper-btn-w tap', onClick: () => this.patchRow(ei, si, { w: Math.max(0, v.w - e.step), touchedW: true }) }, Icon.minus()),
              h('div', { class: 'stepper-input-w' },
                h('input', {
                  value: wVal, inputMode: 'decimal', class: 'field-input', key: 'w',
                  style: { width: '40px', textAlign: 'right', fontSize: '16px', color: v.touchedW ? '#201e1d' : 'rgba(32,30,29,.34)' },
                  onChange: (ev) => { const n = parseFloat(String(ev.target.value).replace(/[^\d.]/g, '')); this.patchRow(ei, si, { w: isNaN(n) ? 0 : n, touchedW: true }); }
                }),
                h('span', { style: { fontSize: '9.5px', fontWeight: '700', color: 'rgba(32,30,29,.42)' } }, unit)),
              h('div', { class: 'stepper-btn stepper-btn-w tap', onClick: () => this.patchRow(ei, si, { w: v.w + e.step, touchedW: true }) }, Icon.plus())),
            h('div', { class: 'stepper stepper-r' },
              h('div', { class: 'stepper-btn stepper-btn-r tap', onClick: () => this.patchRow(ei, si, { r: Math.max(0, v.r - 1), touchedR: true }) }, Icon.minus()),
              h('input', {
                value: String(v.r), inputMode: 'numeric', class: 'field-input', key: 'r',
                style: { width: '30px', textAlign: 'center', fontSize: '16px', color: v.touchedR ? '#201e1d' : 'rgba(32,30,29,.34)' },
                onChange: (ev) => { const n = parseInt(String(ev.target.value).replace(/[^\d]/g, ''), 10); this.patchRow(ei, si, { r: isNaN(n) ? 0 : n, touchedR: true }); }
              }),
              h('div', { class: 'stepper-btn stepper-btn-r tap', onClick: () => this.patchRow(ei, si, { r: v.r + 1, touchedR: true }) }, Icon.plus())),
            h('div', { class: 'set-hint', style: { color: hintColor } }, hint)));
      });

      return h('div', { class: 'ex-card', key: e.id, style: { background: e.ss ? '#fdfbf3' : '#fffaf1' } },
        h('div', { class: 'ex-head' },
          h('div', { style: { minWidth: 0 } },
            e.ss && h('div', { class: 'ss-label' }, 'Superset ' + e.ss),
            h('div', { class: 'ex-name' }, e.n),
            h('div', { class: 'ex-target' }, e.sets + ' × ' + e.reps + (prev ? ' · last ' + agoLabel(prev.date) : ' · first time'))),
          h('div', {},
            h('div', { class: 'ex-top' }, top ? (e.bw && top.w === 0 ? 'BW × ' + top.r : top.w + ' × ' + top.r) : '—'),
            h('div', { class: 'ex-top-caption' }, top ? 'Top set then' : 'No history'))),
        h('div', { class: 'col-heads' },
          h('span', { style: { width: '24px', flex: 'none' } }, 'Set'),
          h('span', { style: { width: '112px', flex: 'none', textAlign: 'center' } }, 'Weight'),
          h('span', { style: { width: '96px', flex: 'none', textAlign: 'center' } }, 'Reps')),
        rows,
        h('div', { class: 'set-actions-row' },
          h('div', {
            class: 'set-action-add tap', onClick: () => {
              const entries = st.entries.map((a) => a.map((o) => Object.assign({}, o)));
              const lastRow = entries[ei][entries[ei].length - 1];
              entries[ei].push(Object.assign({}, lastRow, { done: false }));
              this.setState({ entries });
            }
          }, '+ Set'),
          h('div', {
            class: 'set-action-drop tap', onClick: () => {
              const entries = st.entries.map((a) => a.map((o) => Object.assign({}, o)));
              if (entries[ei].length > 1) entries[ei].pop();
              this.setState({ entries });
            }
          }, '−')));
    });

    const pct = totalSets ? Math.round((doneCount / totalSets) * 100) : 0;
    const r = st.rest, over = r && r.secs <= 0;
    const mm = r ? Math.floor(Math.abs(r.secs) / 60) : 0, ss2 = r ? Math.abs(r.secs) % 60 : 0;

    return h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } },
      h('div', { class: 'session-head' },
        h('div', { class: 'icon-btn tap', onClick: () => this.setState({ screen: 'home', rest: null }) }, Icon.back()),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'session-title' }, day.name),
          h('div', { class: 'session-subtitle' }, day.focus)),
        h('div', { class: 'session-done' }, doneCount + '/' + totalSets)),
      h('div', { class: 'progress-track' }, h('div', { class: 'progress-fill', style: { width: pct + '%' } })),

      r && h('div', { class: 'rest-panel' },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('div', { class: 'rest-kicker', style: { color: over ? '#56633f' : 'rgba(32,30,29,.45)' } }, over ? 'Rest complete — go' : (!r.running ? 'Rest paused' : 'Resting')),
            h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' } },
              h('span', { class: 'rest-clock' }, mm + ':' + (ss2 < 10 ? '0' + ss2 : ss2)),
              h('span', { class: 'rest-next' }, r.next))),
          h('div', {
            class: 'rest-round-btn tap', style: { background: '#ebddc5', fontSize: '12.5px', fontWeight: '800', color: '#645c50' },
            onClick: () => { const c = this.state.rest; if (c) this.setState({ rest: Object.assign({}, c, { secs: Math.max(0, c.secs) + 30, total: Math.max(c.total, Math.max(0, c.secs) + 30), running: true }) }); }
          }, '+30'),
          h('div', {
            class: 'rest-round-btn tap', style: { background: '#c67139' },
            onClick: () => { const c = this.state.rest; if (!c) return; this.setState({ rest: c.secs <= 0 ? Object.assign({}, c, { secs: c.total, running: true }) : Object.assign({}, c, { running: !c.running }) }); }
          }, (r.running && !over) ? Icon.pause() : Icon.play()),
          h('div', { class: 'rest-round-btn tap', style: { background: '#ebddc5' }, onClick: () => this.setState({ rest: null }) }, Icon.skip())),
        h('div', { class: 'rest-track' }, h('div', { style: { height: '100%', borderRadius: '999px', background: over ? '#8fa073' : '#c67139', width: Math.max(0, Math.min(100, (r.secs / r.total) * 100)) + '%' } }))),

      h('div', { class: 'scroll session-scroll' },
        exCards,
        h('div', { class: 'dashed-btn tap', style: { marginBottom: '12px' }, onClick: () => this.openSessionAddSheet() }, '+ Add a lift to today'),
        h('div', { class: 'pill-btn-primary tap', onClick: () => this.finishSession() }, doneCount ? 'Finish · log ' + doneCount + ' sets' : 'Nothing logged yet'),
        h('div', { class: 'helper-text' }, 'Muted numbers carry over from your last ' + day.name + '. Swipe a row right to log it.')));
  }

  renderSummary() {
    const sum = this.state.summary;
    if (!sum) return h('div', { class: 'scroll summary-pad' });
    const volume = sum.volume >= 1000 ? (sum.volume / 1000).toFixed(1) + 'k' : String(sum.volume);
    return h('div', { class: 'scroll summary-pad' },
      h('div', { class: 'eyebrow', style: { color: '#728157' } }, sum.kicker),
      h('h1', { class: 'display summary-title' }, sum.title),
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat-card' }, h('div', { class: 'stat-label' }, 'Sets'), h('div', { class: 'stat-value' }, sum.sets)),
        h('div', { class: 'stat-card' }, h('div', { class: 'stat-label' }, 'Volume'), h('div', { class: 'stat-value' }, volume)),
        h('div', { class: 'stat-card-accent' }, h('div', { class: 'stat-label-accent' }, 'Beat last'), h('div', { class: 'stat-value', style: { color: '#3d472b' } }, sum.wins + '/' + sum.total))),
      sum.lines.map((l, i) => h('div', { class: 'summary-line', key: i },
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'summary-line-name' }, l.n),
          h('div', { class: 'summary-line-detail' }, l.detail)),
        h('div', { class: 'summary-line-delta', style: { color: l.deltaColor } }, l.delta))),
      h('div', { class: 'pill-btn-dark tap', style: { marginTop: '22px' }, onClick: () => this.setState({ screen: 'home', summary: null }) }, 'Done'));
  }

  renderPlan() {
    const st = this.state;
    const program = st.program;
    const activeDay = program[st.planIdx] || program[0];
    const unit = this.unit();
    return h('div', { class: 'scroll plan-pad' },
      h('div', { class: 'plan-head-row' },
        h('h1', { class: 'display plan-title' }, 'Your plan'),
        h('div', { class: 'new-day-btn tap', onClick: () => this.openDaySheet(true) }, '+ Day')),
      h('div', { class: 'hscroll day-tabs' },
        program.map((d, i) => h('div', {
          class: 'day-tab tap', key: d.id,
          style: { background: i === st.planIdx ? '#fffaf1' : 'transparent', color: i === st.planIdx ? '#201e1d' : 'rgba(32,30,29,.55)' },
          onClick: () => this.setState({ planIdx: i })
        }, d.name))),
      h('div', { class: 'plan-links-row' },
        h('div', { class: 'plan-link tap', style: { color: 'rgba(32,30,29,.5)' }, onClick: () => this.openDaySheet(false) }, 'Rename day'),
        h('div', {
          class: 'plan-link tap', style: { color: 'rgba(140,73,26,.7)' },
          onClick: () => { if (program.length <= 1) return; const next = this.cloneProgram(); next.splice(st.planIdx, 1); this.save({ program: next, planIdx: 0, dayIdx: 0, sheet: null }); }
        }, 'Delete day')),
      activeDay.ex.map((e, i) => h('div', { class: 'plan-row', key: e.id },
        h('div', { class: 'plan-row-up tap', onClick: () => this.moveLift(i) }, Icon.chevronUp()),
        h('div', { class: 'plan-row-main tap', onClick: () => this.openExSheet(i) },
          h('div', { class: 'plan-row-name' }, e.n),
          h('div', { class: 'plan-row-meta' }, (e.ss ? 'Superset ' + e.ss + ' · ' : '') + e.reps + ' reps · ' + e.step + ' ' + unit + ' steps')),
        h('div', { class: 'plan-row-sets' },
          h('div', { class: 'plan-sets-btn tap', onClick: () => this.editSets(i, -1) }, Icon.minus(null, 13)),
          h('span', { class: 'plan-sets-label' }, e.sets + '×'),
          h('div', { class: 'plan-sets-btn tap', onClick: () => this.editSets(i, 1) }, Icon.plus(null, 13))))),
      h('div', { class: 'dashed-btn tap', style: { marginTop: '18px' }, onClick: () => this.openExSheet(null) }, '+ Add lift'),
      h('div', { class: 'helper-text' }, 'Tap a lift to edit its reps, weight step or superset pairing.'));
  }

  renderProgress() {
    const st = this.state;
    const unit = this.unit();
    const names = [];
    st.logs.forEach((l) => l.ex.forEach((e) => { if (names.indexOf(e.n) < 0 && e.sets.some((s) => s.w > 0)) names.push(e.n); }));
    const pick = names.indexOf(st.trendPick) >= 0 ? st.trendPick : (names[0] || '');

    const points = [];
    st.logs.forEach((l) => {
      const hit = l.ex.find((e) => e.n === pick);
      if (!hit) return;
      const top = hit.sets.reduce((a, b) => (b.w > a.w ? b : a), hit.sets[0]);
      points.push({ date: l.date, w: top.w, r: top.r, sets: hit.sets.length });
    });
    const series = points.slice(-8);
    let chartSvg = null, current = '—', delta = '', span = '', deltaColor = '#56633f';
    if (series.length > 1) {
      const W = 300, H = 118, padv = 8;
      const vals = series.map((p) => p.w);
      const min = Math.min.apply(null, vals) - 10, max = Math.max.apply(null, vals) + 10;
      const px = (i) => padv + i * ((W - padv * 2) / (series.length - 1));
      const py = (v) => H - padv - ((v - min) / (max - min || 1)) * (H - padv * 2);
      const pts = series.map((p, i) => px(i) + ',' + py(p.w)).join(' ');
      const area = 'M' + px(0) + ',' + H + ' L' + series.map((p, i) => px(i) + ',' + py(p.w)).join(' L') + ' L' + px(series.length - 1) + ',' + H + ' Z';
      chartSvg = h('svg', { width: '100%', viewBox: '0 0 ' + W + ' ' + H, style: { display: 'block', overflow: 'visible' } },
        h('path', { d: area, fill: 'rgba(198,113,57,.12)' }),
        h('polyline', { points: pts, fill: 'none', stroke: '#c67139', 'stroke-width': 2.75, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        series.map((p, i) => h('circle', {
          key: i, cx: px(i), cy: py(p.w), r: i === series.length - 1 ? 5 : 2.6,
          fill: i === series.length - 1 ? '#c67139' : '#f5ead8', stroke: '#c67139', 'stroke-width': 2
        })));
      const first = series[0].w, last = series[series.length - 1].w;
      current = last + ' ' + unit;
      delta = (last - first >= 0 ? '+' : '') + (last - first) + ' ' + unit;
      span = 'since ' + shortDate(series[0].date);
      deltaColor = delta.indexOf('-') === 0 ? 'rgba(32,30,29,.5)' : '#56633f';
    }
    const history = points.slice().reverse().slice(0, 6).map((p) => ({ date: shortDate(p.date), sets: pick + ' · ' + p.sets + ' sets', top: p.w + ' ' + unit }));

    return h('div', { class: 'scroll progress-pad' },
      h('h1', { class: 'display progress-title' }, 'Progress'),
      names.length
        ? h('div', { class: 'hscroll chip-row' },
            names.map((n) => h('div', {
              class: 'chip tap', key: n,
              style: { background: n === pick ? '#201e1d' : '#ebddc5', color: n === pick ? '#f5ead8' : 'rgba(32,30,29,.7)' },
              onClick: () => this.setState({ trendPick: n })
            }, n)))
        : null,
      names.length ? h('div', { class: 'chart-card' },
        h('div', { class: 'chart-head' },
          h('div', {},
            h('div', { class: 'chart-label' }, 'Top set weight'),
            h('div', { class: 'chart-value' }, current)),
          h('div', {},
            h('div', { class: 'chart-delta', style: { color: deltaColor } }, delta),
            h('div', { class: 'chart-span' }, span))),
        h('div', { style: { marginTop: '16px' } }, chartSvg)) : h('div', { class: 'empty-note' }, 'Log a session to start tracking progress.'),
      names.length ? h('div', { class: 'history-label' }, 'Session history') : null,
      history.map((hh, i) => h('div', { class: 'history-row', key: i },
        h('div', { class: 'history-date' }, hh.date),
        h('div', { class: 'history-sets' }, hh.sets),
        h('div', { class: 'history-top' }, hh.top))));
  }

  renderNav() {
    const st = this.state;
    const tabs = [{ name: 'Today', key: 'home' }, { name: 'Plan', key: 'plan' }, { name: 'Progress', key: 'progress' }];
    return h('div', { class: 'bottom-nav' },
      tabs.map((t) => h('div', { class: 'nav-tab tap', key: t.key, onClick: () => this.setState({ screen: t.key }) },
        h('div', { class: 'nav-dot', style: { background: st.screen === t.key ? '#c67139' : 'rgba(32,30,29,.2)' } }),
        h('span', { class: 'nav-label', style: { color: st.screen === t.key ? '#201e1d' : 'rgba(32,30,29,.45)' } }, t.name))));
  }

  renderSheet() {
    const s = this.state.sheet;
    const program = this.state.program;
    const set = (k) => (ev) => this.setSheetField(k, ev.target.value);
    let title = '', body = null, canDelete = false, saveLabel = 'Save', onSave = () => this.saveSheet();

    if (s.kind === 'day') {
      title = s.isNew ? 'New training day' : 'Edit day';
      saveLabel = s.isNew ? 'Create' : 'Save';
      canDelete = !s.isNew && program.length > 1;
      body = h('div', { class: 'field-group' },
        h('div', {}, h('div', { class: 'field-label' }, 'Name'),
          h('input', { class: 'text-field', value: s.name, placeholder: 'Day D', onChange: set('name') })),
        h('div', {}, h('div', { class: 'field-label' }, 'Focus'),
          h('input', { class: 'text-field', value: s.focus || '', placeholder: 'Squat · Push · Hinge', onChange: set('focus') })));
    } else if (s.kind === 'ex') {
      title = s.session ? 'Add a lift to today' : (s.idx == null ? 'New lift' : 'Edit lift');
      saveLabel = s.idx == null ? 'Add' : 'Save';
      canDelete = s.idx != null;
      body = h('div', { class: 'field-group' },
        h('div', {}, h('div', { class: 'field-label' }, 'Lift'),
          h('input', { class: 'text-field', value: s.name, placeholder: 'Back Squat', onChange: set('name') })),
        h('div', { class: 'hscroll chip-row', style: { margin: '0 -22px', padding: '0 22px' } },
          LIBRARY.map((n) => h('div', { class: 'chip tap', key: n, style: { background: '#ebddc5', color: 'rgba(32,30,29,.7)' }, onClick: () => this.setSheetField('name', n) }, n))),
        h('div', { class: 'field-row-3' },
          h('div', { class: 'field-col' }, h('div', { class: 'field-label' }, 'Sets'),
            h('input', { class: 'text-field', value: s.sets, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: '700' }, onChange: set('sets') })),
          h('div', { class: 'field-col' }, h('div', { class: 'field-label' }, 'Reps'),
            h('input', { class: 'text-field', value: s.reps, placeholder: '8–12', style: { textAlign: 'center', fontWeight: '700' }, onChange: set('reps') })),
          h('div', { class: 'field-col' }, h('div', { class: 'field-label' }, 'Step'),
            h('input', { class: 'text-field', value: s.step, inputMode: 'decimal', style: { textAlign: 'center', fontWeight: '700' }, onChange: set('step') }))),
        h('div', {}, h('div', { class: 'field-label' }, 'Superset group'),
          h('div', { class: 'ss-opts' },
            ['', 'A', 'B', 'C'].map((v) => h('div', {
              class: 'ss-opt tap', key: v || 'none',
              style: { background: (s.ss || '') === v ? '#7a8a5e' : '#ebddc5', color: (s.ss || '') === v ? '#f9f4ed' : 'rgba(32,30,29,.6)' },
              onClick: () => this.setSheetField('ss', v)
            }, v === '' ? 'None' : v)))));
    } else if (s.kind === 'settings') {
      title = 'Settings';
      saveLabel = 'Done';
      onSave = () => this.setState({ sheet: null });
      const settings = this.state.settings;
      body = h('div', { class: 'field-group' },
        h('div', {}, h('div', { class: 'field-label' }, 'Units'),
          h('div', { class: 'seg2' },
            ['lb', 'kg'].map((u) => h('div', {
              class: 'seg2-opt tap', key: u,
              style: { background: settings.units === u ? '#c67139' : 'transparent', color: settings.units === u ? '#fffaf1' : 'rgba(32,30,29,.6)' },
              onClick: () => this.save({ settings: Object.assign({}, settings, { units: u }) })
            }, u.toUpperCase())))),
        this.renderToggleRow('Carry over last session', 'Pre-fill weight & reps from your last time', settings.carryOver !== false, () => this.save({ settings: Object.assign({}, settings, { carryOver: !(settings.carryOver !== false) }) })),
        this.renderToggleRow('Rest timer', 'Start a countdown after logging a set', settings.restTimer !== false, () => this.save({ settings: Object.assign({}, settings, { restTimer: !(settings.restTimer !== false) }) })));
    }

    return h('div', { class: 'sheet-backdrop', onClick: () => this.setState({ sheet: null }) },
      h('div', { class: 'sheet', onClick: (ev) => ev.stopPropagation() },
        h('div', { class: 'sheet-grabber' }),
        h('div', { class: 'sheet-title' }, title),
        body,
        h('div', { class: 'sheet-footer' },
          canDelete && h('div', { class: 'sheet-delete tap', onClick: () => this.removeSheet() }, 'Delete'),
          h('div', { class: 'pill-btn-primary tap', style: { flex: 1 }, onClick: onSave }, saveLabel))));
  }

  renderToggleRow(label, sub, on, onClick) {
    return h('div', { class: 'toggle-row' },
      h('div', {},
        h('div', { class: 'toggle-text-label' }, label),
        h('div', { class: 'toggle-text-sub' }, sub)),
      h('div', { class: 'toggle tap', style: { background: on ? '#c67139' : '#dcd3c4' }, onClick },
        h('div', { class: 'toggle-knob', style: { left: on ? '23px' : '3px' } })));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App().mount(document.getElementById('app'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
