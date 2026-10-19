// Reference welcome: native type/cards, large-text reflow and unchanged first-run routing.
// Uses the local native app web export; real iOS safe-area rendering needs device QA.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../_tmp_lesson000-followup/export');
const out = path.resolve(__dirname, '../_tmp_welcome-static');
fs.mkdirSync(out, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.json':'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    for (const reducedMotion of ['no-preference','reduce']) {
    for (const [width, height] of [[320,568],[375,667],[390,844],[430,932]]) {
      const context = await browser.newContext({ viewport:{width,height}, reducedMotion });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const begin = page.getByRole('button', { name:'Comenzar', exact:true });
      await begin.waitFor();
      assert(await begin.isEnabled(), 'Comenzar is available immediately');
      const firstFrame = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const nodes = [dialog.querySelector('[data-testid="welcome-wordmark"]'), dialog.querySelector('[aria-label="Comenzar"]'),
          ...dialog.querySelectorAll('[data-testid^="welcome-card-"]'),
          ...[...dialog.querySelectorAll('[dir="auto"]')].filter(el=>/^(Tu inglés|Escucha, practica|Paso a paso)/.test(el.textContent))];
        return nodes.every(node=>{
          for(let el=node;el&&el!==dialog;el=el.parentElement)if(Number(getComputedStyle(el).opacity)!==1)return false;
          return true;
        });
      });
      assert(firstFrame, 'All welcome elements appear together at full opacity');
      const initialCards = await page.getByTestId('welcome-card-A').boundingBox();
      const initialB = await page.getByTestId('welcome-card-B').boundingBox();
      await page.waitForTimeout(1100);
      assert.deepEqual(await page.getByTestId('welcome-card-A').boundingBox(), initialCards, 'A card is stationary');
      assert.deepEqual(await page.getByTestId('welcome-card-B').boundingBox(), initialB, 'B card is stationary');
      for (const scale of [1,1.6]) {
        if (scale !== 1) await page.evaluate(() => {
          for (const el of document.querySelector('[role="dialog"]').querySelectorAll('[dir="auto"]')) {
            if (el.closest('[aria-hidden="true"]')) continue; // Logo/decorative card glyphs are not system-scaled.
            const css = getComputedStyle(el);
            el.style.fontSize = parseFloat(css.fontSize) * 1.6 + 'px';
            if (css.lineHeight !== 'normal') el.style.lineHeight = parseFloat(css.lineHeight) * 1.6 + 'px';
          }
        });
        await page.waitForTimeout(200);
        const group = page.getByTestId('welcome-artwork');
        assert.equal(await group.count(), 1, 'Reference artwork stays present on compact phones');
        assert.equal(await page.getByLabel('Exprésate', {exact:true}).count(), 1);
        const welcome = page.getByRole('dialog');
        assert.equal(await welcome.getByText('Tu inglés empieza aquí.', {exact:true}).count(), 1);
        assert.equal(await welcome.getByText('Escucha, practica y aprende a tu ritmo.', {exact:true}).count(), 1);
        assert.equal(await welcome.getByText('Paso a paso, contigo.', {exact:true}).count(), 1);
        const delta = await page.evaluate(() => {
          const group = document.querySelector('[data-testid="welcome-artwork"]');
          const box = group.getBoundingClientRect();
          const tiles = ['A','B'].map(letter => document.querySelector(`[data-testid="welcome-card-${letter}"]`).getBoundingClientRect());
          const left = Math.min(...tiles.map(r => r.left));
          const right = Math.max(...tiles.map(r => r.right));
          const headline = [...document.querySelectorAll('[role="heading"]')].find(el=>el.textContent==='Tu inglés empieza aquí.').getBoundingClientRect();
          return { container:box.x + box.width/2 - innerWidth/2, left, right, separated:Math.max(...tiles.map(r=>r.bottom))<=headline.top };
        });
        assert(Math.abs(delta.container) < 0.1, JSON.stringify(delta));
        assert(delta.left >= 0 && delta.right <= width, 'Cards stay within viewport');
        assert(delta.separated, 'Cards never overlap the headline');
        const button = await begin.boundingBox();
        assert(Math.abs(button.x + button.width/2 - width/2) < 0.1);
        assert(button.y >= 0 && button.y + button.height <= height);
        const overflow = await page.evaluate(() => {
          const issues = [];
          for (const el of document.querySelector('[role="dialog"]').querySelectorAll('[dir="auto"]')) {
            if (el.closest('[aria-hidden="true"]')) continue;
            const range = document.createRange(); range.selectNodeContents(el);
            for (const r of range.getClientRects()) if (r.width && (r.left < -1 || r.right > innerWidth+1)) issues.push(el.textContent);
          }
          return issues;
        });
        assert.deepEqual(overflow, []);
        const titleBounds = await page.evaluate(() => {
          const word = document.querySelector('[data-testid="welcome-wordmark"]').getBoundingClientRect();
          const text = document.querySelector('[data-testid="welcome-wordmark-final"]');
          const shadow = document.querySelector('[data-testid="welcome-wordmark-final-shadow"]');
          const css = getComputedStyle(text), box = text.getBoundingClientRect(), shade = shadow.getBoundingClientRect();
          const context = document.createElement('canvas').getContext('2d');
          context.font = css.fontWeight+' '+css.fontSize+' '+css.fontFamily;
          context.letterSpacing = css.letterSpacing;
          const ink = context.measureText(text.textContent).actualBoundingBoxRight;
          return {font:parseFloat(css.fontSize),tracking:Math.abs(parseFloat(css.letterSpacing)),padding:parseFloat(css.paddingRight),
            left:word.left,right:word.right,wordRight:word.right,textRight:box.right,shadowRight:shade.right,
            inkRight:box.left+ink,shadowInkRight:shade.left+ink};
        });
        assert(Math.abs(titleBounds.font-Math.min(68,(width-48)*0.19))<0.1, 'Approved title size is unchanged');
        assert(titleBounds.padding>=titleBounds.tracking+2, 'Reserve final-glyph overhang and shadow space');
        assert(titleBounds.left>=0&&titleBounds.right<=width);
        assert(titleBounds.textRight<=titleBounds.wordRight&&titleBounds.shadowRight<=titleBounds.wordRight);
        assert(titleBounds.inkRight<=titleBounds.textRight&&titleBounds.shadowInkRight<=titleBounds.shadowRight, 'Final glyph ink fits its drawing bounds: '+JSON.stringify(titleBounds));
        await page.screenshot({ path:path.join(out, `intro-${width}-${scale}-${reducedMotion}.png`) });
        console.log(`PASS welcome ${width}x${height} ${scale}x ${reducedMotion}: immediate, stationary cards, full title/shadow, visible CTA`);
      }
      // On small phones/large text, the complete supporting copy remains reachable
      // inside the content scroll area without passing behind the pinned CTA.
      const support = page.getByRole('dialog').getByText('Escucha, practica y aprende a tu ritmo.', {exact:true});
      await support.scrollIntoViewIfNeeded();
      const copyBox = await support.boundingBox(), actionBox = await begin.boundingBox();
      assert(copyBox.y >= 0 && copyBox.y + copyBox.height <= actionBox.y, 'Supporting text is readable above the CTA');
      // One deliberate tap enters the existing fresh-user orientation flow.
      await begin.evaluate(el=>{el.click();el.click();el.click();});
      await page.getByRole('dialog').waitFor({state:'hidden'});
      await page.getByRole('button',{name:'Escuchar la letra A',exact:true}).waitFor();
      await context.close();
    }
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
