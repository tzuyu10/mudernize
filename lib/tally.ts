export const dutyCategories=['excused','waived','unexcused'] as const
export type DutyCategory=typeof dutyCategories[number]

type Adjustment={duty_type:string;signed_total:number|null}
type Registration={duty_type:string;duty_count:number;status:string}

export type TallyBalance={required:number;registered:number;completed:number;remaining:number}
export type TallyBalances=Record<DutyCategory,TallyBalance>

export function calculateTallyBalances(adjustments:Adjustment[]|null|undefined,registrations:Registration[]|null|undefined):TallyBalances{
 return Object.fromEntries(dutyCategories.map(category=>{
  const assigned=(adjustments||[]).filter(row=>row.duty_type===category).reduce((sum,row)=>sum+(row.signed_total||0),0)
  const active=(registrations||[]).filter(row=>row.duty_type===category&&row.status!=='denied')
  const completed=active.filter(row=>row.status==='completed').reduce((sum,row)=>sum+row.duty_count,0)
  const registered=active.filter(row=>row.status!=='completed').reduce((sum,row)=>sum+row.duty_count,0)
  const required=Math.max(0,assigned-completed)
  return [category,{required,registered,completed,remaining:Math.max(0,required-registered)}]
 })) as TallyBalances
}