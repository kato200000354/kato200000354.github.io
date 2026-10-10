// 作品ページで遊ばれている時間を数える。30秒たまるごとに1回記録する。
// 数えるのは「画面が表示されていて、最後の操作から20秒以内」の時間だけ（放置は数えない）。
// 自動公開スクリプトが apps/<作品ID>/index.html に読み込みを追加する
(() => {
  const m = location.pathname.match(/\/apps\/([^/]+)\//);
  if (!m || location.protocol === 'file:') return;
  // Playストア版のアプリ（?src=android で開く）では数えない（アプリは外部にデータを送らない約束のため）
  try {
    if (new URLSearchParams(location.search).get('src') === 'android') sessionStorage.setItem('in-android-app', '1');
    if (sessionStorage.getItem('in-android-app')) return;
  } catch {}
  const URL = 'https://abacus.jasoncameron.dev/hit/kato200000354-works/' + encodeURIComponent(m[1]) + '-t30';
  const UNIT = 30;      // 何秒たまったら記録するか
  const IDLE = 20;      // 最後の操作から何秒で「放置」とみなすか
  const TILT = 8;       // スマホをこの角度（度）以上動かしたら操作とみなす
  const SHAKE = 3;      // 加速度がこれ（m/s²）以上変わったら操作とみなす

  // この端末だけの遊んだ記録（トップページの「あなたへのおすすめ」に使う。外には送らない）
  const ID = m[1];
  const remember = (secs) => {
    try {
      const h = JSON.parse(localStorage.getItem('my-history')) || {};
      const r = h[ID] ||= { opens: 0, secs: 0 };
      if (secs) r.secs += secs; else r.opens++;
      r.last = Date.now();
      localStorage.setItem('my-history', JSON.stringify(h));
    } catch {}
  };
  remember(0);

  let last = Date.now();
  let held = 0;         // 押しっぱなしのボタン・指・キーの数
  const touch = () => { last = Date.now(); };
  const opt = { capture: true, passive: true };

  ['pointermove', 'wheel', 'scroll', 'input', 'touchmove'].forEach(t => addEventListener(t, touch, opt));
  addEventListener('pointerdown', () => { held++; touch(); }, opt);
  addEventListener('keydown', e => { if (!e.repeat) held++; touch(); }, opt);
  ['pointerup', 'pointercancel', 'keyup'].forEach(t => addEventListener(t, () => { held = Math.max(0, held - 1); touch(); }, opt));
  addEventListener('blur', () => { held = 0; });

  // スマホを傾けたり振ったりするゲーム用（置いたままの小さな揺れは無視）
  let tilt = null, acc = null;
  addEventListener('deviceorientation', e => {
    if (e.beta == null) return;
    if (!tilt) { tilt = [e.beta, e.gamma]; return; }
    if (Math.abs(e.beta - tilt[0]) > TILT || Math.abs(e.gamma - tilt[1]) > TILT) { tilt = [e.beta, e.gamma]; touch(); }
  }, opt);
  addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    if (acc && Math.hypot(a.x - acc[0], a.y - acc[1], a.z - acc[2]) > SHAKE) touch();
    acc = [a.x, a.y, a.z];
  }, opt);

  let sec = 0;
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (!held && Date.now() - last > IDLE * 1000) return;
    if (++sec >= UNIT) {
      sec = 0;
      fetch(URL, { keepalive: true }).catch(() => {});
      remember(UNIT);
    }
  }, 1000);
})();
