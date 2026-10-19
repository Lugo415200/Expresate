// First export apps/mobile to _tmp_lesson000-followup/export. Run from the repo root.
// Reduced-motion story layout with 160% browser text, not an iOS Dynamic Type test.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = path.resolve(__dirname, '../_tmp_lesson000-followup');
const root = path.join(out, 'export');
const mime = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.json':'application/json' };
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  const resolved = file === root ? path.join(root,'index.html') : file;
  if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type',mime[path.extname(resolved)] || 'application/octet-stream');
  res.end(fs.readFileSync(resolved));
});
(async () => {
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:320,height:568}});
  await context.addInitScript(()=>localStorage.setItem('expresate_mobile_orientation_v1','seen'));
  const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('button',{name:/Continuar la lección/}).click();
  await page.getByText('1 / 4',{exact:true}).waitFor();
  await page.evaluate(()=>{for(const el of document.querySelectorAll('[dir="auto"]')){if(el.closest('[aria-hidden="true"]'))continue;const css=getComputedStyle(el);el.style.fontSize=parseFloat(css.fontSize)*1.6+'px';if(css.lineHeight!=='normal')el.style.lineHeight=parseFloat(css.lineHeight)*1.6+'px';}});
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(400);
   const art=await page.getByRole('img',{name:'Sofía',exact:true}).boundingBox();
   const speech=await page.getByRole('button',{name:/Sofía:/}).boundingBox();
   assert(art.x>=0 && art.x+art.width<=width); assert(art.y+art.height<=speech.y+1);
   const panel=await page.getByTestId('orientation-dialogue-panel').boundingBox();
   const badge=await page.getByTestId('orientation-speaker-badge').boundingBox();
   const header=await page.getByTestId('orientation-story-progress').boundingBox();
   assert(Math.abs(art.y+art.height-panel.y-12)<1.5,'Panel hides artwork edge');
   assert(art.y>=header.y+header.height,'Artwork stays out of header');
   assert(badge.y<panel.y&&badge.y+badge.height>panel.y&&badge.y+badge.height<=speech.y,'Badge sits on panel edge above dialogue');
   await page.screenshot({path:path.join(out,`large-text-story-${width}.png`)});
  }
  console.log('PASS 160% browser text: anchored artwork, 12px panel overlap, edge badge, no header/dialogue overlap at four portrait sizes');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
