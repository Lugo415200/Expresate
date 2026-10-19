// Orientation-only appearance/navigation coverage; actual iOS/Android QA is separate.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../_tmp_lesson000-followup/export');
const out=path.resolve(__dirname,'../_tmp_orientation-theme');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
const {createHash}=require('node:crypto');
const server=http.createServer((req,res)=>{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const button=name=>page.getByRole('button',{name,exact:true});
  const snapshot=name=>page.screenshot({path:path.join(out,name+'.png')});
  async function verifyCharacter(name,file){
   const image=page.getByRole('img',{name,exact:true});
   const uri=await image.evaluate(el=>el.currentSrc||el.querySelector('img')?.src||el.src);
   const response=await page.request.get(uri);assert(response.ok());
   const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
   assert.equal(sha(await response.body()),sha(fs.readFileSync(path.resolve(__dirname,'..',file))),name+' uses the approved pixel artwork in the actual orientation flow');
   assert.equal(await image.evaluate(el=>getComputedStyle(el).imageRendering),'pixelated');
   const box=await image.boundingBox();await page.waitForTimeout(400);
   assert.deepEqual(await image.boundingBox(),box,'Pixel portrait stays stationary');
  }
  async function shownTogether(){
   assert(await page.getByTestId('orientation-screen').evaluate(root=>[...root.querySelectorAll('[dir="auto"]')].filter(el=>!el.closest('[aria-hidden="true"]')&&el.textContent!=='←').every(el=>{
    for(let p=el;p&&p!==root;p=p.parentElement)if(Number(getComputedStyle(p).opacity)!==1)return false;
    return true;
   })), 'Each tutorial appears together, without element fades');
   assert(await page.getByTestId('orientation-progress').evaluate(root=>[...root.querySelectorAll('[dir="auto"]')].every(el=>{
    const surface=getComputedStyle(el.parentElement).backgroundColor;
    return getComputedStyle(el).color===(surface==='rgba(0, 0, 0, 0)'?'rgb(255, 252, 237)':'rgb(11, 19, 50)');
   })), 'Progress labels retain contrast on purple, yellow and ivory');
  }
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await button('Comenzar').click();await page.getByRole('dialog').waitFor({state:'hidden'});
  await shownTogether();await snapshot('listen');
  const tile=button('Escuchar la letra A'),before=await tile.boundingBox();
  const initialHalo=await page.getByTestId('orientation-listen-halo').evaluate(el=>Number(getComputedStyle(el).opacity));
  await page.waitForTimeout(1100);assert.deepEqual(await tile.boundingBox(),before,'Listening card stays stationary');
  assert(Math.abs(await page.getByTestId('orientation-listen-halo').evaluate(el=>Number(getComputedStyle(el).opacity))-initialHalo)>0.01,'Only the slow halo animates');
  assert(await button('Continuar →').isDisabled(), 'Continue starts disabled');
  assert(await tile.getByText('Toca para escuchar',{exact:true}).isVisible(), 'Prompt is inside the listening control');
  assert.equal(await tile.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 223, 53)');
  assert(await page.getByTestId('orientation-listen-halo').isVisible());
  await tile.click();
  assert.equal(await page.getByTestId('orientation-listen-halo').count(),0,'Halo stops on first tap');
  assert(await button('Continuar →').isDisabled(),'Continue remains disabled during first playback');
  await page.waitForFunction(()=>document.querySelector('[aria-label="Continuar →"]').getAttribute('aria-disabled')!=='true');
  assert.equal(await button('Continuar →').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 223, 53)');
  await tile.click();assert(await tile.isDisabled(),'Replay starts real playback');
  await page.waitForFunction(()=>document.querySelector('[aria-label="Escuchar la letra A"]').getAttribute('aria-disabled')!=='true');
  await snapshot('listen-ready');
  await button('Continuar →').click();
  await page.getByText('RESPONDER · 1 DE 2',{exact:true}).waitFor();await shownTogether();
  await button('Paso anterior').click();await page.getByText('Primero, escucha.',{exact:true}).waitFor();
  await button('Continuar →').click();
  for(const [i,letter] of ['A','E'].entries()){
   await page.getByText(`RESPONDER · ${i+1} DE 2`,{exact:true}).waitFor();await shownTogether();
   await snapshot('answer-'+letter);
   await button('Escuchar letra de práctica').click();await button('Elegir '+letter).click();
  }
  await page.getByText('Nunca tienes que adivinar.',{exact:true}).waitFor();
  await shownTogether();await snapshot('consejo-closed');
  await page.getByRole('button',{name:/Abrir Consejo/}).click();
  await page.getByText('Primero escucha. Después conecta el significado.',{exact:true}).scrollIntoViewIfNeeded();
  await snapshot('consejo-open');await button('Siguiente').click();
  await page.getByText('Eso es Exprésate.',{exact:true}).waitFor();await shownTogether();await snapshot('advance');
  await button('Empezar la lección').click();
  await page.getByTestId('orientation-handoff').waitFor();
  for(const text of ['TU PRIMERA LECCIÓN','El alfabeto','Sofía te espera.'])assert(await page.getByTestId('orientation-handoff').getByText(text,{exact:true}).isVisible());
  await snapshot('handoff');
  await page.getByText('1 / 4',{exact:true}).waitFor();
  const panel=page.getByTestId('orientation-dialogue-panel');
  assert.equal(await panel.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 252, 237)');
  assert(await page.getByTestId('story-classroom-background').locator('img').evaluate(el=>el.complete&&el.naturalWidth>0),'Original classroom artwork loads');
  assert(await panel.getByText('1 / 4',{exact:true}).evaluate(el=>getComputedStyle(el).color==='rgb(11, 19, 50)'),'Ivory panel retains navy controls over classroom artwork');
  const dialogue=page.getByRole('button',{name:/^Sofía:/});
  await dialogue.evaluate(el=>{el.click();el.click();el.click();});
  assert(await page.getByText('1 / 4',{exact:true}).isVisible(),'Tap burst does not skip dialogue');
  await page.waitForTimeout(400);await snapshot('sofia-dialogue');
  await verifyCharacter('Sofía','apps/mobile/assets/concepts/sofia-pixel-v2.png');
  await button('Siguiente →').click();
  await page.getByText('2 / 4',{exact:true}).waitFor();
  assert(await page.getByTestId('story-classroom-background').isVisible(),'Classroom remains through Sofía’s dialogue');
  await page.getByRole('button',{name:/^Sofía:/}).evaluate(el=>el.click());await page.waitForTimeout(400);
  await button('Siguiente →').click();
  await page.getByText('3 / 4',{exact:true}).waitFor();await page.waitForTimeout(180);
  assert(await page.getByTestId('story-classroom-background').isVisible(),'Professor now shares the actual classroom background');
  await verifyCharacter('Profesor','apps/mobile/assets/characters/professor-pixel-v2.png');
  await page.getByRole('button',{name:/^Profesor:/}).evaluate(el=>el.click());await page.waitForTimeout(400);
  const advance=page.getByRole('button',{name:/^(Mostrar diálogo completo|Siguiente →)$/}).last();
  const advanceBox=await advance.boundingBox();assert(advanceBox.y>=0&&advanceBox.y+advanceBox.height<=844,'Typing action stays within the screen');
  await snapshot('professor-dialogue');
  await button('Salir de la lección').click();
  await button('Reproducir orientación de desarrollo').click();
  await button('Escuchar la letra A').waitFor();assert(await button('Continuar →').isDisabled(),'Replay resets the listening gate');
  await button('Salir de orientación').click();await button('Reproducir orientación de desarrollo').waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});
  await button('Reproducir orientación de desarrollo').click();
  const staticHalo=page.getByTestId('orientation-listen-halo');await staticHalo.waitFor();
  const opacity=await staticHalo.evaluate(el=>getComputedStyle(el).opacity);
  await page.waitForTimeout(1100);
  assert.equal(await staticHalo.evaluate(el=>getComputedStyle(el).opacity),opacity,'Reduced motion keeps a static highlight');
  assert(await button('Continuar →').isDisabled(),'Replay still requires successful listening with reduced motion');
  assert.deepEqual(errors,[]);
  console.log('PASS normal-motion orientation: immediate panels, stationary card/slow halo, yellow actions, success-only Continue, replay, real A/E audio, back/next, Consejo, unchanged handoff content, ivory dialogue/typewriter skip guard, character handoff, replay and cancel');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
