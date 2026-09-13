export type PersonName={
 first_name?:string|null
 middle_initial?:string|null
 last_name?:string|null
}

export function normalizeMiddleInitial(value:FormDataEntryValue|null){
 const middle=String(value||'').trim().replace(/\.$/,'').toUpperCase()
 if(middle&&!/^[A-Z]$/.test(middle))throw new Error('Middle initial must be one letter.')
 return middle||null
}

export function displayName(person:PersonName){
 const middle=person.middle_initial?.trim().replace(/\.$/,'').toUpperCase()
 return [person.first_name,middle?`${middle}.`:null,person.last_name].filter(Boolean).join(' ')
}
