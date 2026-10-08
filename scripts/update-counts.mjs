// 全作品の「開かれた回数」と「プレイ時間（30秒単位）」をカウンターから集めて counts.json に保存する。
// GitHub Actions が1時間ごとに実行する（.github/workflows/update-counts.yml）
import fs from 'node:fs';

const COUNTER = 'https://abacus.jasoncameron.dev';
const NS = 'kato200000354-works';
const works = JSON.parse(fs.readFileSync('works.json', 'utf8'));
const old = fs.existsSync('counts.json') ? JSON.parse(fs.readFileSync('counts.json', 'utf8')) : { counts: {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(key) {
  for (let tries = 0; tries < 5; tries++) {
    const res = await fetch(`${COUNTER}/get/${NS}/${key}`).catch(() => null);
    if (res?.status === 429) { await sleep(11000); continue; }
    if (!res) return null;
    return res.ok ? (await res.json()).value : res.status === 404 ? 0 : null;
  }
  return null;
}

const keys = works.flatMap(w => [w.id, ...(w.href.startsWith('apps/') ? [w.id + '-t30'] : [])]);
const counts = {};
for (const key of keys) {
  const v = await get(key);
  counts[key] = v ?? old.counts[key] ?? 0; // 取れなかったら前回の値
  await sleep(400); // 「10秒に30回まで」の制限におさめる
}

if (JSON.stringify(counts) === JSON.stringify(old.counts)) {
  console.log('変化なし');
} else {
  fs.writeFileSync('counts.json', JSON.stringify({ updatedAt: new Date().toISOString(), counts }, null, 2) + '\n');
  console.log('counts.json を更新しました');
}

// 日ごとの記録（週間ランキング用）。日本時間の日付ごとに、その日の最新の値を残す。40日分まで
const HISTORY = 'counts-history.json';
const history = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, 'utf8')) : {};
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const before = JSON.stringify(history);
history[today] = counts;
for (const d of Object.keys(history).sort().slice(0, -40)) delete history[d];
if (JSON.stringify(history) !== before) {
  fs.writeFileSync(HISTORY, JSON.stringify(history) + '\n');
  console.log(`${HISTORY} を更新しました（${Object.keys(history).length}日分）`);
}
