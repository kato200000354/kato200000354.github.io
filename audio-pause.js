// アプリを離れたら（ホーム画面に戻る・別のアプリに切り替える・画面を消す）音を止め、戻ったら再開する。
// 自動公開スクリプトが apps/<作品>/index.html の <head> の最初に読み込みを追加する（ゲームが音を作る前に動く必要があるため）。
(() => {
  if (window.__audioPause) return;
  window.__audioPause = true;
  const contexts = new Set();      // ゲームが作った AudioContext
  window.__audioPauseContexts = contexts; // 動作確認用
  const stoppedByUs = new Set();   // ここで止めたもの（戻ったときに再開する）
  const media = new Set();         // 再生された <audio> / new Audio()

  // AudioContext を作ったときに覚えておく
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Original = window[name];
    if (typeof Original !== 'function') continue;
    const Wrapped = function (...args) {
      const ctx = new Original(...args);
      contexts.add(ctx);
      return ctx;
    };
    Wrapped.prototype = Original.prototype;
    Object.setPrototypeOf(Wrapped, Original);
    window[name] = Wrapped;
  }
  // 再生された音声ファイルを覚えておく
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    media.add(this);
    return originalPlay.apply(this, args);
  };

  function stop() {
    for (const ctx of contexts) {
      if (ctx.state === 'running') { stoppedByUs.add(ctx); ctx.suspend().catch(() => {}); }
    }
    for (const m of new Set([...media, ...document.querySelectorAll('audio, video')])) {
      if (!m.paused) { stoppedByUs.add(m); m.pause(); }
    }
    try { if (speechSynthesis.speaking) { speechSynthesis.pause(); stoppedByUs.add(speechSynthesis); } } catch {}
  }
  function resume() {
    for (const x of stoppedByUs) {
      if (x === window.speechSynthesis) { try { speechSynthesis.resume(); } catch {} }
      else if (x instanceof HTMLMediaElement) x.play().catch(() => {});
      else if (x.state === 'suspended') x.resume().catch(() => {});
    }
    stoppedByUs.clear();
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : resume()));
  addEventListener('pagehide', stop);
  addEventListener('pageshow', () => { if (!document.hidden) resume(); });
})();
