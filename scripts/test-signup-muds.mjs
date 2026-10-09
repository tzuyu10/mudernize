import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
function load(path){
 const context={exports:{}}
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context)
 return context.exports
}
const {parseInitialMuds}=load('lib/signup-muds.ts')
function form(values){const data=new FormData();for(const [key,value] of Object.entries(values))data.set('mud_'+key,value);return data}
assert.equal(JSON.stringify(parseInitialMuds(form({excused:'0',waived:'1',unexcused:'180'}))),JSON.stringify({excused:0,waived:1,unexcused:180}))
for(const invalid of ['', '-1','181','1.5','NaN','Infinity','1e2',' ']){
 assert.throws(()=>parseInitialMuds(form({excused:invalid,waived:'0',unexcused:'0'})))
}
assert.throws(()=>parseInitialMuds(form({excused:'0',waived:'0'})))
const {hasPrivacyConsent,PRIVACY_NOTICE_VERSION}=load('lib/privacy.ts')
for(const value of ['', 'true','old-version',PRIVACY_NOTICE_VERSION]){
 const data=new FormData();data.set('privacy_consent',value)
 assert.equal(hasPrivacyConsent(data),value===PRIVACY_NOTICE_VERSION)
}
console.log('Signup MUD validation and privacy consent checks passed.')
