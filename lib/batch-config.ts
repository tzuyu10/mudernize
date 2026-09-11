export type BatchConfig={
 name:string
 student_year_prefix:string
 year_level:'2nd'|'3rd'|'4th'
 theme_color:string
 logo_path:string
 is_active:boolean
}

export const defaultBatchConfigs:BatchConfig[]=[
 {name:'Sanghaya',student_year_prefix:'2025',year_level:'2nd',theme_color:'#ffacec',logo_path:'/logos/sanghaya.png',is_active:true},
 {name:'Astraea',student_year_prefix:'2023',year_level:'4th',theme_color:'#401268',logo_path:'/logos/astraea.png',is_active:true},
 {name:'Solaris',student_year_prefix:'2024',year_level:'3rd',theme_color:'#7a0000',logo_path:'/logos/solaris.png',is_active:true},
]

export function fallbackBatch(name:string){return defaultBatchConfigs.find(batch=>batch.name===name)}
