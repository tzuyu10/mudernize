import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
let now=0,refreshes=0,removed=0,cleanup,notify,status,sequence=0
const timers=new Map()
const document=new EventTarget()
document.visibilityState='visible'
const window=new EventTarget(),navigator={onLine:true}
const channel={on(_type,_filter,callback){notify=callback;return this},subscribe(callback){status=callback;return this}}
const router={refresh(){refreshes++}}
const modules={
 react:{useRef:value=>({current:value}),useTransition:()=>[false,callback=>callback()],useEffect:callback=>{cleanup=callback()}},
 'next/navigation':{useRouter:()=>router},
 '@/lib/supabase/client':{createClient:()=>({channel:()=>channel,removeChannel:()=>{removed++;return Promise.resolve()}})}
}
function timer(callback,delay,repeat=false){const id=++sequence;timers.set(id,{callback,at:now+delay,delay,repeat});return id}
function advance(ms){
 const end=now+ms
 while(true){
  const entry=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0]
  if(!entry)break
  const [id,item]=entry;now=item.at
  if(item.repeat)item.at+=item.delay;else timers.delete(id)
  item.callback()
 }
 now=end
}
const context={exports:{},require:name=>modules[name],document,window,navigator,Date:{now:()=>now},
 setTimeout:(fn,ms)=>timer(fn,ms),clearTimeout:id=>timers.delete(id),
 setInterval:(fn,ms)=>timer(fn,ms,true),clearInterval:id=>timers.delete(id)}
const source=ts.transpileModule(fs.readFileSync('components/LiveUpdates.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
vm.runInNewContext(source,context)
context.exports.default()
status('SUBSCRIBED')
notify();notify();notify()
advance(749);assert.equal(refreshes,0)
advance(1);assert.equal(refreshes,1,'burst should cause one refresh')
document.visibilityState='hidden';notify();advance(150000)
assert.equal(refreshes,1,'hidden tabs should not refresh')
document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));advance(750)
assert.equal(refreshes,2,'returning to a tab should catch up')
navigator.onLine=false;notify();advance(150000)
assert.equal(refreshes,2,'offline tabs should not refresh')
navigator.onLine=true;window.dispatchEvent(new Event('online'));advance(750)
assert.equal(refreshes,3,'reconnecting should catch up')
status('CHANNEL_ERROR');advance(45000)
assert.ok(refreshes>3,'fallback should refresh when realtime is unavailable')
notify();cleanup();const before=refreshes;advance(150000)
assert.equal(refreshes,before,'unmount must cancel pending work')
assert.equal(removed,1);assert.equal(timers.size,0)
console.log('Live updates passed: debounce, hidden/offline pause, recovery, fallback, cleanup.')
