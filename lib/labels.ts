const statusLabels:Record<string,string>={verified:'Approved'}

export function displayLabel(value:string|null|undefined){
 if(!value)return ''
 if(statusLabels[value])return statusLabels[value]
 return value.replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())
}
