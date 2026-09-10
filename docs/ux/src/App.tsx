import { useState } from 'react'

type Tab = 'home' | 'schedule' | 'map' | 'group'
type Track = 'keynote' | 'tech' | 'design' | 'business' | 'workshop'
type Day = 1 | 2 | 3

interface Activity {
  id: string; title: string; speaker: string; location: string
  track: Track; day: Day; start: string; end: string; description: string
}
interface Member {
  id: string; name: string; initials: string; role: string
  color: string; schedule: string[]; isUser?: boolean
}
interface Venue { id: string; label: string; x: number; y: number; w: number; h: number }

const TRK: Record<Track, { label: string; color: string }> = {
  keynote:  { label: 'Keynote',  color: '#60A5FA' },
  tech:     { label: 'Tech',     color: '#A78BFA' },
  design:   { label: 'Design',   color: '#F472B6' },
  business: { label: 'Business', color: '#FBBF24' },
  workshop: { label: 'Workshop', color: '#34D399' },
}

const DAYS: { num: Day; short: string; date: string }[] = [
  { num: 1, short: 'Day 1', date: 'Sep 22' },
  { num: 2, short: 'Day 2', date: 'Sep 23' },
  { num: 3, short: 'Day 3', date: 'Sep 24' },
]

const ACT: Activity[] = [
  { id:'a1', day:1, start:'09:00', end:'10:30', track:'keynote', location:'Main Stage',
    title:'The Future of Human-Computer Interaction', speaker:'Marisol Chen',
    description:'Opening keynote: spatial computing, ambient AI, and what comes after the screen interface.' },
  { id:'a2', day:1, start:'10:45', end:'11:45', track:'tech', location:'Hall A',
    title:'Building Real-time Systems at Scale', speaker:'Arjun Patel',
    description:'WebSockets, SSE, and event-driven architectures handling millions of concurrent connections.' },
  { id:'a3', day:1, start:'10:45', end:'11:45', track:'design', location:'Hall B',
    title:'Designing for Emerging Interfaces', speaker:'Sofia Reyes',
    description:'Practical frameworks for AR, spatial, and voice-first interaction design.' },
  { id:'a4', day:1, start:'12:00', end:'13:00', track:'workshop', location:'Workshop 1',
    title:'AI-Powered Prototyping Workshop', speaker:'James Kim',
    description:'Build and ship a working prototype in 60 minutes using AI-assisted design and code tools.' },
  { id:'a5', day:1, start:'14:00', end:'15:00', track:'tech', location:'Hall A',
    title:'Rust in Production: Lessons Learned', speaker:'Dmitri Volkov',
    description:'Two years migrating critical microservices from Go to Rust — wins, surprises, and sharp edges.' },
  { id:'a6', day:1, start:'14:00', end:'15:00', track:'business', location:'Hall C',
    title:'Web3 and Enterprise Adoption', speaker:'Laura Müller',
    description:'How enterprise teams are selectively adopting blockchain primitives without buying into the hype.' },
  { id:'a7', day:1, start:'15:15', end:'16:15', track:'design', location:'Hall B',
    title:'Color Theory for Digital Products', speaker:'Nadia Okonkwo',
    description:'From perceptual color science to production-ready design token systems.' },
  { id:'a8', day:1, start:'16:30', end:'17:30', track:'keynote', location:'Main Stage',
    title:'Climate Tech: Building a Sustainable Web', speaker:'Priya Sharma',
    description:'Measuring and reducing the carbon footprint of digital infrastructure at planetary scale.' },
  { id:'b1', day:2, start:'09:00', end:'10:00', track:'keynote', location:'Main Stage',
    title:'The Accessibility Imperative', speaker:'Marcus Johnson',
    description:'Why accessibility is the highest-leverage design decision — and how to get your org to act on it.' },
  { id:'b2', day:2, start:'10:15', end:'11:15', track:'tech', location:'Hall A',
    title:'WebAssembly: The Next Frontier', speaker:'Yuki Tanaka',
    description:'WASM components, the component model, and what near-native browser performance truly unlocks.' },
  { id:'b3', day:2, start:'10:15', end:'11:15', track:'workshop', location:'Workshop 2',
    title:'Performance Optimization Masterclass', speaker:'Elena Kowalski',
    description:'Live profiling: find and fix the five most common performance killers in React apps.' },
  { id:'b4', day:2, start:'11:30', end:'12:30', track:'business', location:'Hall C',
    title:'Startup to Scale: Infrastructure Decisions', speaker:'Rafael Santos',
    description:'When to stay on managed services vs. going bare metal — a cost/control framework.' },
  { id:'b5', day:2, start:'14:00', end:'15:00', track:'design', location:'Hall B',
    title:'Motion Design Systems', speaker:'Amara Diallo',
    description:'Building motion tokens and spring-based animation systems that scale across a product.' },
  { id:'b6', day:2, start:'14:00', end:'15:00', track:'tech', location:'Hall A',
    title:'Edge Computing Patterns', speaker:'Chen Wei',
    description:'Data-fetching, caching, and compute distribution in an edge-first architecture.' },
  { id:'b7', day:2, start:'15:15', end:'16:15', track:'workshop', location:'Workshop 1',
    title:'Live Coding: Build a Distributed System', speaker:'Oscar Lindqvist',
    description:'Start from scratch and ship a working distributed key-value store in 60 minutes.' },
  { id:'b8', day:2, start:'16:30', end:'18:00', track:'keynote', location:'Main Stage',
    title:"What's Next: The 2027 Horizon", speaker:'Panel Discussion',
    description:'Eight industry leaders on technologies, practices, and cultural shifts in the next 18 months.' },
  { id:'c1', day:3, start:'09:00', end:'10:00', track:'workshop', location:'Workshop 1',
    title:'Open Source Contribution Sprint', speaker:'Community',
    description:'Make your first — or fiftieth — open source contribution in a guided, supportive environment.' },
  { id:'c2', day:3, start:'09:00', end:'10:00', track:'business', location:'Hall C',
    title:"VCs on the Record: 2027 Predictions", speaker:'Panel Discussion',
    description:"Five partners from leading funds give uncensored takes on what they will and won't fund next year." },
  { id:'c3', day:3, start:'10:15', end:'11:15', track:'tech', location:'Hall A',
    title:'LLMs in Production: Real Costs', speaker:'Anya Bergström',
    description:'Benchmarks, latency profiles, and cost models for running LLMs at scale across five providers.' },
  { id:'c4', day:3, start:'10:15', end:'11:15', track:'design', location:'Hall B',
    title:'Brand Identity in the Age of AI', speaker:'Kwame Asante',
    description:'How generative tools are reshaping brand workflows — and the irreducible human judgment they require.' },
  { id:'c5', day:3, start:'12:00', end:'13:00', track:'keynote', location:'Main Stage',
    title:'Closing Ceremony & Innovation Awards', speaker:'Nexus Team',
    description:'Celebrating the projects, ideas, and people that defined Nexus Summit 2026.' },
  { id:'c6', day:3, start:'14:00', end:'15:30', track:'workshop', location:'Expo Hall',
    title:'Networking Lab & Demo Floor', speaker:'All Attendees',
    description:'Structured speed networking, live demos from sponsors, and community-led lightning talks.' },
]

const MEM: Member[] = [
  { id:'m0', name:'You', initials:'YO', role:'Full Stack Dev', color:'#A78BFA', isUser:true,
    schedule:['a1','a2','a5','b1','b2','b6','c3','c5'] },
  { id:'m1', name:'Ana García', initials:'AG', role:'UX Designer', color:'#F472B6',
    schedule:['a1','a3','a7','b1','b5','c4','c5'] },
  { id:'m2', name:'Lucas Fernández', initials:'LF', role:'Backend Engineer', color:'#34D399',
    schedule:['a1','a2','a4','b2','b7','c1','c3'] },
  { id:'m3', name:'Maya Patel', initials:'MP', role:'Product Manager', color:'#FBBF24',
    schedule:['a1','a6','a8','b4','b8','c2','c5'] },
  { id:'m4', name:'Tom Wilson', initials:'TW', role:'Dev Advocate', color:'#60A5FA',
    schedule:['a1','a4','a8','b1','b3','b8','c6'] },
]

const VENUES: Venue[] = [
  { id:'main-stage', label:'Main Stage',  x:30,  y:30,  w:225, h:148 },
  { id:'hall-a',     label:'Hall A',      x:293, y:30,  w:148, h:95  },
  { id:'hall-b',     label:'Hall B',      x:293, y:163, w:148, h:95  },
  { id:'hall-c',     label:'Hall C',      x:293, y:296, w:148, h:95  },
  { id:'workshop-1', label:'Workshop 1',  x:30,  y:223, w:118, h:75  },
  { id:'workshop-2', label:'Workshop 2',  x:30,  y:328, w:118, h:75  },
  { id:'lounge',     label:'Lounge',      x:178, y:223, w:85,  h:75  },
  { id:'expo-hall',  label:'Expo Hall',   x:178, y:328, w:263, h:75  },
]

const LOC_ID: Record<string,string> = {
  'Main Stage':'main-stage','Hall A':'hall-a','Hall B':'hall-b','Hall C':'hall-c',
  'Workshop 1':'workshop-1','Workshop 2':'workshop-2','Lounge':'lounge','Expo Hall':'expo-hall',
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function TrackBadge({ track }: { track: Track }) {
  const { label, color } = TRK[track]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:99, background:`${color}18`, color,
      fontSize:11, fontWeight:600, letterSpacing:'0.03em', fontFamily:"'Inter',sans-serif" }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, display:'inline-block' }}/>
      {label}
    </span>
  )
}

// ── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({ act, attending, onToggle, expanded, onExpand, group }:{
  act: Activity; attending: boolean; onToggle:()=>void
  expanded: boolean; onExpand:()=>void; group?: Member[]
}) {
  const { color } = TRK[act.track]
  return (
    <div onClick={onExpand}
      style={{ background:'#131626', borderRadius:12, overflow:'hidden', cursor:'pointer',
        borderLeft:`3px solid ${color}`, border:`1px solid rgba(255,255,255,0.06)`,
        borderLeftColor:color, borderLeftWidth:3, transition:'box-shadow 0.2s' }}>
      <div style={{ padding:'14px 14px 14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ minWidth:54, fontFamily:"'JetBrains Mono',monospace",
          fontSize:11, color:'#4B5563', lineHeight:1.5, paddingTop:2, flexShrink:0 }}>
          <div style={{ color:'#64748B' }}>{act.start}</div>
          <div style={{ opacity:0.55 }}>{act.end}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
            <TrackBadge track={act.track} />
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'#E2E8F0', lineHeight:1.35, marginBottom:4 }}>
            {act.title}
          </div>
          <div style={{ fontSize:12, color:'#94A3B8', marginBottom:4 }}>{act.speaker}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#475569' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {act.location}
          </div>
          {group && group.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:8 }}>
              {group.map(m => (
                <div key={m.id} title={m.name}
                  style={{ width:22, height:22, borderRadius:'50%', background:m.color+'30',
                    border:`1px solid ${m.color}60`, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:8, fontWeight:700, color:m.color, flexShrink:0 }}>
                  {m.initials}
                </div>
              ))}
              <span style={{ fontSize:11, color:'#475569', marginLeft:4 }}>{group.length} in group</span>
            </div>
          )}
        </div>
        <button onClick={e=>{e.stopPropagation();onToggle()}}
          style={{ width:30, height:30, borderRadius:'50%', border:'none', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            background: attending ? '#8B5CF620' : 'rgba(255,255,255,0.05)',
            color: attending ? '#A78BFA' : '#475569', transition:'all 0.2s' }}>
          {attending ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          )}
        </button>
      </div>
      {expanded && (
        <div style={{ padding:'0 16px 14px 82px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize:13, color:'#94A3B8', lineHeight:1.65, margin:'12px 0 0' }}>
            {act.description}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Day Tabs ──────────────────────────────────────────────────────────────────

function DayTabs({ active, onChange }: { active: Day; onChange:(d:Day)=>void }) {
  return (
    <div style={{ display:'flex', gap:6 }}>
      {DAYS.map(d => (
        <button key={d.num} onClick={()=>onChange(d.num)}
          style={{ flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer',
            fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, transition:'all 0.2s',
            background: active===d.num ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
            color: active===d.num ? '#fff' : '#64748B' }}>
          <div>{d.short}</div>
          <div style={{ fontSize:10, fontWeight:400, opacity:0.75 }}>{d.date}</div>
        </button>
      ))}
    </div>
  )
}

// ── Home Tab ──────────────────────────────────────────────────────────────────

function HomeTab({ mySchedule, setTab }: { mySchedule: string[]; setTab:(t:Tab)=>void }) {
  const myDay1 = ACT.filter(a => a.day===1 && mySchedule.includes(a.id))
  const nextAct = myDay1[0] ?? null

  return (
    <div>
      {/* Hero */}
      <div style={{
        background:'linear-gradient(145deg, #1a0a3a 0%, #0d1a3a 50%, #07111f 100%)',
        padding:'28px 20px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200,
          borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:-30, left:40, width:140, height:140,
          borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#34D399', display:'inline-block',
              boxShadow:'0 0 8px #34D399' }}/>
            <span style={{ fontSize:11, color:'#34D399', fontWeight:600, letterSpacing:'0.08em', fontFamily:"'JetBrains Mono',monospace" }}>
              LIVE · SEP 22–24 · BARCELONA
            </span>
          </div>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:30, fontWeight:800,
            color:'#fff', lineHeight:1.15, margin:'0 0 6px',
            background:'linear-gradient(135deg, #fff 40%, rgba(167,139,250,0.8))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Nexus Summit<br/>2026
          </h1>
          <p style={{ fontSize:13, color:'rgba(148,163,184,0.85)', margin:0 }}>
            The conference for builders shaping what comes next.
          </p>
        </div>
      </div>

      <div style={{ padding:'0 16px 20px' }}>
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, margin:'16px 0' }}>
          {[
            { label:'Activities', value:ACT.length },
            { label:'My Schedule', value:mySchedule.length },
            { label:'Group Size', value:MEM.length },
          ].map(s => (
            <div key={s.label} style={{ background:'#131626', borderRadius:12,
              border:'1px solid rgba(255,255,255,0.06)', padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:24, fontWeight:700, color:'#E2E8F0' }}>
                {s.value}
              </div>
              <div style={{ fontSize:11, color:'#4B5563', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Next up */}
        {nextAct && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#64748B', fontWeight:600, letterSpacing:'0.06em',
              textTransform:'uppercase', marginBottom:8 }}>Next Up · Day 1</div>
            <div style={{ background:'linear-gradient(135deg, #1d1040 0%, #131626 100%)',
              borderRadius:14, padding:16, border:'1px solid rgba(139,92,246,0.2)',
              boxShadow:'0 0 30px rgba(139,92,246,0.06)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <TrackBadge track={nextAct.track} />
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700,
                    color:'#E2E8F0', margin:'8px 0 4px', lineHeight:1.3 }}>{nextAct.title}</div>
                  <div style={{ fontSize:12, color:'#94A3B8' }}>{nextAct.speaker}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                      color:'#A78BFA', fontWeight:500 }}>{nextAct.start} → {nextAct.end}</span>
                    <span style={{ fontSize:11, color:'#475569' }}>· {nextAct.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today highlights */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'#64748B', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Today — Day 1
            </div>
            <button onClick={()=>setTab('schedule')}
              style={{ fontSize:12, color:'#8B5CF6', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              View all →
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ACT.filter(a => a.day===1).slice(0,4).map(act => {
              const groupHere = MEM.filter(m => !m.isUser && m.schedule.includes(act.id))
              return (
                <div key={act.id}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    background:'#131626', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)',
                    borderLeft:`2px solid ${TRK[act.track].color}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4B5563', minWidth:40 }}>
                    {act.start}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#CBD5E1', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{act.title}</div>
                    <div style={{ fontSize:11, color:'#4B5563' }}>{act.location}</div>
                  </div>
                  {groupHere.length > 0 && (
                    <div style={{ display:'flex' }}>
                      {groupHere.slice(0,3).map((m,i) => (
                        <div key={m.id}
                          style={{ width:20, height:20, borderRadius:'50%', background:m.color+'25',
                            border:`1px solid ${m.color}50`, display:'flex', alignItems:'center',
                            justifyContent:'center', fontSize:7, fontWeight:700, color:m.color,
                            marginLeft: i>0 ? -6 : 0 }}>
                          {m.initials}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Group preview */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'#64748B', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Your Group
            </div>
            <button onClick={()=>setTab('group')}
              style={{ fontSize:12, color:'#8B5CF6', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              Schedules →
            </button>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {MEM.map(m => (
              <div key={m.id} style={{ flex:1, background:'#131626', borderRadius:12,
                border:'1px solid rgba(255,255,255,0.06)', padding:'12px 10px', textAlign:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:m.color+'22',
                  border:`1.5px solid ${m.color}50`, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:11, fontWeight:700, color:m.color, margin:'0 auto 6px' }}>
                  {m.initials}
                </div>
                <div style={{ fontSize:10, color:'#94A3B8', fontWeight:500, lineHeight:1.2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {m.isUser ? 'You' : m.name.split(' ')[0]}
                </div>
                <div style={{ fontSize:9, color:'#4B5563', marginTop:2 }}>{m.schedule.length} acts.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ mySchedule, onToggle }: { mySchedule: string[]; onToggle:(id:string)=>void }) {
  const [day, setDay] = useState<Day>(1)
  const [trackFilter, setTrackFilter] = useState<Track|'all'>('all')
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [showMine, setShowMine] = useState(false)

  const filtered = ACT.filter(a =>
    a.day === day &&
    (trackFilter === 'all' || a.track === trackFilter) &&
    (!showMine || mySchedule.includes(a.id))
  )

  return (
    <div style={{ padding:'16px 16px 8px' }}>
      <DayTabs active={day} onChange={d=>{setDay(d);setExpandedId(null)}} />

      {/* Track filters */}
      <div style={{ display:'flex', gap:6, marginTop:12, overflowX:'auto', paddingBottom:4 }}>
        <button onClick={()=>setTrackFilter('all')}
          style={{ padding:'6px 12px', borderRadius:99, border:'none', cursor:'pointer',
            fontSize:11, fontWeight:600, fontFamily:"'Inter',sans-serif", flexShrink:0,
            background: trackFilter==='all' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            color: trackFilter==='all' ? '#E2E8F0' : '#4B5563' }}>
          All
        </button>
        {(Object.entries(TRK) as [Track, typeof TRK[Track]][]).map(([k,v]) => (
          <button key={k} onClick={()=>setTrackFilter(k)}
            style={{ padding:'6px 12px', borderRadius:99, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:600, fontFamily:"'Inter',sans-serif", flexShrink:0,
              background: trackFilter===k ? `${v.color}20` : 'rgba(255,255,255,0.04)',
              color: trackFilter===k ? v.color : '#4B5563', transition:'all 0.2s' }}>
            {v.label}
          </button>
        ))}
        <button onClick={()=>setShowMine(!showMine)}
          style={{ padding:'6px 12px', borderRadius:99, border:'none', cursor:'pointer',
            fontSize:11, fontWeight:600, fontFamily:"'Inter',sans-serif", flexShrink:0,
            background: showMine ? '#8B5CF620' : 'rgba(255,255,255,0.04)',
            color: showMine ? '#A78BFA' : '#4B5563', transition:'all 0.2s' }}>
          My Schedule
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', color:'#4B5563', fontSize:13, padding:'32px 0' }}>
            No activities match your filters.
          </div>
        )}
        {filtered.map(act => {
          const groupHere = MEM.filter(m => !m.isUser && m.schedule.includes(act.id))
          return (
            <ActivityCard key={act.id} act={act}
              attending={mySchedule.includes(act.id)}
              onToggle={()=>onToggle(act.id)}
              expanded={expandedId===act.id}
              onExpand={()=>setExpandedId(expandedId===act.id ? null : act.id)}
              group={groupHere} />
          )
        })}
      </div>
    </div>
  )
}

// ── Map Tab ───────────────────────────────────────────────────────────────────

function MapTab({ mySchedule }: { mySchedule: string[] }) {
  const [day, setDay] = useState<Day>(1)
  const [selected, setSelected] = useState<string|null>(null)

  const dayActs = ACT.filter(a => a.day === day)
  const venueActivity = (venueId: string) => dayActs.find(a => LOC_ID[a.location] === venueId)

  const selectedVenue = VENUES.find(v => v.id === selected)
  const selectedActs = selected ? dayActs.filter(a => LOC_ID[a.location] === selected) : []

  return (
    <div style={{ padding:'16px' }}>
      <DayTabs active={day} onChange={d=>{setDay(d);setSelected(null)}} />

      <div style={{ marginTop:16, background:'#0f1420', borderRadius:14,
        border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
        {/* Legend */}
        <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)',
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'#4B5563', fontWeight:600, marginRight:4 }}>LEGEND</span>
          {(Object.entries(TRK) as [Track, typeof TRK[Track]][]).map(([k,v]) => (
            <span key={k} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10 }}>
              <span style={{ width:8, height:8, borderRadius:2, background:v.color+'40', border:`1px solid ${v.color}`, display:'inline-block' }}/>
              <span style={{ color:'#64748B' }}>{v.label}</span>
            </span>
          ))}
        </div>

        {/* SVG Map */}
        <svg viewBox="0 0 471 415" width="100%" style={{ display:'block' }}
          xmlns="http://www.w3.org/2000/svg">
          {/* Corridor fills */}
          <rect x="0" y="0" width="471" height="415" fill="#0a0e1a"/>
          <rect x="20" y="20" width="451" height="385" rx="4" fill="#0d1222"/>
          {/* Corridors (lighter paths) */}
          <rect x="255" y="20" width="18" height="385" fill="#0f1628" opacity="0.6"/>
          <rect x="20" y="188" width="451" height="18" fill="#0f1628" opacity="0.6"/>
          <rect x="20" y="298" width="451" height="18" fill="#0f1628" opacity="0.6"/>
          <rect x="148" y="20" width="18" height="188" fill="#0f1628" opacity="0.4"/>

          {/* Rooms */}
          {VENUES.map(v => {
            const act = venueActivity(v.id)
            const isSelected = selected === v.id
            const trackColor = act ? TRK[act.track].color : null
            const hasMyAct = act ? mySchedule.includes(act.id) : false

            return (
              <g key={v.id} onClick={() => setSelected(isSelected ? null : v.id)}
                style={{ cursor:'pointer' }}>
                <rect x={v.x} y={v.y} width={v.w} height={v.h} rx={6}
                  fill={isSelected ? (trackColor ? `${trackColor}22` : '#1a2040') : (trackColor ? `${trackColor}10` : '#121830')}
                  stroke={isSelected ? (trackColor || '#8B5CF6') : (trackColor ? `${trackColor}50` : 'rgba(255,255,255,0.08)')}
                  strokeWidth={isSelected ? 1.5 : 1}/>
                {hasMyAct && (
                  <circle cx={v.x + v.w - 10} cy={v.y + 10} r={4} fill="#A78BFA"/>
                )}
                <text x={v.x + v.w/2} y={v.y + v.h/2 - (act ? 8 : 0)}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={trackColor || 'rgba(255,255,255,0.3)'}
                  fontSize={11} fontWeight="600" fontFamily="'Inter',sans-serif">
                  {v.label}
                </text>
                {act && (
                  <text x={v.x + v.w/2} y={v.y + v.h/2 + 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.35)" fontSize={9}
                    fontFamily="'Inter',sans-serif">
                    {act.start}–{act.end}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected venue detail */}
      {selected && selectedVenue && (
        <div style={{ marginTop:12, background:'#131626', borderRadius:14,
          border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:'#E2E8F0' }}>
              {selectedVenue.label}
            </div>
            <div style={{ fontSize:12, color:'#4B5563', marginTop:2 }}>
              {selectedActs.length === 0 ? 'No sessions scheduled' : `${selectedActs.length} session${selectedActs.length>1?'s':''} · Day ${day}`}
            </div>
          </div>
          {selectedActs.length === 0 ? (
            <div style={{ padding:'20px 16px', textAlign:'center', color:'#4B5563', fontSize:13 }}>
              This space is free on Day {day}.
            </div>
          ) : (
            <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
              {selectedActs.map(act => (
                <div key={act.id}
                  style={{ display:'flex', alignItems:'flex-start', gap:12,
                    padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:10,
                    borderLeft:`2px solid ${TRK[act.track].color}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                    color:'#64748B', minWidth:54, paddingTop:2 }}>
                    {act.start}<br/><span style={{ opacity:0.6 }}>{act.end}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <TrackBadge track={act.track} />
                    <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0', marginTop:6, lineHeight:1.3 }}>{act.title}</div>
                    <div style={{ fontSize:12, color:'#94A3B8', marginTop:3 }}>{act.speaker}</div>
                    {mySchedule.includes(act.id) && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6,
                        fontSize:11, color:'#A78BFA' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        In your schedule
                      </div>
                    )}
                    {/* Group members also attending */}
                    {(() => {
                      const grp = MEM.filter(m => !m.isUser && m.schedule.includes(act.id))
                      return grp.length > 0 ? (
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                          {grp.map(m => (
                            <div key={m.id} title={m.name}
                              style={{ width:18, height:18, borderRadius:'50%', background:m.color+'25',
                                border:`1px solid ${m.color}50`, display:'flex', alignItems:'center',
                                justifyContent:'center', fontSize:7, fontWeight:700, color:m.color }}>
                              {m.initials}
                            </div>
                          ))}
                          <span style={{ fontSize:10, color:'#4B5563' }}>{grp.map(m=>m.name.split(' ')[0]).join(', ')}</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Venue list when nothing selected */}
      {!selected && (
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:11, color:'#4B5563', fontWeight:600, letterSpacing:'0.06em',
            textTransform:'uppercase', marginBottom:4 }}>All Venues · Day {day}</div>
          {VENUES.map(v => {
            const act = venueActivity(v.id)
            return (
              <button key={v.id} onClick={()=>setSelected(v.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                  background:'#131626', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)',
                  cursor:'pointer', textAlign:'left', width:'100%',
                  borderLeft: act ? `2px solid ${TRK[act.track].color}` : '2px solid rgba(255,255,255,0.08)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#CBD5E1' }}>{v.label}</div>
                  {act ? (
                    <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>
                      {act.start}–{act.end} · {act.title.slice(0,35)}{act.title.length>35?'…':''}
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'#374151' }}>No session scheduled</div>
                  )}
                </div>
                {act && <TrackBadge track={act.track} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Group Tab ─────────────────────────────────────────────────────────────────

function GroupTab({ mySchedule }: { mySchedule: string[] }) {
  const [day, setDay] = useState<Day>(1)
  const [focus, setFocus] = useState<string>('m0')
  const [expandedId, setExpandedId] = useState<string|null>(null)

  const focused = MEM.find(m => m.id === focus)!
  const me = MEM[0]
  const dayActs = ACT.filter(a => a.day === day)

  const shared = focused.isUser
    ? dayActs.filter(a => mySchedule.includes(a.id))
    : dayActs.filter(a => mySchedule.includes(a.id) && focused.schedule.includes(a.id))

  const onlyThem = focused.isUser ? [] : dayActs.filter(a =>
    !mySchedule.includes(a.id) && focused.schedule.includes(a.id))

  const onlyMe = focused.isUser ? [] : dayActs.filter(a =>
    mySchedule.includes(a.id) && !focused.schedule.includes(a.id))

  return (
    <div style={{ padding:'16px' }}>
      {/* Member selector */}
      <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
        {MEM.map(m => {
          const isActive = focus === m.id
          return (
            <button key={m.id} onClick={()=>setFocus(m.id)}
              style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
                gap:4, padding:'10px 12px', borderRadius:12, border:'none', cursor:'pointer',
                background: isActive ? `${m.color}18` : 'rgba(255,255,255,0.04)',
                outline: isActive ? `1.5px solid ${m.color}60` : '1.5px solid transparent',
                transition:'all 0.2s' }}>
              <div style={{ width:38, height:38, borderRadius:'50%',
                background: isActive ? `${m.color}30` : `${m.color}15`,
                border:`1.5px solid ${isActive ? m.color : m.color+'40'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, color:m.color }}>
                {m.initials}
              </div>
              <div style={{ fontSize:10, color: isActive ? m.color : '#64748B',
                fontWeight: isActive ? 600 : 400, whiteSpace:'nowrap' }}>
                {m.isUser ? 'You' : m.name.split(' ')[0]}
              </div>
            </button>
          )
        })}
      </div>

      <DayTabs active={day} onChange={d=>{setDay(d);setExpandedId(null)}} />

      {/* Profile card */}
      <div style={{ marginTop:14, padding:'14px 16px', background:'#131626',
        borderRadius:14, border:'1px solid rgba(255,255,255,0.07)',
        borderTop:`2px solid ${focused.color}`, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:`${focused.color}25`,
            border:`2px solid ${focused.color}60`, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:14, fontWeight:700, color:focused.color }}>
            {focused.initials}
          </div>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:'#E2E8F0' }}>
              {focused.isUser ? 'Your Schedule' : focused.name}
            </div>
            <div style={{ fontSize:12, color:'#64748B' }}>{focused.role}</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:20, fontWeight:700, color:focused.color }}>
              {focused.isUser ? mySchedule.filter(id => ACT.find(a=>a.id===id&&a.day===day)).length
                : focused.schedule.filter(id => ACT.find(a=>a.id===id&&a.day===day)).length}
            </div>
            <div style={{ fontSize:10, color:'#4B5563' }}>sessions</div>
          </div>
        </div>
        {!focused.isUser && (
          <div style={{ display:'flex', gap:16, marginTop:12, paddingTop:12,
            borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:'#A78BFA', fontFamily:"'Outfit',sans-serif" }}>{shared.length}</div>
              <div style={{ fontSize:10, color:'#4B5563' }}>Shared</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:focused.color, fontFamily:"'Outfit',sans-serif" }}>{onlyThem.length}</div>
              <div style={{ fontSize:10, color:'#4B5563' }}>Only them</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:'#60A5FA', fontFamily:"'Outfit',sans-serif" }}>{onlyMe.length}</div>
              <div style={{ fontSize:10, color:'#4B5563' }}>Only you</div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule sections */}
      {focused.isUser ? (
        <div>
          <div style={{ fontSize:11, color:'#64748B', fontWeight:600, letterSpacing:'0.06em',
            textTransform:'uppercase', marginBottom:10 }}>Your Day {day} Schedule</div>
          {shared.length === 0 && (
            <div style={{ textAlign:'center', color:'#4B5563', fontSize:13, padding:'24px 0' }}>
              Nothing added for Day {day} yet.
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {shared.map(act => {
              const grp = MEM.filter(m => !m.isUser && m.schedule.includes(act.id))
              return (
                <ActivityCard key={act.id} act={act}
                  attending={mySchedule.includes(act.id)}
                  onToggle={()=>{}}
                  expanded={expandedId===act.id}
                  onExpand={()=>setExpandedId(expandedId===act.id?null:act.id)}
                  group={grp} />
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {shared.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:'#A78BFA', fontWeight:600,
                letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8,
                display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#A78BFA', display:'inline-block' }}/>
                Shared sessions
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {shared.map(act => (
                  <ActivityCard key={act.id} act={act}
                    attending={true} onToggle={()=>{}}
                    expanded={expandedId===act.id}
                    onExpand={()=>setExpandedId(expandedId===act.id?null:act.id)} />
                ))}
              </div>
            </div>
          )}
          {onlyThem.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:focused.color, fontWeight:600,
                letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8,
                display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:focused.color, display:'inline-block' }}/>
                {focused.name.split(' ')[0]}'s sessions
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {onlyThem.map(act => (
                  <div key={act.id} style={{ opacity:0.7 }}>
                    <ActivityCard act={act}
                      attending={false} onToggle={()=>{}}
                      expanded={expandedId===act.id}
                      onExpand={()=>setExpandedId(expandedId===act.id?null:act.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {onlyMe.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:'#60A5FA', fontWeight:600,
                letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8,
                display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#60A5FA', display:'inline-block' }}/>
                Your solo sessions
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {onlyMe.map(act => (
                  <ActivityCard key={act.id} act={act}
                    attending={true} onToggle={()=>{}}
                    expanded={expandedId===act.id}
                    onExpand={()=>setExpandedId(expandedId===act.id?null:act.id)} />
                ))}
              </div>
            </div>
          )}
          {shared.length === 0 && onlyThem.length === 0 && onlyMe.length === 0 && (
            <div style={{ textAlign:'center', color:'#4B5563', fontSize:13, padding:'24px 0' }}>
              No sessions scheduled for Day {day}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

function NavBtn({ active, onClick, children, label }:{
  active:boolean; onClick:()=>void; children:React.ReactNode; label:string
}) {
  return (
    <button onClick={onClick}
      style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', gap:4, padding:'8px 0', background:'none', border:'none',
        cursor:'pointer', color: active ? '#A78BFA' : '#374151', transition:'color 0.2s' }}>
      {children}
      <span style={{ fontSize:10, fontWeight: active ? 600 : 400, fontFamily:"'Inter',sans-serif" }}>
        {label}
      </span>
    </button>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [mySchedule, setMySchedule] = useState<string[]>(MEM[0].schedule)

  const toggleActivity = (id: string) =>
    setMySchedule(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{ minHeight:'100%', background:'#070910',
      display:'flex', justifyContent:'center', alignItems:'flex-start' }}>
      {/* Outer glow on large screens */}
      <div style={{ width:'100%', maxWidth:480, minHeight:'100vh', position:'relative',
        background:'#080b14', display:'flex', flexDirection:'column',
        boxShadow:'0 0 80px rgba(139,92,246,0.04)' }}>

        {/* Header */}
        <header style={{ padding:'14px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(8,11,20,0.95)', backdropFilter:'blur(10px)',
          position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8,
              background:'linear-gradient(135deg, #7C3AED, #3B82F6)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:16, color:'#E2E8F0' }}>
              Nexus<span style={{ color:'#8B5CF6' }}>'26</span>
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#4B5563' }}>
              {mySchedule.length} saved
            </span>
            <div style={{ width:30, height:30, borderRadius:'50%',
              background:'linear-gradient(135deg, #A78BFA33, #60A5FA22)',
              border:'1.5px solid rgba(167,139,250,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:700, color:'#A78BFA' }}>
              YO
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', paddingBottom:72 }}>
          {tab === 'home'     && <HomeTab mySchedule={mySchedule} setTab={setTab} />}
          {tab === 'schedule' && <ScheduleTab mySchedule={mySchedule} onToggle={toggleActivity} />}
          {tab === 'map'      && <MapTab mySchedule={mySchedule} />}
          {tab === 'group'    && <GroupTab mySchedule={mySchedule} />}
        </main>

        {/* Bottom Nav */}
        <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:'100%', maxWidth:480, display:'flex',
          background:'rgba(8,11,20,0.96)', backdropFilter:'blur(16px)',
          borderTop:'1px solid rgba(255,255,255,0.06)', paddingBottom:'env(safe-area-inset-bottom,0px)', zIndex:20 }}>
          <NavBtn active={tab==='home'} onClick={()=>setTab('home')} label="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </NavBtn>
          <NavBtn active={tab==='schedule'} onClick={()=>setTab('schedule')} label="Schedule">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </NavBtn>
          <NavBtn active={tab==='map'} onClick={()=>setTab('map')} label="Map">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </NavBtn>
          <NavBtn active={tab==='group'} onClick={()=>setTab('group')} label="Group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </NavBtn>
        </nav>
      </div>
    </div>
  )
}
