// First export apps/mobile to _tmp_lesson000-followup/export. Run from the repo root.
// Uses real bundled recordings and a local Supabase HTTP fixture; no real account writes.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('../shared/progress-core');
const config = require('../shared/backend.json');
const out = path.resolve(__dirname, '../_tmp_lesson000-followup');
const root = path.resolve(process.env.MOBILE_EXPORT_ROOT || path.join(out, 'export'));
const mime = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.json':'application/json' };
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  const resolved = file === root ? path.join(root,'index.html') : file;
  if (!resolved.startsWith(root + path.sep) || !fs.existsSync(resolved)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type',mime[path.extname(resolved)] || 'application/octet-stream');
  res.end(fs.readFileSync(resolved));
});
let row = null, writes = 0;
const user = { id:'00000000-0000-4000-8000-000000000001', email:'learner@example.test', aud:'authenticated', role:'authenticated', app_metadata:{}, user_metadata:{}, created_at:'2026-01-01T00:00:00Z' };
const expiry = Math.floor(Date.now()/1000) + 86400;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp:expiry,role:'authenticated'})}.test-signature`, refresh_token:'fixture-only', expires_at:expiry, expires_in:86400, token_type:'bearer', user };
async function fixture(context) {
  await context.route('**/rest/v1/**', async route => {
    const request = route.request();
    let result = [];
    if (request.url().includes('/user_progress')) {
      if (['POST','PATCH'].includes(request.method())) { row = request.postDataJSON(); writes++; result = [{user_id:user.id}]; }
      else result = row ? [row] : [];
    }
    await route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await context.route('**/auth/v1/**', route => route.fulfill({contentType:'application/json',body:JSON.stringify(user)}));
}
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
  try {
    const context = await browser.newContext({viewport:{width:320,height:568},reducedMotion:'no-preference'});
    await fixture(context);
    const key = `sb-${new URL(config.url).hostname.split('.')[0]}-auth-token`;
    await context.addInitScript(({key,session}) => localStorage.setItem(key,JSON.stringify(session)), {key,session});
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    const click=async name=>{console.log('Click:',name);await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(420);};
    const next=()=>click('Siguiente →');
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await click('Comenzar');
    await page.getByRole('button',{name:'Comenzar',exact:true}).waitFor({state:'hidden'});
    assert(await page.getByText('Toca para escuchar',{exact:true}).isVisible());
    assert(await page.getByRole('button',{name:'Continuar →',exact:true}).isDisabled());
    // The halo never moves the touch target; real playback must finish before continuing.
    const firstAudio=page.getByRole('button',{name:'Escuchar la letra A',exact:true});
    assert(await firstAudio.isEnabled()); await firstAudio.click();
    await click('Continuar →');
    for (const letter of ['A','E']) {
      await click('Escuchar letra de práctica');
      await page.getByRole('button',{name:`Elegir ${letter}`,exact:true}).click();
      await page.waitForTimeout(1150);
    }
    await page.getByRole('button',{name:/Abrir Consejo/}).click();
    await click('Siguiente'); await click('Empezar la lección');
    await page.getByText('AULA DE INGLÉS',{exact:true}).waitFor();
    // A burst can reveal text, but cannot skip the current story line.
    const dialogue=page.getByRole('button',{name:/Sofía:/});
    await dialogue.evaluate(el=>{el.click();el.click();el.click();});
    assert(await page.getByText('1 / 4',{exact:true}).isVisible());
    await page.waitForTimeout(450);
    for(let i=0;i<8 && await page.getByText('AULA DE INGLÉS',{exact:true}).count();i++) {
      const speaker=page.getByRole('button',{name:/Sofía:|Profesor:/});
      await speaker.click();await page.waitForTimeout(420);
    }
    await next();await next();await next(); // Letter-name beat -> examples. No vowel page.
    assert(await page.getByText('Apple',{exact:true}).isVisible());
    await page.screenshot({path:path.join(out,'examples.png')});
    await next();await page.getByText('Airplane',{exact:true}).waitFor();
    await next();await page.getByText('Dog',{exact:true}).waitFor();
    await next();
    assert.equal(await page.getByText('¿Qué letra escuchas?',{exact:true}).count(),0);
    await click('Elegir R');assert(await page.getByText('Todavía no. Busca la mayúscula de «a».',{exact:true}).isVisible());
    await page.getByRole('button',{name:'Elegir A',exact:true}).evaluate(el=>{el.click();el.click();});
    await page.getByText('Explora las 26 letras.',{exact:true}).waitFor();
    for(const letter of ['A','B','C','D','E','F']) {
      await page.getByRole('button',{name:`Escuchar ${letter}`,exact:true}).click();
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')?.includes('escuchada') && !b.disabled));
    }
    for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]) {
      await page.setViewportSize({width,height});
      for(const button of await page.getByRole('button').all()) { const b=await button.boundingBox(); if(b)assert(b.x>=-1&&b.x+b.width<=width+1); }
      await page.screenshot({path:path.join(out,`explorer-${width}.png`)});
    }
    await page.setViewportSize({width:320,height:568}); await next();
    for(const [index,letter] of ['G','M','S'].entries()) {
      await click('Escuchar letra del reto');
      const correct=page.getByRole('button',{name:`Elegir ${letter}`,exact:true});
      await correct.waitFor();
      // Wait for the recording, then exercise wrong-answer retry before the one-tap success.
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')?.startsWith('Elegir ')&&!b.disabled));
      const wrong=page.getByRole('button',{name:/Elegir /}).filter({hasNot:page.getByText(letter,{exact:true})}).first();
      await wrong.click();assert(await page.getByText(/Todavía no/).isVisible());
      await correct.evaluate(el=>{el.click();el.click();el.click();});
      await page.waitForTimeout(900);
      assert(await page.getByText(index===2?'DELETREA · 1/2':`RETO DE OÍDO · ${index+2}/3`,{exact:true}).isVisible());
    }
    for(const word of ['CAT','MAP']) {
      await click('Escuchar deletreo');
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')?.startsWith('Elegir ')&&!b.disabled));
      for(const letter of word)await page.getByRole('button',{name:`Elegir ${letter}`,exact:true}).click();
      await page.waitForTimeout(900);
    }
    const challenge=page.getByTestId('sofia-challenge-art');
    const challengeUri=await challenge.evaluate(el=>el.querySelector('img').src);
    const challengeBytes=await (await page.request.get(challengeUri)).body();
    const {createHash}=require('node:crypto');
    assert.equal(createHash('sha256').update(challengeBytes).digest('hex'),createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../apps/mobile/assets/concepts/sofia-pixel-v2.png'))).digest('hex'),'Final challenge uses approved Sofía V2 too');
    await page.screenshot({path:path.join(out,'approved-sofia-challenge.png')});
    await click('Escuchar el deletreo de Sofía');await click('Terminar lección →');
    await page.getByRole('button',{name:'Guardar progreso',exact:true}).evaluate(el=>{el.click();el.click();el.click();});
    await page.getByRole('button',{name:'Guardado ✓',exact:true}).waitFor();
    assert.equal(writes,1); assert.equal(core.stats(row.progress).xp,10);
    await click('Volver al curso');
    const storageState=await context.storageState();await context.close();
    const reopened=await browser.newContext({storageState,viewport:{width:390,height:844},reducedMotion:'reduce'});
    await fixture(reopened);
    const again=await reopened.newPage(); await again.goto(`http://127.0.0.1:${server.address().port}/`);
    await again.getByRole('button',{name:'Comenzar',exact:true}).click();
    await again.getByRole('button',{name:/Repasar El alfabeto/}).waitFor();
    assert.equal(core.stats(row.progress).xp,10);assert.equal(writes,1);
    await again.getByRole('button',{name:/Repasar El alfabeto/}).click();
    await again.getByText('1 / 4',{exact:true}).waitFor();
    const image=again.getByRole('img',{name:'Sofía',exact:true});const before=await image.boundingBox();await again.waitForTimeout(500);assert.deepEqual(await image.boundingBox(),before);
    assert.equal(await again.getByText('TOCA PARA COMPLETAR',{exact:true}).count(),0);
    await again.screenshot({path:path.join(out,'reduced-motion-story.png')});
    assert.deepEqual(errors,[]);
    console.log('PASS first run, one-tap answers, wrong retries, tap bursts, four widths, real audio, one save/10 XP, reopen persistence with local Supabase fixture, reduced motion');
  } finally { await browser.close();server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
