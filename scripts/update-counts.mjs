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
