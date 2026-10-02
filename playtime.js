// 作品ページで遊ばれている時間を数える（画面が表示されている間だけ、30秒ごとに1回記録）
// 自動公開スクリプトが apps/<作品ID>/index.html に読み込みを追加する
(() => {
  const m = location.pathname.match(/\/apps\/([^/]+)\//);
  if (!m || location.protocol === 'file:') return;
  const KEY = encodeURIComponent(m[1]) + '-t30';
  const URL = 'https://abacus.jasoncameron.dev/hit/kato200000354-works/' + KEY;
  const UNIT = 30;
  let sec = 0;
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (++sec >= UNIT) {
      sec = 0;
      fetch(URL, { keepalive: true }).catch(() => {});
    }
  }, 1000);
})();
