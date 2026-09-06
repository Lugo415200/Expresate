// Heuristic staged-content check. Prints filenames/rules, never matched values.
const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['diff','--cached','--name-only','--diff-filter=ACMR','-z']).toString().split('\0').filter(Boolean);
let count = 0;
const rules = [
  ['Stripe private key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['Supabase private key', /\bsb_secret_[A-Za-z0-9_-]{16,}\b/],
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['Provider token', /\b(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_-]{20,}\b/],
  ['Embedded private credential', /(?:ELEVENLABS_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|xi-api-key)["']?\s*[:=]\s*["'][A-Za-z0-9_+\/=.-]{20,}["']/i],
];
for (const file of files) {
  const report = label => { console.error(`${file}: ${label}`); count++; };
  if (/(^|\/)(node_modules|dist|\.expo|coverage)(\/|$)/.test(file)) report('Generated dependency/build content');
  if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')) report('Private environment file');
  const bytes = execFileSync('git', ['show',`:${file}`],{maxBuffer:16*1024*1024});
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  for (const [label, pattern] of rules) if (pattern.test(text)) report(label);
  for (const [token] of text.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
      if (payload.role !== 'anon') report('Non-public JWT');
    } catch { report('Unrecognized JWT'); }
  }
}
console.log(`Staged credential/artifact scan: ${files.length} files; ${count ? 'FAILED' : 'PASS'}`);
process.exitCode = count ? 1 : 0;
