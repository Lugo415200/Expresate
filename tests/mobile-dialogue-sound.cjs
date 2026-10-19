// Exercise the real reveal and media lifecycle in the local native web export.
const { chromium } = require('playwright');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../_tmp_lesson000-followup/export');
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 async function open(reducedMotion){
  const context=await browser.newContext({reducedMotion,viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
   localStorage.setItem('expresate_mobile_orientation_v1','seen');
   window.dialogueEvents=[];window.dialogueMedia=[];window.soundRejections=[];
   addEventListener('unhandledrejection',event=>window.soundRejections.push(String(event.reason)));
   const original=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){
    if(/dialogue\.[^/]+\.wav/.test(this.src)){
     if(!window.dialogueMedia.includes(this))window.dialogueMedia.push(this);
     window.dialogueEvents.push({time:performance.now(),volume:this.volume});
    }
    return original.call(this);
   };
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(/AbortError|audio.*cancel|Unhandled.*Promise/i.test(msg.text()))errors.push(msg.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('button',{name:'Comenzar',exact:true}).waitFor({state:'hidden'});
  await page.getByRole('button',{name:/Continuar la lección/}).click();
  await page.getByText('1 / 4',{exact:true}).waitFor();return {page,context};
 }
 try{
  const {page,context}=await open('no-preference');
  const count=()=>page.evaluate(()=>window.dialogueEvents.length);
  await page.waitForFunction(()=>window.dialogueEvents.length>=2);
  await page.getByRole('button',{name:'Siguiente →',exact:true}).waitFor();
  const complete=await count();await page.waitForTimeout(300);assert.equal(await count(),complete);
  assert(await page.evaluate(()=>window.dialogueMedia.every(a=>a.paused)));
  await page.getByRole('button',{name:'Siguiente →',exact:true}).click();
  await page.getByText('2 / 4',{exact:true}).waitFor();
  await page.waitForFunction(n=>window.dialogueEvents.length>n,complete);
  const reveal=page.getByRole('button',{name:'Mostrar diálogo completo',exact:true});
  await reveal.evaluate(el=>{el.click();el.click();el.click();el.click();});
  await page.getByRole('button',{name:'Siguiente →',exact:true}).waitFor();
  assert(await page.getByText('2 / 4',{exact:true}).isVisible());
  const skipped=await count();await page.waitForTimeout(450);assert.equal(await count(),skipped);
  await page.getByRole('button',{name:'Siguiente →',exact:true}).click();
  await page.getByText('3 / 4',{exact:true}).waitFor();
  await page.waitForFunction(n=>window.dialogueEvents.length>n,skipped);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  const background=await count();await page.waitForTimeout(300);assert.equal(await count(),background);
  assert(await page.evaluate(()=>window.dialogueMedia.every(a=>a.paused)));
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(n=>window.dialogueEvents.length>n,background);
  assert.equal(await page.evaluate(()=>window.dialogueMedia.length),1,'One player across dialogue lines');
  const events=await page.evaluate(()=>window.dialogueEvents);
  assert(events.every(e=>e.volume===0.6));
  for(let i=1;i<events.length;i++)assert(events[i].time-events[i-1].time>=110,'No overlapping 120 ms blips');
  await page.getByRole('button',{name:'Salir de la lección',exact:true}).click();
  const left=await count();await page.waitForTimeout(350);assert.equal(await count(),left);
  assert(await page.evaluate(()=>window.dialogueMedia.every(a=>a.paused&&!a.getAttribute('src'))));
  await page.getByRole('button',{name:/Continuar la lección/}).click();
  await page.getByText('1 / 4',{exact:true}).waitFor();
  await page.getByRole('dialog').waitFor({state:'hidden'}); // Wait for the actual entry overlay.
  for(let i=1;i<=4;i++){
   await page.getByText(`${i} / 4`,{exact:true}).waitFor();
   const skip=page.getByRole('button',{name:'Mostrar diálogo completo',exact:true});
   if(await skip.count()){await skip.evaluate(el=>el.click());await page.waitForTimeout(400);}
   await page.getByRole('button',{name:i===4?'Continuar →':'Siguiente →',exact:true}).click();
   await page.waitForTimeout(400);
  }
  for(let i=0;i<2;i++){await page.getByRole('button',{name:'Siguiente →',exact:true}).click();await page.waitForTimeout(400);}
  await page.getByRole('button',{name:'Escuchar el nombre de A',exact:true}).click();
  await page.waitForFunction(()=>![...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Escuchar el nombre de A')?.disabled);
  assert(await page.evaluate(()=>window.dialogueMedia.every(a=>a.paused&&!a.getAttribute('src'))));
  assert.deepEqual(await page.evaluate(()=>window.soundRejections),[]);await context.close();

  const reduced=await open('reduce');await reduced.page.waitForTimeout(400);
  assert.equal(await reduced.page.evaluate(()=>window.dialogueEvents.length),0,'Instant dialogue has no blip burst');
  // Reach the first pronunciation beat immediately after leaving the dialogue.
  for(let i=1;i<=4;i++){await reduced.page.getByRole('button',{name:i===4?'Continuar →':'Siguiente →',exact:true}).click();await reduced.page.waitForTimeout(400);}
  for(let i=0;i<2;i++){await reduced.page.getByRole('button',{name:'Siguiente →',exact:true}).click();await reduced.page.waitForTimeout(400);}
  await reduced.page.getByRole('button',{name:'Escuchar el nombre de A',exact:true}).click();
  await reduced.page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='♪Escuchar A'&&!b.disabled));
  assert.equal(await reduced.page.evaluate(()=>window.dialogueEvents.length),0);
  assert.deepEqual(await reduced.page.evaluate(()=>window.soundRejections),[]);
  assert.deepEqual(errors,[]);await reduced.context.close();
  console.log('PASS real typewriter blips: multiple lines, quiet completion, skip/tap bursts, one player, background/resume, exit/unmount, reduced motion, immediate pronunciation; no cancellation or unhandled Promise errors');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
