// Export apps/mobile locally, then run from the repository root with Playwright/Chrome.
// Browser layout proxies: actual iOS Dynamic Type, safe areas and VoiceOver need device QA.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.MOBILE_EXPORT_ROOT||path.resolve(__dirname,'../_tmp_lesson000-followup/export'));
const out=path.resolve(__dirname,'../_tmp_lesson000-type');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
const sizes=[[320,568],[375,667],[390,844],[430,932]];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const context=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const pause=ms=>page.waitForTimeout(ms);
  async function scale(value){await page.evaluate(value=>{
   const scope=document.querySelector('[role="dialog"]')||document;
   const nodes=[...scope.querySelectorAll('[dir="auto"]')].filter(el=>!el.closest('[aria-hidden="true"]'));
   const measurements=nodes.map(el=>{const css=getComputedStyle(el);return {el,size:el.dataset.typeSize||css.fontSize,line:el.dataset.typeLine||css.lineHeight};});
   for(const {el,size,line} of measurements){el.dataset.typeSize=size;el.dataset.typeLine=line;el.style.fontSize=parseFloat(size)*value+'px';if(line!=='normal')el.style.lineHeight=parseFloat(line)*value+'px';}
  },value);await pause(180);}
  async function audit(name){
   // Still walk the full first-run flow; optionally focus screenshots on exercises.
   if(process.env.MOBILE_EXERCISES_ONLY==='1'&&(name==='intro'||name.startsWith('orientation')||name.startsWith('story')))return;
   for(const [width,height] of sizes){
    await page.setViewportSize({width,height});
    for(const multiplier of [1,1.6]){
     await scale(multiplier);
     const overflow=await page.evaluate(()=>{
      const issues=[];
      const scope=document.querySelector('[role="dialog"]')||document;
      for(const el of scope.querySelectorAll('[dir="auto"]')){
       const css=getComputedStyle(el),box=el.getBoundingClientRect();
       if(el.closest('[aria-hidden="true"]')||!box.width||css.opacity==='0'||css.visibility==='hidden')continue;
       if(parseFloat(css.fontSize)<17)issues.push(`small text: ${el.textContent}`);
       const range=document.createRange();range.selectNodeContents(el);
       for(const rect of range.getClientRects()){if(rect.width&& (rect.left< -1||rect.right>innerWidth+1))issues.push(`text outside width: ${el.textContent}`);}
      }
      return [...new Set(issues)];
     });
     assert.deepEqual(overflow,[],`${name} ${width} ${multiplier}: ${overflow.join('; ')}`);
     const lesson=page.getByTestId('lesson000-exercises');
     if(await lesson.count()){
      assert.equal(await lesson.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(75, 63, 244)','Every exercise keeps the approved purple');
      const title=page.getByRole('heading').last();
      assert.equal(await title.evaluate(el=>getComputedStyle(el).color),'rgb(11, 19, 50)');
      assert.equal(await title.evaluate(el=>getComputedStyle(el.parentElement).backgroundColor),'rgb(255, 252, 237)');
      for(const action of await page.getByRole('button',{name:/^(Siguiente|Terminar lección|Guardar progreso|Iniciar sesión para guardar|Escuchar)/}).all()){
       if(await action.evaluate(el=>!!el.closest('[data-testid="alphabet-explorer-grid"]')))continue;
       const color=await action.evaluate(el=>getComputedStyle(el).backgroundColor);
       assert.equal(color,await action.isDisabled()?'rgb(218, 214, 236)':'rgb(255, 223, 53)','Primary/audio actions distinguish enabled and disabled');
      }
      if(name.startsWith('explorer')){
       for(const tile of await page.getByTestId('alphabet-explorer-grid').getByRole('button').all()){
        const chosen=await tile.getAttribute('aria-selected')==='true';
        assert.equal(await tile.evaluate(el=>getComputedStyle(el).backgroundColor),chosen?'rgb(255, 223, 53)':'rgb(255, 252, 237)','Visits never imply correctness or a green border');
       }
      }
     }
     if(name.startsWith('orientation')||name.startsWith('story')){
      const themed=await page.evaluate(()=>{
       const root=document.querySelector('[data-testid="orientation-screen"], [data-testid="orientation-dialogue"]');
       const panel=document.querySelector('[data-testid="orientation-dialogue-panel"]');
       const logo=document.querySelector('[data-testid="welcome-wordmark"]')?.getBoundingClientRect();
       const shadow=document.querySelector('[data-testid="welcome-wordmark-final-shadow"]')?.getBoundingClientRect();
       return {background:getComputedStyle(root).backgroundColor,panel:panel?getComputedStyle(panel).backgroundColor:null,
        titleFits:logo&&shadow&&logo.left>=0&&logo.right<=innerWidth&&shadow.right<=logo.right};
      });
      assert.equal(themed.background,'rgb(75, 63, 244)');
      if(name.startsWith('story'))assert.equal(themed.panel,'rgb(255, 252, 237)');
      assert(themed.titleFits,'Orientation wordmark and final shadow stay within their bounds');
     }
     // Pinned navigation must be completely visible. Other lesson controls remain scrollable.
     for(const button of await page.getByRole('button',{name:/^(Siguiente|Continuar|Terminar lección|Guardar progreso|Volver al curso|Iniciar sesión para guardar|Comenzar)/}).all()){
      const b=await button.boundingBox();if(b)assert(b.y>=-1&&b.y+b.height<=height+1,`${name}: hidden navigation`);
     }
     if(name.startsWith('story')){
      const art=await page.getByRole('img',{name:/Sofía|Profesor/}).boundingBox();
      const speech=await page.getByRole('button',{name:/^(Sofía|Profesor):/}).boundingBox();
      assert(art.x>=0&&art.x+art.width<=width);assert(art.y+art.height<=speech.y+1);
      const panelBox=await page.getByTestId('orientation-dialogue-panel').boundingBox();
      const badge=await page.getByTestId('orientation-speaker-badge').boundingBox();
      const header=await page.getByTestId('orientation-story-progress').boundingBox();
      assert(Math.abs(art.y+art.height-panelBox.y-12)<1.5,'Panel masks the bottom 12px of artwork');
      assert(art.y>=header.y+header.height,'Character stays below header');
      assert(badge.y<panelBox.y&&badge.y+badge.height>panelBox.y,'Badge straddles panel edge');
      assert(badge.y+badge.height<=speech.y,'Badge does not cover dialogue');
     }
     if(name.startsWith('spell')){
      for(const key of await page.getByTestId('spelling-keyboard').getByRole('button').all()){
       await key.scrollIntoViewIfNeeded();
       const box=await key.boundingBox(),bounds=await key.evaluate(el=>{
        for(let p=el.parentElement;p;p=p.parentElement)if(['auto','scroll'].includes(getComputedStyle(p).overflowY)){const b=p.getBoundingClientRect();return {top:b.top,bottom:b.bottom};}
       });
       assert(box.width>=48&&box.height>=64,'Spelling keys retain comfortable touch targets');
       assert(box.y>=bounds.top-1&&box.y+box.height<=bounds.bottom+1,`${name} ${width} ${multiplier}: key can be fully reached above feedback`);
      }
     }
     await page.screenshot({path:path.join(out,`${name}-${width}-${multiplier}.png`)});
    }
   }
   await scale(1);await page.setViewportSize({width:320,height:568});console.log('PASS layout:',name);
  }
  const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await pause(420);};
  const next=()=>click('Siguiente →');
  async function correctShot(name,letter){
   const answer=page.getByRole('button',{name:'Elegir '+letter,exact:true});await answer.click();
   assert.equal(await answer.getAttribute('aria-selected'),'true');
   assert.equal(await answer.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 223, 53)');
   assert(await answer.getByText('✓',{exact:true}).isVisible(),'Correct state uses an icon as well as yellow');
   await page.screenshot({path:path.join(out,name+'-correct.png')});await pause(900);
  }
  async function listen(name){await click(name);await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')?.startsWith('Reproduciendo')));await pause(1800);}
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button',{name:'Comenzar',exact:true}).waitFor();await audit('intro');await click('Comenzar');
  await audit('orientation-listen');await listen('Escuchar la letra A');await click('Continuar →');
  for(const l of ['A','E']){await audit('orientation-answer-'+l);await listen('Escuchar letra de práctica');await click('Elegir '+l);await pause(900);}
  await page.getByRole('button',{name:/Abrir Consejo/}).click();await audit('orientation-tip');await click('Siguiente');
  await audit('orientation-ready');await click('Empezar la lección');
  for(let i=1;i<=4;i++){await page.getByText(`${i} / 4`,{exact:true}).waitFor();await audit('story-'+i);await page.getByRole('button',{name:i===4?'Continuar →':'Siguiente →',exact:true}).click();await pause(420);}
  await audit('map');await next();await audit('alphabet');await next();
  await audit('letter-name');await listen('Escuchar el nombre de A');await next();
  for(const word of ['Apple','Airplane','Dog']){await page.getByText(word,{exact:true}).waitFor();await audit(word.toLowerCase());await next();}
  await audit('recognition');await click('Elegir R');
  assert(await page.getByRole('button',{name:'Elegir R',exact:true}).getByText('×',{exact:true}).isVisible());
  await audit('recognition-retry');await correctShot('recognition','A');
  await audit('explorer');
  for(const l of ['A','B','C','D','E','F']){await page.getByRole('button',{name:new RegExp('^Escuchar '+l+'(, escuchada)?$')}).click();await pause(2100);}
  // Last tile is reachable in the larger scrolling grid, and retains its learning size.
  await page.getByRole('button',{name:'Escuchar Z',exact:true}).scrollIntoViewIfNeeded();
  await audit('explorer-visited');await next();
  for(const [i,l] of ['G','M','S'].entries()){
   await audit('hearing-'+i);await listen('Escuchar letra del reto');
   const wrong=page.getByRole('button',{name:/Elegir /}).filter({hasNot:page.getByText(l,{exact:true})}).first();await wrong.click();await audit('hearing-retry-'+i);
   assert(await wrong.getByText('×',{exact:true}).isVisible(),'Wrong listening answer is explicitly marked');
   await correctShot('hearing-'+i,l);
  }
  for(const word of ['CAT','MAP']){
   await audit('spell-'+word);await listen('Escuchar deletreo');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')?.startsWith('Elegir ')&&!b.disabled));
   const wrong=page.getByRole('button',{name:'Elegir '+(word==='CAT'?'B':'N'),exact:true});await wrong.click();
   assert(await wrong.getByText('×',{exact:true}).isVisible());await audit('spell-retry-'+word);
   await click('Elegir '+word[0]);await audit('spell-progress-'+word);
   assert.equal(await page.getByRole('button',{name:'Elegir '+word[0],exact:true}).getAttribute('aria-selected'),'true');
   for(const l of word.slice(1))await click('Elegir '+l);await pause(900);
  }
  await audit('sofia');await listen('Escuchar el deletreo de Sofía');await click('Terminar lección →');
  await audit('completion');await click('Volver al curso');assert.deepEqual(errors,[]);
  console.log('PASS complete layout sweep: 4 sizes × 2 text scales for every first-run and Lesson 000 screen; pinned navigation, text width/readability, artwork separation, audio and retry flow');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
