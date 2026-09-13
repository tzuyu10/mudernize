export type DashboardMetricIconName='pending'|'approved'|'ongoing'|'completed'|'total'|'students'|'review'|'seats'

const paths:Record<DashboardMetricIconName,React.ReactNode>={
 pending:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 1.8"/></>,
 approved:<><path d="M12 3.5 19 6v5.5c0 4.4-3 7.2-7 9-4-1.8-7-4.6-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></>,
 ongoing:<><path d="M19 8a7.5 7.5 0 0 0-12.8-2L4 8"/><path d="M4 4v4h4M5 16a7.5 7.5 0 0 0 12.8 2l2.2-2"/><path d="M20 20v-4h-4"/></>,
 completed:<><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
 total:<><path d="M6 5h12M6 12h12M6 19h12"/><circle cx="3.5" cy="5" r=".7" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="3.5" cy="19" r=".7" fill="currentColor" stroke="none"/></>,
 students:<><circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7a2.5 2.5 0 0 1 0 5M17 14a4.5 4.5 0 0 1 3.5 4.4"/></>,
 review:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h3"/><circle cx="15.5" cy="16.5" r="2.5"/><path d="m17.4 18.4 2.1 2.1"/></>,
 seats:<><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M9 14h6M12 11v6"/></>,
}

export default function DashboardMetricIcon({name}:{name:DashboardMetricIconName}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
