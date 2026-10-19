const test = require('node:test');
const assert = require('node:assert/strict');
const { createTextCadence, createDialogueSoundController } = require('../apps/mobile/src/dialogueSound');

function fixture() {
  let created=0, plays=0, pauses=0, removed=0, unsubscribed=0, finish;
  const player = {
    isLoaded:true, volume:1,
    seekTo:async()=>{}, play:async()=>{ plays++; }, pause:()=>{ pauses++; },
    onFinish(callback) { finish=callback; return { remove:()=>{ unsubscribed++; } }; },
    remove:()=>{ removed++; },
  };
  const sound=createDialogueSoundController(()=>{ created++; return player; });
  return { sound, player, ended:()=>finish(), counts:()=>({created,plays,pauses,removed,unsubscribed}) };
}

test('dialogue cadence counts letters/numbers, ignoring spaces, newlines and punctuation', () => {
  const eligible=createTextCadence(3);
  const input='A b,\nC. á!é?F 123';
  assert.deepEqual(Array.from(input).filter(eligible), ['C','F','3']);
  assert.equal(createTextCadence(1)('A'),false); // Never a sound for each character.
});
test('reuses one player across lines and drops busy ticks without a queue', async () => {
  const f=fixture();f.sound.begin();
  await Promise.all(Array.from({length:30},()=>f.sound.pulse()));
  assert.equal(f.counts().plays,1);
  f.ended();await f.sound.pulse();assert.equal(f.counts().plays,2);
  f.sound.begin();await f.sound.pulse();assert.equal(f.counts().created,1);
  assert.equal(f.player.volume,0.6);
  f.sound.dispose();
});
test('skip, completion and scene disposal invalidate a seek that has not finished', async () => {
  for(const action of ['stop','finish','dispose']) {
    const f=fixture();let resolve;
    f.player.seekTo=()=>new Promise(r=>{resolve=r;});f.sound.begin();
    const pending=f.sound.pulse();f.sound[action]();resolve();await pending;
    await f.sound.pulse();assert.equal(f.counts().plays,0);
    f.sound.dispose();assert.equal(f.counts().removed,1);assert.equal(f.counts().unsubscribed,1);
  }
});
test('completion cancels pending starts but lets an audible short blip finish naturally', async () => {
  const f=fixture();f.sound.begin();await f.sound.pulse();
  const before=f.counts().pauses;f.sound.finish();
  await f.sound.pulse();assert.equal(f.counts().plays,1);assert.equal(f.counts().pauses,before);
  f.ended();await f.sound.pulse();assert.equal(f.counts().plays,1);
  f.sound.dispose();
});
test('backgrounding cancels pending starts and drops inactive ticks; resuming has no backlog', async () => {
  const f=fixture();let resolve;
  f.player.seekTo=()=>new Promise(r=>{resolve=r;});f.sound.begin();
  const pending=f.sound.pulse();f.sound.setActive(false);resolve();await pending;
  await f.sound.pulse();assert.equal(f.counts().plays,0);
  f.sound.setActive(true);f.player.seekTo=async()=>{};await f.sound.pulse();
  assert.equal(f.counts().plays,1);f.sound.dispose();
});
test('unloaded audio never starts late, and playback rejection remains decorative', async () => {
  const f=fixture();f.sound.begin();f.player.isLoaded=false;
  await f.sound.pulse();assert.equal(f.counts().plays,0);
  f.player.isLoaded=true;f.player.play=async()=>{throw new Error('AbortError');};
  await assert.doesNotReject(f.sound.pulse());
  f.player.play=async()=>{};await assert.doesNotReject(f.sound.pulse());f.sound.dispose();
});
test('stopping without starting (instant/reduced-motion text) allocates no audio player', async () => {
  const f=fixture();f.sound.stop();f.sound.finish();await f.sound.pulse();
  f.sound.dispose();assert.equal(f.counts().created,0);
});
