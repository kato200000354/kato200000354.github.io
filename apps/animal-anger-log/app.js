'use strict';

/* =========================================================
   アニマルアンガーログ
   怒りのレベルを動物で記録し、後日「本当の気持ち」を振り返るアプリ
   ========================================================= */

const STORE_KEY = 'animalAngerLog.v1';

const LEVELS = [
  null,
  { name: 'ちょいイラ', img: 'img/l1.jpg', desc: '少し不機嫌な様子。様子をうかがいながら威嚇しています。' },
  { name: 'イライラ', img: 'img/l2.jpg', desc: 'レッサーパンダが2匹。前足を上げて威嚇し、主張しはじめます。' },
  { name: 'かなりイライラ', img: 'img/l3.jpg', desc: 'レッサーパンダが3匹。鳴き声も大きくなり、存在感が増してきます。' },
  { name: 'めちゃくちゃイライラ', img: 'img/l4.jpg', desc: 'レッサーパンダが4匹。全力で威嚇！周囲にもアピールします。' },
  { name: 'コアリクイ参戦', img: 'img/l5.jpg', desc: 'レッサーパンダ4匹にコアリクイ1匹。怒りの仲間が増えはじめます。' },
  { name: '飼育員さん警戒', img: 'img/l6.jpg', desc: 'レッサーパンダ4匹にコアリクイ2匹。一気ににぎやかになり、周囲が警戒しはじめます。' },
  { name: 'ズボンに噛みつく勢い', img: 'img/l7.jpg', desc: 'レッサーパンダ4匹にコアリクイ3匹。威嚇が本格化し、触られると危険なレベルです。' },
  { name: '園内放送レベル', img: 'img/l8.jpg', desc: 'レッサーパンダ4匹にコアリクイ4匹。園内に緊張感が広がり、飼育員さんの応援が必要になります。' },
  { name: '応援要請', img: 'img/l9.jpg', desc: 'レッサーパンダ4匹にコアリクイ5匹。制御できないほどに増え、園内に応援要請が出されます。' },
  { name: 'クマの日です', img: 'img/l10.jpg', desc: '巨大なクマが登場。深呼吸して、落ち着いて記録しましょう。' },
];

const LV_COLOR = ['', '#3d8a47', '#4f8a3a', '#d49a1c', '#ec7627', '#e5502e', '#e2464a', '#e23c67', '#d9428c', '#a32f8c', '#cf2b20'];

/** レベルごとの動物の数 */
function crowdOf(lv) {
  if (lv >= 10) return { panda: 0, anteater: 0, bear: 1 };
  return { panda: Math.min(lv, 4), anteater: Math.max(0, lv - 4), bear: 0 };
}

const TAGS = ['仕事・就活', '人間関係', 'お金', '健康', '家事', '移動', 'その他'];

const FEELINGS = [
  { k: 'anxiety', n: '不安', q: '不安だった', c: '#2f9bd6' },
  { k: 'disappoint', n: 'がっかり', q: 'がっかりした', c: '#9b7fd4' },
  { k: 'tired', n: '疲労', q: '疲れていた', c: '#6fbf73' },
  { k: 'sad', n: '悲しみ', q: '悲しかった', c: '#e0679a' },
  { k: 'lonely', n: '寂しさ', q: '寂しかった', c: '#f2b84b' },
  { k: 'shame', n: '恥ずかしさ', q: '恥ずかしかった', c: '#f08a5d' },
  { k: 'anger', n: '怒り', q: 'やっぱり純粋に怒りだった', c: '#e6454f' },
  { k: 'other', n: 'その他', q: 'その他', c: '#a8a29e' },
];
const FEEL = Object.fromEntries(FEELINGS.map(f => [f.k, f]));

const ANIMALS = [
  { id: 'panda', name: '威嚇レッサーパンダ', img: 'img/z_panda.jpg', range: [1, 9], lvText: 'レベル1〜9で登場。', desc: '小さいけど気が強い。前足を上げて全力で「シャー！」と主張する。' },
  { id: 'anteater', name: 'コアリクイ', img: 'img/z_anteater.jpg', range: [5, 9], lvText: 'レベル5〜9で登場。', desc: '噛みつき上手。両手を広げる威嚇ポーズが得意。飼育員さんのズボンがお気に入り。' },
  { id: 'bear', name: 'ガチギレグマ', img: 'img/z_bear.jpg', range: [10, 10], lvText: 'レベル10で登場。', desc: '普段は穏やかだけど、怒ると止められない。でも本当は優しい…？' },
];

/* ---------- storage ---------- */
let records = [];
function load() {
  try { records = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { records = []; }
  if (!Array.isArray(records)) records = [];
}
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); } catch (e) { toast('保存できませんでした'); }
}
const byId = id => records.find(r => r.id === id);
const sorted = () => [...records].sort((a, b) => b.ts - a.ts);

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const WD = ['日', '月', '火', '水', '木', '金', '土'];
function fmtDate(ts) { const d = new Date(ts); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; }
function fmtTime(ts) { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtFull(ts) { return `${fmtDate(ts)} ${fmtTime(ts)}`; }
function dayKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function toLocalInput(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function pawColor(lv) { return LV_COLOR[lv] || '#e8504a'; }

function paw(color, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><g fill="${color}"><path d="M12 11.2c-3.4 0-6.3 3.3-6.3 6.1 0 2 1.6 2.9 3.2 2.9 1.2 0 2-.6 3.1-.6s1.9.6 3.1.6c1.6 0 3.2-.9 3.2-2.9 0-2.8-2.9-6.1-6.3-6.1z"/><ellipse cx="4.6" cy="10.4" rx="2.1" ry="2.7" transform="rotate(-20 4.6 10.4)"/><ellipse cx="9" cy="5.6" rx="2.2" ry="2.9" transform="rotate(-8 9 5.6)"/><ellipse cx="15" cy="5.6" rx="2.2" ry="2.9" transform="rotate(8 15 5.6)"/><ellipse cx="19.4" cy="10.4" rx="2.1" ry="2.7" transform="rotate(20 19.4 10.4)"/></g></svg>`;
}
function paws(lv, size = 18, total = 0) {
  let h = '';
  for (let i = 1; i <= Math.max(lv, total); i++) h += paw(i <= lv ? pawColor(lv) : '#e6dccb', size);
  return `<span class="paws">${h}</span>`;
}
function badge(lv) { return `<span class="lvbadge" style="background:${LV_COLOR[lv]}">${lv}</span>`; }
function thumbFor(lv) { return LEVELS[lv].img; }

/** 振り返りで選んだ気持ちを割合に（複数選択は均等配分） */
function feelShares(r) {
  const ks = (r.feelings || []).filter(k => FEEL[k]);
  if (!ks.length) return [];
  return ks.map(k => ({ ...FEEL[k], p: 1 / ks.length }));
}

/** confirm() の代わりのアプリ内ダイアログ */
function ask(msg, okLabel, onOk) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><p>${msg}</p><div class="modal-btns"><button class="btn ghost" data-m="no">やめる</button><button class="btn danger-fill" data-m="ok">${okLabel}</button></div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (e.target === m || b) { m.remove(); if (b?.dataset.m === 'ok') onOk(); }
  });
  $('#app').appendChild(m);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- router ---------- */
const TAB_ROUTES = ['home', 'records', 'zukan', 'stats', 'settings'];
let route = { name: 'home', p: {} };
let stack = [];
let timers = [];

function go(name, p = {}, { replace = false, reset = false } = {}) {
  if (reset) stack = [];
  else if (!replace) stack.push(route);
  route = { name, p };
  render();
  window.scrollTo(0, 0);
}
function back() {
  route = stack.pop() || { name: 'home', p: {} };
  render();
  window.scrollTo(0, 0);
}

function render() {
  timers.forEach(clearTimeout); timers = [];
  const v = $('#view');
  const fn = VIEWS[route.name] || VIEWS.home;
  v.className = '';
  v.innerHTML = fn(route.p);
  renderTabs();
  AFTER[route.name]?.(route.p);
}

const TAB_ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>',
  records: '<rect x="4" y="3" width="16" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  zukan: '<circle cx="6.5" cy="6.5" r="3" fill="currentColor"/><circle cx="17.5" cy="6.5" r="3" fill="currentColor"/><ellipse cx="12" cy="14" rx="8" ry="7" fill="currentColor"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
  settings: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const TAB_NAMES = { home: 'ホーム', records: '記録', zukan: '図鑑', stats: 'グラフ', settings: '設定' };

function renderTabs() {
  const t = $('#tabs');
  const showOn = [...TAB_ROUTES, 'detail'];
  t.className = showOn.includes(route.name) ? '' : 'hide';
  const active = TAB_ROUTES.includes(route.name) ? route.name : (route.name === 'detail' ? 'records' : '');
  t.innerHTML = TAB_ROUTES.map(n => `<button data-tab="${n}" class="${n === active ? 'on' : ''}"><svg viewBox="0 0 24 24">${TAB_ICONS[n]}</svg>${TAB_NAMES[n]}</button>`).join('');
}

function topbar(title = '', side = '') {
  return `<div class="topbar"><button class="back" data-act="back" aria-label="戻る">‹</button><div class="ttl">${title}</div><div class="side">${side}</div></div>`;
}

/* ---------- draft (記録作成中の一時データ) ---------- */
let draft = null;
function newDraft(level = 1) { draft = { id: null, ts: Date.now(), level, text: '', tags: [] }; }

/* =========================================================
   VIEWS
   ========================================================= */
const VIEWS = {};
const AFTER = {};

/* ---------- ホーム ---------- */
VIEWS.home = () => {
  const today = dayKey(Date.now());
  const todays = records.filter(r => dayKey(r.ts) === today);
  const pending = sorted().filter(r => !r.reviewed && Date.now() - r.ts > 60 * 60 * 1000).slice(0, 3);
  const weekAgo = Date.now() - 7 * 864e5;
  const week = records.filter(r => r.ts >= weekAgo);
  const avg = week.length ? (week.reduce((s, r) => s + r.level, 0) / week.length).toFixed(1) : '-';
  const recent = sorted().slice(0, 3);

  return `
  <section class="home-hero">
    <h1 class="logo">アニマル${paw('#6a3d1c', 30)}<br>アンガーログ</h1>
    <p class="tagline">怒りを、かわいく、見える化。</p>
    <img src="img/home.jpg" alt="怒った動物たち">
  </section>
  <button class="wood-btn" data-act="start">今日の怒りを記録する</button>

  <div class="stat-row">
    <div class="stat"><b>${todays.length}</b><span>今日の記録</span></div>
    <div class="stat"><b>${week.length}</b><span>この7日間</span></div>
    <div class="stat"><b>${avg}</b><span>7日間の平均Lv</span></div>
  </div>

  ${pending.length ? `
  <div class="sec-title">${paw('#e0679a', 18)} 振り返ってみませんか？</div>
  <div class="card" style="padding:4px 12px">
    ${pending.map(r => `
      <button class="rec" data-act="review" data-id="${r.id}">
        <img class="thumb" src="${thumbFor(r.level)}" alt="">
        <div class="body"><div style="font-size:13px;font-weight:700">${fmtDate(r.ts)} ${fmtTime(r.ts)}</div><div class="txt">${esc(r.text) || '（メモなし）'}</div></div>
        ${badge(r.level)}
      </button>`).join('')}
  </div>
  <p class="muted center" style="margin-top:-6px">あの日の動物たちは、本当は何を伝えたかった？</p>` : ''}

  <div class="sec-title">${paw('#f5a623', 18)} 最近の記録</div>
  ${recent.length ? `<div class="card" style="padding:4px 12px">${recent.map(recRow).join('')}</div>`
    : `<div class="card empty">まだ記録がありません。<br>イラッとしたら、動物たちに代わりに怒ってもらいましょう。
       <button class="btn ghost" data-act="sample" style="margin-top:14px;font-size:14px;padding:11px">サンプルデータで試してみる</button>
       <div class="muted" style="margin-top:6px;font-size:12px">あとで設定から削除できます</div></div>`}
  `;
};

function recRow(r) {
  return `<button class="rec" data-act="detail" data-id="${r.id}">
    <div class="time">${fmtTime(r.ts)}</div>
    <div class="body">${paws(r.level, 16)}${r.reviewed ? '' : '<span class="pending-dot">未振り返り</span>'}<div class="txt">${esc(r.text) || '（メモなし）'}</div></div>
    <div class="num" style="color:${LV_COLOR[r.level]}">${r.level}</div>
  </button>`;
}

/* ---------- レベル選択 ---------- */
VIEWS.select = () => `
  <div class="sel-head">
    <button class="back" data-act="back" aria-label="戻る">‹</button>
    <div class="sign">${paw('#2e7d4f', 28)}<div><b>今の怒りはどのくらい？</b><span>ボタンをタップして、動物を増やそう！</span></div></div>
  </div>
  <div class="lvgrid">
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => lvCard(n, n === draft.level)).join('')}
  </div>
  <div class="sel-foot">
    <button class="btn" data-act="toInput" id="sel-go" style="background:${LV_COLOR[draft.level]}">レベル${draft.level}で記録する</button>
    <button class="cancel" data-act="back">キャンセル</button>
  </div>
`;

function lvCard(n, on) {
  const L = LEVELS[n];
  return `<button class="lvcard ${on ? 'on' : ''}" data-act="lv" data-lv="${n}" style="--c:${LV_COLOR[n]}" aria-pressed="${on}">
    <div class="lvtop"><span class="lvnum">${n}</span><span class="lvpaws">${n === 10 ? paw(LV_COLOR[10], 18) : paws(n, n <= 5 ? 16 : 12)}</span></div>
    <div class="lvimg"><img src="${L.img}" alt="レベル${n}の動物たち" loading="lazy"><span class="lvtag">レベル${n}</span></div>
    <b class="lvname">${L.name}</b>
    <span class="lvdesc">${L.desc}</span>
  </button>`;
}

/* ---------- 記録アニメーション（レベル5〜9） ---------- */
const FRAMES = [
  { img: 'img/f1.jpg', cap: '動物たちが登場！', ms: 1400 },
  { img: 'img/f2.jpg', cap: '飼育員さんに気づいて、一斉に追いかけます！', ms: 1500 },
  { img: 'img/f3.jpg', cap: '飼育員さんは全力で逃げます！', ms: 1400 },
  { img: 'img/f4.jpg', cap: '動物たちがさらに距離を詰めてきます！', ms: 1500 },
  { img: 'img/f5.jpg', cap: '最後はみんなに囲まれて…', ms: 2400 },
];
VIEWS.anim = ({ id }) => `
  <div class="scene chase" data-act="skipAnim" data-id="${id}">
    <div class="chase-lv">レベル ${badge(byId(id)?.level || 5)} <span>${LEVELS[byId(id)?.level || 5].name}</span></div>
    <div class="frame-wrap">${FRAMES.map((f, i) => `<img class="frame" id="fr${i}" src="${f.img}" alt="">`).join('')}</div>
    <div class="note" id="fr-cap">${FRAMES[0].cap}</div>
    <div class="dots">${FRAMES.map((_, i) => `<i id="dot${i}"></i>`).join('')}</div>
    <p class="muted center" style="margin:6px 0 0">タップでスキップ</p>
  </div>`;
AFTER.anim = ({ id }) => {
  $('#view').className = 'full';
  let i = 0;
  const show = () => {
    FRAMES.forEach((_, k) => {
      const img = $('#fr' + k);
      if (img) img.className = 'frame' + (k === i ? ' on ' + (k === FRAMES.length - 1 ? 'shake2' : 'zoom') : '');
      $('#dot' + k)?.classList.toggle('on', k <= i);
    });
    const cap = $('#fr-cap'); if (cap) cap.textContent = FRAMES[i].cap;
    timers.push(setTimeout(() => { i++; if (i < FRAMES.length) show(); else go('done', { id }, { replace: true }); }, FRAMES[i].ms));
  };
  show();
};

/* ---------- レベル10（クマ登場） ---------- */
VIEWS.bear = ({ id }) => `
  <div class="scene bear-scene">
    <div class="sceneimg"><img class="shake3" src="img/bear.jpg" alt="巨大なクマ「グオオオオオ！」"></div>
    <div class="note"><b>クマの日です…！！</b><br>巨大なクマが登場しました。<br>いったん深呼吸して、落ち着きましょう。</div>
    <div class="breath"><div class="ball"></div><span id="breath-txt">すって…</span></div>
    <button class="btn" data-act="doneFrom" data-id="${id}">落ち着いた</button>
  </div>`;
AFTER.bear = () => {
  $('#view').className = 'full';
  const words = ['すって…', 'はいて…'];
  let i = 0;
  const tick = () => { const t = $('#breath-txt'); if (!t) return; t.textContent = words[i++ % 2]; timers.push(setTimeout(tick, 4000)); };
  tick();
  if (navigator.vibrate) try { navigator.vibrate([120, 60, 200]); } catch (e) {}
};

/* ---------- 記録完了 ---------- */
VIEWS.done = ({ id }) => {
  const r = byId(id);
  if (!r) return `${topbar()}<div class="empty">記録が見つかりません</div>`;
  const c = crowdOf(r.level);
  const parts = [];
  if (c.panda) parts.push(`レッサーパンダ${c.panda}匹`);
  if (c.anteater) parts.push(`コアリクイ${c.anteater}匹`);
  const who = c.bear ? '巨大なクマ' : parts.join('と');
  const mood = r.level >= 10 ? '限界までがまんしていたのかも。' : r.level >= 5 ? 'かなりのイライラだったようです。' : r.level >= 3 ? 'けっこうイライラしていたようです。' : '小さなイライラも、ちゃんと記録できました。';
  return `
  <div class="scene done-scene">
    <h2>今日の怒りを記録しました！</h2>
    <div class="done-card" style="--c:${LV_COLOR[r.level]}">
      <div class="done-lv">レベル ${badge(r.level)}</div>
      ${[c.panda && 'img/face_panda.jpg', c.anteater && 'img/face_anteater.jpg', c.bear && 'img/z_bear.jpg'].map((src, row) => {
        if (!src) return '';
        const n = [c.panda, c.anteater, c.bear][row];
        return `<div class="faces">${Array.from({ length: n }, (_, i) => `<img src="${src}" alt="" style="animation-delay:${150 + (row * 4 + i) * 90}ms">`).join('')}</div>`;
      }).join('')}
      <div class="done-name">${LEVELS[r.level].name}</div>
      <p>${who}が${r.level >= 5 ? '大暴れ！' : '威嚇中！'}<br>${mood}<br>おつかれさまでした！</p>
    </div>
    <button class="btn done-ok" data-act="finish" data-id="${r.id}">OK</button>
  </div>`;
};
AFTER.done = () => { $('#view').className = 'full'; };

/* ---------- 記録入力 ---------- */
VIEWS.input = () => {
  const d = draft;
  return `
  ${topbar(d.id ? '記録を編集' : '')}
  ${d.id ? '' : '<h1 class="big" style="text-align:left">今回の記録</h1>'}
  <input class="field" type="datetime-local" id="f-ts" value="${toLocalInput(d.ts)}" style="margin-top:8px">

  <div class="card" style="margin-top:14px">
    <div style="font-weight:700;font-size:14px">怒りレベル</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span id="lv-paws">${paws(d.level, 26)}</span><b id="lv-num" style="font-size:28px;color:${LV_COLOR[d.level]}">${d.level}</b>
    </div>
    <input type="range" id="f-lv" min="1" max="10" value="${d.level}" style="width:100%;accent-color:${LV_COLOR[d.level]}">
  </div>

  <div class="label">どんなことがありましたか？</div>
  <textarea class="field" id="f-text" placeholder="例）電車が遅延してイライラ">${esc(d.text)}</textarea>

  <div class="label">タグ（任意）</div>
  <div class="chips">${TAGS.map(t => `<button class="chip ${d.tags.includes(t) ? 'on' : ''}" data-act="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>

  <div style="margin-top:24px"><button class="btn" data-act="save">保存する</button></div>
  `;
};
AFTER.input = () => {
  $('#f-text').addEventListener('input', e => { draft.text = e.target.value; });
  $('#f-ts').addEventListener('change', e => { const t = new Date(e.target.value).getTime(); if (!isNaN(t)) draft.ts = t; });
  $('#f-lv').addEventListener('input', e => {
    const lv = draft.level = +e.target.value;
    $('#lv-paws').innerHTML = paws(lv, 26);
    $('#lv-num').textContent = lv; $('#lv-num').style.color = LV_COLOR[lv];
    e.target.style.accentColor = LV_COLOR[lv];
  });
};

/* ---------- 記録詳細 ---------- */
VIEWS.detail = ({ id }) => {
  const r = byId(id);
  if (!r) return `${topbar()}<div class="empty">記録が見つかりません</div>`;
  const sh = feelShares(r).sort((a, b) => b.p - a.p);
  return `
  ${topbar(`<span style="font-size:14px;font-weight:700">${fmtFull(r.ts)}</span>`, `<button data-act="edit" data-id="${r.id}" style="color:var(--teal);font-weight:700">編集</button>`)}
  <div class="card">
    <div style="display:flex;align-items:center;gap:8px;font-weight:800">怒りレベル ${badge(r.level)}</div>
    <div style="margin:6px 0 10px">${paws(r.level, 20, 10)}</div>
    <img src="${LEVELS[r.level].img}" alt="" style="width:100%;height:190px;object-fit:cover;border-radius:14px">
    <p style="margin:10px 0 0;white-space:pre-wrap">${esc(r.text) || '<span class="muted">（メモなし）</span>'}</p>
  </div>
  ${r.tags?.length ? `<div class="chips" style="margin-bottom:14px">${r.tags.map(t => `<span class="chip sm tag">${esc(t)}</span>`).join('')}</div>` : ''}

  ${r.reviewed ? `
    <div class="sec-title">本当はこんな気持ちがあった</div>
    <div class="card">
      ${sh.length ? sh.map(f => `<div class="fbar"><span class="n">${f.n}</span><div class="track"><div class="fill" style="width:${Math.round(f.p * 100)}%;background:${f.c}"></div></div><span class="p">${Math.round(f.p * 100)}%</span></div>`).join('') : '<div class="muted">気持ちは選ばれていません</div>'}
    </div>
    ${r.note ? `<div class="sec-title">メモ</div><div class="card" style="white-space:pre-wrap">${esc(r.note)}</div>` : ''}
    <button class="btn ghost" data-act="review" data-id="${r.id}">振り返りを書き直す</button>
  ` : `
    <div class="card center">
      <p style="margin:0 0 10px">時間がたったら、<br>あの日の動物たちの<b>本当の気持ち</b>を振り返ってみましょう。</p>
      <button class="btn teal" data-act="review" data-id="${r.id}">振り返る</button>
    </div>`}
  <div style="margin-top:22px"><button class="btn danger" data-act="del" data-id="${r.id}">この記録を削除</button></div>
  `;
};

/* ---------- 後日の振り返り ---------- */
let reviewDraft = null;
VIEWS.review = ({ id }) => {
  const r = byId(id);
  if (!r) return `${topbar()}<div class="empty">記録が見つかりません</div>`;
  if (!reviewDraft || reviewDraft.id !== id) reviewDraft = { id, feelings: [...(r.feelings || [])], note: r.note || '' };
  return `
  ${topbar()}
  <h1 class="big">あの日の動物たち、<br>本当は何を伝えたかった？</h1>
  <p class="lead">${fmtFull(r.ts)}</p>
  <div class="card">
    <div style="display:flex;align-items:center;gap:6px;font-weight:800;margin-bottom:8px">レベル${r.level}の記録 ${paws(r.level, 16)}</div>
    <img src="${LEVELS[r.level].img}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:12px">
    <div class="field" style="margin-top:10px;background:#fbf6ec">${esc(r.text) || '（メモなし）'}</div>
  </div>
  <div class="label">実はこんな気持ちがあったかも<br><span class="muted">（複数選択できます）</span></div>
  <div class="checks card">
    ${FEELINGS.map(f => `<label><input type="checkbox" data-feel="${f.k}" ${reviewDraft.feelings.includes(f.k) ? 'checked' : ''}>${f.q}</label>`).join('')}
  </div>
  <div class="label">詳しく書く（任意）</div>
  <textarea class="field" id="f-note" placeholder="例）期待していただけに落ち込んだ。">${esc(reviewDraft.note)}</textarea>
  <div style="margin-top:22px"><button class="btn teal" data-act="saveReview">保存する</button></div>
  `;
};
AFTER.review = () => {
  document.querySelectorAll('[data-feel]').forEach(cb => cb.addEventListener('change', () => {
    const k = cb.dataset.feel;
    reviewDraft.feelings = cb.checked ? [...new Set([...reviewDraft.feelings, k])] : reviewDraft.feelings.filter(x => x !== k);
  }));
  $('#f-note')?.addEventListener('input', e => { reviewDraft.note = e.target.value; });
};

/* ---------- 記録（カレンダー） ---------- */
let calMonth = null; // {y, m}
let calSel = null;
VIEWS.records = () => {
  const now = new Date();
  if (!calMonth) calMonth = { y: now.getFullYear(), m: now.getMonth() };
  if (!calSel) calSel = dayKey(now);
  const { y, m } = calMonth;
  const first = new Date(y, m, 1);
  const startOffset = (first.getDay() + 6) % 7; // 月曜始まり
  const days = new Date(y, m + 1, 0).getDate();
  const byDay = {};
  records.forEach(r => { (byDay[dayKey(r.ts)] ||= []).push(r); });

  let cells = '';
  for (let i = 0; i < startOffset; i++) cells += '<div class="day out"></div>';
  for (let d = 1; d <= days; d++) {
    const k = `${y}-${pad(m + 1)}-${pad(d)}`;
    const list = byDay[k] || [];
    const max = list.reduce((a, r) => Math.max(a, r.level), 0);
    const icon = !max ? '' : max >= 10 ? '<img src="img/z_bear.jpg" alt="クマ">' : paw(pawColor(max), 24);
    cells += `<button class="day ${k === dayKey(Date.now()) ? 'today' : ''} ${k === calSel ? 'sel' : ''}" data-act="pickDay" data-day="${k}">
      <span class="d">${d}</span>${icon}${list.length > 1 ? `<small>×${list.length}</small>` : ''}</button>`;
  }
  const rest = (7 - (startOffset + days) % 7) % 7;
  for (let i = 0; i < rest; i++) cells += '<div class="day out"></div>';

  const sel = (byDay[calSel] || []).sort((a, b) => b.ts - a.ts);
  const [sy, sm, sd] = calSel.split('-').map(Number);
  const selDate = new Date(sy, sm - 1, sd);

  return `
  <div class="cal-head">
    <button data-act="mon" data-d="-1" aria-label="前の月">‹</button>
    <b>${y}年${m + 1}月</b>
    <button data-act="mon" data-d="1" aria-label="次の月">›</button>
  </div>
  <div class="cal">
    ${['月', '火', '水', '木', '金', '土', '日'].map((w, i) => `<div class="dow ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</div>`).join('')}
    ${cells}
  </div>
  <div class="sec-title">${selDate.getMonth() + 1}月${selDate.getDate()}日（${WD[selDate.getDay()]}）</div>
  ${sel.length ? `<div class="card" style="padding:4px 12px">${sel.map(recRow).join('')}</div>` : '<div class="card empty">この日の記録はありません</div>'}
  <button class="btn" data-act="start" style="margin-top:8px">記録を追加する</button>
  `;
};

/* ---------- 統計 ---------- */
let statTab = 'feel';
let statMonth = null;
VIEWS.stats = () => {
  const now = new Date();
  if (!statMonth) statMonth = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = statMonth;
  const list = records.filter(r => { const d = new Date(r.ts); return d.getFullYear() === y && d.getMonth() === m; });

  // 本当の気持ち
  const feelSum = {};
  list.forEach(r => feelShares(r).forEach(f => { feelSum[f.k] = (feelSum[f.k] || 0) + f.p; }));
  const feelTotal = Object.values(feelSum).reduce((a, b) => a + b, 0);
  const feelArr = FEELINGS.filter(f => feelSum[f.k]).map(f => ({ ...f, p: feelSum[f.k] / feelTotal })).sort((a, b) => b.p - a.p);

  // レベル分布
  const lvCount = Array(11).fill(0); list.forEach(r => lvCount[r.level]++);
  const lvMax = Math.max(1, ...lvCount);

  // 時間帯
  const slots = [{ n: '朝', c: '#f2b84b', v: 0 }, { n: '昼', c: '#f5a623', v: 0 }, { n: '夕方', c: '#6fbf73', v: 0 }, { n: '夜', c: '#4a90d9', v: 0 }];
  list.forEach(r => { const h = new Date(r.ts).getHours(); slots[h >= 5 && h < 11 ? 0 : h >= 11 && h < 17 ? 1 : h >= 17 && h < 21 ? 2 : 3].v++; });
  const slotMax = Math.max(1, ...slots.map(s => s.v));

  const main = statTab === 'feel'
    ? (feelArr.length ? `
      <div class="card"><div class="donut-wrap">${donut(feelArr)}
        <div class="legend">${feelArr.map(f => `<div><i style="background:${f.c}"></i><span>${f.n}</span><b>${Math.round(f.p * 100)}%</b></div>`).join('')}</div>
      </div><p class="muted center" style="margin:8px 0 0">後日の振り返りから集計しています</p></div>`
      : `<div class="card empty">この月はまだ振り返りがありません。<br>記録を「振り返る」と、本当の気持ちがここに表示されます。</div>`)
    : (list.length ? `
      <div class="card"><div class="bars">${lvCount.slice(1).map((v, i) => `<div class="col"><span class="v">${v || ''}</span><div class="b" style="height:${v / lvMax * 100}%;background:${LV_COLOR[i + 1]}"></div><span class="x">${i + 1}</span></div>`).join('')}</div>
      <p class="muted center" style="margin:8px 0 0">平均レベル <b>${(list.reduce((s, r) => s + r.level, 0) / list.length).toFixed(1)}</b>（${list.length}件）</p></div>`
      : '<div class="card empty">この月の記録はありません</div>');

  return `
  <div class="cal-head">
    <button data-act="smon" data-d="-1" aria-label="前の月">‹</button>
    <b>${m + 1}月のアニマルアンガー</b>
    <button data-act="smon" data-d="1" aria-label="次の月">›</button>
  </div>
  <div class="seg">
    <button class="${statTab === 'level' ? 'on' : ''}" data-act="stab" data-t="level">レベルの分布</button>
    <button class="${statTab === 'feel' ? 'on' : ''}" data-act="stab" data-t="feel">本当の気持ち</button>
  </div>
  ${main}
  <div class="sec-title">よくあった時間帯</div>
  <div class="card">${list.length ? `<div class="bars">${slots.map(s => `<div class="col"><span class="v">${s.v}</span><div class="b" style="height:${s.v / slotMax * 100}%;background:${s.c}"></div><span class="x">${s.n}</span></div>`).join('')}</div>` : '<div class="empty">データがありません</div>'}</div>
  <div class="sec-title">今月のふりかえり</div>
  <div class="card">${summary(list, feelArr, slots)}</div>
  `;
};

function donut(arr) {
  const r = 40, C = 2 * Math.PI * r;
  let off = 0;
  const segs = arr.map(f => {
    const len = f.p * C;
    const s = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${f.c}" stroke-width="20" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;
    off += len; return s;
  }).join('');
  return `<svg viewBox="0 0 120 120">${segs}<text x="60" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="#3b2a1e">今月の</text><text x="60" y="68" text-anchor="middle" font-size="9" font-weight="700" fill="#3b2a1e">本当の気持ち</text></svg>`;
}

function summary(list, feelArr, slots) {
  if (!list.length) return '<span class="muted">記録がたまると、ここにまとめが表示されます。</span>';
  const tagCount = {};
  list.forEach(r => (r.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  const topSlot = [...slots].sort((a, b) => b.v - a.v)[0];
  const bears = list.filter(r => r.level >= 10).length;
  const parts = [];
  parts.push(`今月は<b>${list.length}回</b>、動物たちが出動しました。`);
  if (topTag) parts.push(`いちばん多かったのは<b>「${esc(topTag[0])}」</b>関連の出来事です。`);
  if (feelArr.length >= 2) parts.push(`怒りの奥には<b>${feelArr[0].n}</b>や<b>${feelArr[1].n}</b>の気持ちが多くかくれていたようです。`);
  else if (feelArr.length === 1) parts.push(`怒りの奥には<b>${feelArr[0].n}</b>の気持ちがかくれていたようです。`);
  parts.push(`<b>${topSlot.n}</b>に怒りが出やすい傾向がありました。`);
  if (bears) parts.push(`クマが${bears}回登場。よくがんばりました。`);
  const unrev = list.filter(r => !r.reviewed).length;
  if (unrev) parts.push(`<span class="muted">まだ振り返っていない記録が${unrev}件あります。</span>`);
  return `<p style="margin:0">${parts.join('')}</p>`;
}

/* ---------- 図鑑 ---------- */
VIEWS.zukan = () => `
  <h1 class="big" style="margin-top:18px">アニマル図鑑</h1>
  <p class="lead">怒りを伝えてくれる仲間たち</p>
  ${ANIMALS.map(a => {
    const n = records.filter(r => r.level >= a.range[0] && r.level <= a.range[1]).length;
    const locked = n === 0;
    return `<div class="card zk ${locked ? 'locked' : ''}">
      <img src="${a.img}" alt="${locked ? '？？？' : a.name}">
      <div><h3>${locked ? '？？？' : a.name}</h3>
      <p>${a.lvText}${locked ? '<br>まだ出会っていません。' : '<br>' + a.desc}</p>
      ${locked ? '' : `<div class="cnt">出会った回数：${n}回</div>`}</div>
    </div>`;
  }).join('')}
  <div class="card zk">
    <img src="img/f2.jpg" alt="" style="object-position:75% 20%">
    <div><h3>飼育員さん</h3><p>いつも動物たちにもみくちゃにされている。レベル5以上で苦労が増える。それでも動物たちが大好き。</p></div>
  </div>
`;

/* ---------- 設定 ---------- */
VIEWS.settings = () => `
  <h1 class="big" style="margin-top:18px">設定</h1>
  <p class="lead">データはこの端末のブラウザにだけ保存されます</p>
  <div class="card">
    <div style="font-weight:800;margin-bottom:8px">データ</div>
    <p class="muted" style="margin:0 0 12px">記録件数：${records.length}件</p>
    <button class="btn ghost" data-act="export">バックアップをコピー</button>
    <button class="btn ghost" data-act="importText">貼り付けて復元</button>
    <button class="btn ghost" data-act="import">ファイルから復元</button>
    <input type="file" id="f-import" accept="application/json,.json,.txt" hidden>
    <textarea class="field" id="f-backup" hidden style="margin-top:12px;min-height:80px;font-size:12px" placeholder="ここにバックアップを貼り付け"></textarea>
  </div>
  <div class="card">
    <div style="font-weight:800;margin-bottom:8px">おためし</div>
    <p class="muted" style="margin:0 0 12px">カレンダーやグラフの見え方を試せるサンプル記録を追加します。</p>
    <button class="btn ghost" data-act="sample">サンプルデータを追加</button>
  </div>
  <button class="btn danger" data-act="wipe">すべての記録を削除</button>
  <p class="muted center" style="margin-top:20px">アニマルアンガーログ v1.0<br>怒りを、かわいく、見える化。</p>
`;
AFTER.settings = () => {
  $('#f-import').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    importData(await file.text());
  });
};

function importData(text) {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.records;
    if (!Array.isArray(arr)) throw new Error();
    const ids = new Set(records.map(r => r.id));
    const valid = arr.filter(r => r && r.id && typeof r.ts === 'number' && r.level >= 1 && r.level <= 10 && !ids.has(r.id));
    records.push(...valid); persist(); render();
    toast(`${valid.length}件を復元しました`);
  } catch (err) { toast('読み込めませんでした。バックアップの文字をまるごと貼り付けてください'); }
}

/* =========================================================
   ACTIONS
   ========================================================= */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const ACTIONS = {
  back,
  start() { newDraft(1); go('select'); },
  lv(el) {
    draft.level = +el.dataset.lv;
    document.querySelectorAll('.lvcard').forEach(b => {
      const on = +b.dataset.lv === draft.level;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
    const g = $('#sel-go');
    g.textContent = `レベル${draft.level}で記録する`; g.style.background = LV_COLOR[draft.level];
    if (draft.level === 10 && navigator.vibrate) try { navigator.vibrate(80); } catch (e) {}
  },
  toInput() { draft.ts = Date.now(); go('input'); },
  skipAnim(el) { go('done', { id: el.dataset.id }, { replace: true }); },
  doneFrom(el) { go('done', { id: el.dataset.id }, { replace: true }); },
  finish(el) { go('detail', { id: el.dataset.id }, { reset: true }); toast('後日、本当の気持ちを振り返ってみましょう'); },
  tag(el) {
    const t = el.dataset.tag;
    draft.tags = draft.tags.includes(t) ? draft.tags.filter(x => x !== t) : [...draft.tags, t];
    el.classList.toggle('on');
  },
  save() {
    const d = draft;
    if (d.id) {
      const r = byId(d.id);
      Object.assign(r, { ts: d.ts, level: d.level, text: d.text.trim(), tags: d.tags });
      persist(); toast('更新しました'); back();
    } else {
      const r = { id: uid(), ts: d.ts, level: d.level, text: d.text.trim(), tags: d.tags, reviewed: false, feelings: [], note: '' };
      records.push(r); persist();
      go(r.level >= 10 ? 'bear' : r.level >= 5 ? 'anim' : 'done', { id: r.id }, { reset: true });
    }
    draft = null;
  },
  detail(el) { go('detail', { id: el.dataset.id }); },
  edit(el) {
    const r = byId(el.dataset.id);
    draft = { id: r.id, ts: r.ts, level: r.level, text: r.text || '', tags: [...(r.tags || [])] };
    go('input');
  },
  review(el) { reviewDraft = null; go('review', { id: el.dataset.id }); },
  saveReview() {
    const r = byId(reviewDraft.id);
    r.feelings = reviewDraft.feelings; r.note = reviewDraft.note.trim(); r.reviewed = true; r.reviewedAt = Date.now();
    persist();
    const id = r.id; reviewDraft = null;
    go('detail', { id }, { replace: true });
    toast('振り返りを保存しました');
  },
  del(el) {
    ask('この記録を削除しますか？', '削除する', () => {
      records = records.filter(r => r.id !== el.dataset.id); persist();
      toast('削除しました'); back();
    });
  },
  pickDay(el) { calSel = el.dataset.day; render(); },
  mon(el) {
    let { y, m } = calMonth; m += +el.dataset.d;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    calMonth = { y, m }; calSel = `${y}-${pad(m + 1)}-01`; render();
  },
  smon(el) {
    let { y, m } = statMonth; m += +el.dataset.d;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    statMonth = { y, m }; render();
  },
  stab(el) { statTab = el.dataset.t; render(); },
  export() {
    const box = $('#f-backup');
    box.value = JSON.stringify({ app: 'animal-anger-log', version: 1, exportedAt: new Date().toISOString(), records });
    box.hidden = false; box.select();
    const done = () => toast('バックアップをコピーしました。メモ帳などに貼って保存してください');
    try {
      navigator.clipboard.writeText(box.value).then(done, () => toast('下の文字をすべて選んでコピーしてください'));
    } catch (e) { toast('下の文字をすべて選んでコピーしてください'); }
  },
  import() { $('#f-import').click(); },
  importText() {
    const box = $('#f-backup');
    if (box.hidden || !box.value.trim()) { box.hidden = false; box.value = ''; box.focus(); toast('バックアップの文字を貼り付けて、もう一度押してください'); return; }
    importData(box.value);
  },
  sample() {
    const samples = [
      [0, 17, 38, 5, '応募先から不採用の連絡が来た…', ['仕事・就活'], ['anxiety', 'disappoint', 'sad', 'tired'], '期待していただけに落ち込んだ。また書類を作り直すのがつらい…でも次に切り替えよう。'],
      [0, 13, 20, 3, '電車が遅延してイライラ', ['移動'], null, ''],
      [0, 9, 15, 1, '靴下が片方ない…', ['家事'], null, ''],
      [-1, 12, 5, 10, '面接で理不尽なことを言われた', ['仕事・就活'], ['anxiety', 'shame', 'anger'], 'くやしかった。自分を否定された気がした。'],
      [-3, 18, 40, 4, '家族と言い合いになった', ['人間関係'], ['lonely', 'sad'], 'わかってほしかっただけ。'],
      [-5, 14, 0, 2, 'レジで割り込まれた', ['その他'], ['anger'], ''],
      [-6, 16, 30, 6, '書類の締切を勘違いしていた', ['仕事・就活'], ['anxiety', 'tired'], ''],
      [-8, 20, 10, 3, '体調がすぐれない', ['健康'], ['tired'], ''],
      [-10, 12, 45, 7, '予定していた出費が倍になった', ['お金'], ['anxiety', 'disappoint'], ''],
      [-13, 7, 50, 2, '寝坊した', ['その他'], ['tired'], ''],
    ];
    const base = new Date();
    samples.forEach(([dd, h, mi, lv, text, tags, feel, note]) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dd, h, mi);
      records.push({ id: uid(), ts: d.getTime(), level: lv, text, tags, reviewed: !!feel, feelings: feel || [], note });
    });
    persist(); render(); toast('サンプルを追加しました');
  },
  wipe() {
    ask('すべての記録を削除します。<br>元に戻せません。よろしいですか？', 'すべて削除', () => {
      records = []; persist(); render(); toast('すべて削除しました');
    });
  },
};

document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { go(tab.dataset.tab, {}, { reset: true }); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});

load();
render();
