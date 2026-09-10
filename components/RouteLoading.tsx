export default function RouteLoading() {
 return <div aria-live="polite" aria-busy="true" className="route-loading">
  <span className="route-loading-bar"/>
  <div className="route-loading-title"/>
  <div className="route-loading-grid">{Array.from({length:4},(_,index)=><span key={index}/>)}</div>
  <span className="sr-only">Loading page</span>
 </div>
}
