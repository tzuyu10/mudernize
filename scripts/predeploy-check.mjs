import {spawnSync} from 'node:child_process'

const npmEntry=process.env.npm_execpath
const withDatabase=process.argv.includes('--with-db')
const checks=[
 ['TypeScript validation',['run','typecheck']],
 ['Production build',['run','build']],
]
if(withDatabase)checks.push(['Database migration check',['run','db:check']])

for(const [label,args] of checks){
 console.log(`\n[predeploy] ${label}`)
 const command=npmEntry?process.execPath:'npm'
 const commandArgs=npmEntry?[npmEntry,...args]:args
 const result=spawnSync(command,commandArgs,{stdio:'inherit',shell:false})
 if(result.error){console.error(`[predeploy] ${label} could not start:`,result.error.message);process.exit(1)}
 if(result.status!==0){console.error(`[predeploy] ${label} failed.`);process.exit(result.status||1)}
 console.log(`[predeploy] ${label} passed.`)
}

console.log(`\n[predeploy] All ${checks.length} checks passed.${withDatabase?' Database migration 009 is available.':' Run npm run test:predeploy:db after applying the database migrations.'}`)
