export const MUD_CATEGORIES=['excused','waived','unexcused'] as const
export function parseInitialMuds(form:FormData){
 return Object.fromEntries(MUD_CATEGORIES.map(category=>{
  const raw=form.get('mud_'+category)
  if(typeof raw!=='string'||!/^\d{1,3}$/.test(raw)||Number(raw)>180)throw new Error('Enter a whole number from 0 to 180 for each MUD category.')
  return [category,Number(raw)]
 })) as Record<typeof MUD_CATEGORIES[number],number>
}
