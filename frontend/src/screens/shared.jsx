// GymBro app — shared tokens, primitives, icons, taxonomy.
// Colors are CSS variables so the dark/light toggle flips the whole app.
const { useState, useEffect, useRef } = React;

/* ── Tokens (CSS vars defined on the frame; see index.html) ── */
const BG='var(--gb-bg)', CARD='var(--gb-surface)', ELEV='var(--gb-elev)', INPUT='var(--gb-input)';
const OW='var(--gb-invert)';                 // contrast fill (bone in dark, near-black in light)
const OI='var(--gb-oninvert)';               // text/icon color on top of an OW-filled surface
const SAGE='#9FD89A', STEEL='#8AA2C0', AMBER='#C4963A', NEUTRAL='#8A8A8E';
const BORDER='var(--gb-border)', BDEF='var(--gb-def)', BSTRONG='var(--gb-strong)';
const TEXT1='var(--gb-text1)', TEXT2='var(--gb-text2)', TEXT3='var(--gb-text3)';
const R=8;                                    // global card/button radius
const UI='var(--font-ui)';
const DSP='var(--font-display)';
const MONO='var(--font-mono)';
const ISO_SRC='isotype-mask.png', ISO_RATIO=361/257;

/* ── Muscle taxonomy ─────────────────────────────────── */
const TAXONOMY = {
  'Tren Superior': {
    'Pecho': ['Press banca','Press inclinado','Aperturas','Fondos'],
    'Espalda': ['Jalón al pecho','Remo con barra','Dominadas','Remo en polea','Peso muerto'],
    'Bíceps': ['Curl con barra','Curl martillo','Curl concentrado','Curl en polea'],
    'Tríceps': ['Press francés','Extensión en polea','Fondos en banco','Patada de tríceps'],
    'Hombros': ['Press militar','Elevaciones laterales','Elevaciones frontales','Pájaros'],
    'Antebrazos': ['Curl de muñeca','Extensión de muñeca'],
  },
  'Tren Inferior': {
    'Cuádriceps': ['Sentadilla','Prensa de pierna','Extensión de cuádriceps','Zancadas','Hack squat'],
    'Isquiotibiales': ['Peso muerto rumano','Curl femoral','Buenos días'],
    'Glúteos': ['Hip thrust','Patada de glúteo','Sentadilla sumo'],
    'Pantorrillas': ['Elevación de talones de pie','Elevación de talones sentado'],
    'Aductores': ['Aductor en máquina','Sentadilla sumo'],
    'Abductores': ['Abductor en máquina','Elevación lateral de pierna'],
  },
  'Core': {
    'Abdominales': ['Crunch','Crunch en polea','Elevación de piernas','Plancha'],
    'Lumbares': ['Hiperextensión','Superman','Peso muerto'],
  },
};

/* ── Icons (currentColor so CSS-var tints resolve) ───── */
function Icon({name,size=22,color=TEXT1,sw=1.5}){
  const p={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round',style:{display:'block',color}};
  switch(name){
    case 'home': return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
    case 'dumbbell': return <svg {...p}><path d="M6.5 6.5l11 11"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/><path d="M18 22l4-4"/><path d="M2 6l4-4"/><path d="M3 10l7-7"/><path d="M14 21l7-7"/></svg>;
    case 'chart': return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'person': return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'people': return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
    case 'back': return <svg {...p}><polyline points="15,18 9,12 15,6"/></svg>;
    case 'chevron-right': return <svg {...p}><polyline points="9,18 15,12 9,6"/></svg>;
    case 'chevron-down': return <svg {...p}><polyline points="6,9 12,15 18,9"/></svg>;
    case 'plus': return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'minus': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'check': return <svg {...p}><polyline points="20,6 9,17 4,12"/></svg>;
    case 'pencil': return <svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>;
    case 'lock': return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
    case 'unlock': return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>;
    case 'play': return <svg {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>;
    case 'message': return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case 'bell': return <svg {...p}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
    case 'dots': return <svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
    case 'ruler': return <svg {...p}><path d="M21.3 8.7L8.7 21.3a1 1 0 01-1.4 0l-4.6-4.6a1 1 0 010-1.4L15.3 2.7a1 1 0 011.4 0l4.6 4.6a1 1 0 010 1.4z"/><path d="M14.5 12.5l-2 2M11.5 9.5l-2 2M8.5 6.5l-2 2M17.5 15.5l-2 2"/></svg>;
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'logout': return <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case 'star': return <svg {...p}><polygon points="12,2 15.1,8.6 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.6"/></svg>;
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'moon': return <svg {...p}><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>;
    case 'qr': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 14v.01M14 20v.01M20 20v.01M17 17v.01M20 17h.01M17 20h.01"/></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'crown': return <svg {...p}><path d="M2 18h20M3 8l4 4 5-7 5 7 4-4-2 10H5z"/></svg>;
    default: return <svg {...p}></svg>;
  }
}

/* ── Isotype (traced brand mark, inline SVG — tintable, renders anywhere) ── */
function Isotype({h=22,color='var(--gb-text1)'}){
  const iso=window.GB_ISOTYPE;
  return <svg viewBox={iso.vb} height={h} width={h*ISO_RATIO} style={{display:'block',flexShrink:0}} aria-hidden="true"><path d={iso.d} fill={color}/></svg>;
}
function Logo({size=20,color='var(--gb-text1)'}){
  return <div style={{display:'flex',alignItems:'center',gap:size*0.5}}>
    <span style={{fontFamily:UI,fontWeight:300,fontSize:size,color,letterSpacing:'-0.03em',lineHeight:1}}>gymbro</span>
    <Isotype h={size*0.82} color={color}/>
  </div>;
}

/* ── ThemeToggle (pill switch, sun/moon) ─────────────── */
function ThemeToggle({light,onToggle}){
  return(
    <button onClick={onToggle} aria-label="Cambiar tema" style={{width:56,height:30,borderRadius:999,background:OW,border:'none',cursor:'pointer',position:'relative',padding:0,outline:'none',flexShrink:0}}>
      <span style={{position:'absolute',top:3,left:light?29:3,width:24,height:24,borderRadius:'50%',background:'var(--gb-bg)',display:'flex',alignItems:'center',justifyContent:'center',transition:'left 220ms cubic-bezier(0.16,1,0.30,1)'}}>
        <Icon name={light?'sun':'moon'} size={14} color={'var(--gb-text1)'} sw={1.8}/>
      </span>
    </button>
  );
}

/* ── StatusBar ───────────────────────────────────────── */
function StatusBar(){
  return(
    <div style={{height:48,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',fontFamily:UI,fontWeight:600,fontSize:15,color:TEXT1,flexShrink:0}}>
      <span>9:41</span>
      <div style={{display:'flex',gap:6,alignItems:'center',color:TEXT1}}>
        <svg width="16" height="11" viewBox="0 0 16 11" style={{fill:'currentColor'}}><rect x="0" y="4" width="2.5" height="7" rx=".8"/><rect x="4" y="2.5" width="2.5" height="8.5" rx=".8"/><rect x="8" y="1" width="2.5" height="10" rx=".8"/><rect x="12" y="0" width="2.5" height="11" rx=".8"/></svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" style={{stroke:'currentColor'}} strokeWidth="1.4" strokeLinecap="round"><path d="M7.5 4.5c-1.5 0-2.8.6-3.7 1.6"/><path d="M11.2 6.1C10.3 5.1 9 4.5 7.5 4.5"/><path d="M5.5 8c.5-.6 1.2-1 2-1s1.5.4 2 1"/><circle cx="7.5" cy="10" r="1" style={{fill:'currentColor'}}/></svg>
        <div style={{width:24,height:12,border:`1.5px solid currentColor`,borderRadius:3,padding:'1.5px'}}>
          <div style={{height:'100%',width:'75%',background:'currentColor',borderRadius:1}}></div>
        </div>
      </div>
    </div>
  );
}

/* ── TabBar — 5 tabs, center = GymBro isotype ────────── */
function TabBar({active,onTab}){
  const tabs=[{id:'inicio',l:'Inicio',ic:'home'},{id:'entrena',l:'Entrena',ic:'dumbbell'},{id:'gymbro',l:'GymBro',iso:true},{id:'progreso',l:'Progreso',ic:'chart'},{id:'perfil',l:'Perfil',ic:'person'}];
  return(
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:83,background:'var(--gb-tabbar)',borderTop:`1px solid ${BORDER}`,display:'flex',alignItems:'flex-start',padding:'12px 4px 0',flexShrink:0,backdropFilter:'blur(12px)'}}>
      {tabs.map(t=>{
        const a=active===t.id;
        const col=a?'var(--gb-text1)':'var(--gb-text3)';
        return(
          <button key={t.id} onClick={()=>onTab(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',padding:'2px 0',outline:'none'}}>
            {t.iso? <Isotype h={22} color={col}/> : <Icon name={t.ic} size={23} color={col}/>}
            <span style={{fontFamily:UI,fontSize:10,color:col,fontWeight:a?500:400}}>{t.l}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── ProgressRing ────────────────────────────────────── */
function ProgressRing({size=120,progress=0.7,value,label,sub,color='sage',sw=5}){
  const [p,setP]=useState(0);
  useEffect(()=>{
    const t0=performance.now();
    const run=()=>{const t=Math.min((performance.now()-t0)/900,1);setP((1-Math.pow(1-t,4))*progress);if(t<1)requestAnimationFrame(run);};
    const id=requestAnimationFrame(run);return()=>cancelAnimationFrame(id);
  },[progress]);
  const r=(size-sw)/2,cx=size/2,cy=size/2,C=2*Math.PI*r,arc=0.75*C,off=-(0.375*C);
  const ac=color==='steel'?STEEL:SAGE;
  const glow=color==='steel'?`drop-shadow(0 0 5px ${STEEL}) drop-shadow(0 0 12px rgba(138,162,192,.5))`:`drop-shadow(0 0 5px ${SAGE}) drop-shadow(0 0 12px rgba(159,216,154,.5))`;
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{display:'block',overflow:'visible'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gb-track)" strokeWidth={sw} strokeDasharray={`${arc} ${C}`} strokeDashoffset={off} strokeLinecap="round"/>
        {p>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={ac} strokeWidth={sw} strokeDasharray={`${p*arc} ${C}`} strokeDashoffset={off} strokeLinecap="round" style={{filter:glow}}/>}
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,pointerEvents:'none'}}>
        {value!==undefined&&<span style={{fontFamily:DSP,fontWeight:700,fontSize:size*.22,color:TEXT1,lineHeight:1,letterSpacing:'-0.01em'}}>{value}</span>}
        {label&&<span style={{fontFamily:MONO,fontSize:size*.09,color:TEXT3,letterSpacing:'0.10em',textTransform:'uppercase'}}>{label}</span>}
        {sub&&<span style={{fontFamily:MONO,fontSize:size*.08,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase'}}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── Calendario ──────────────────────────────────────────
   Tres vistas: mes, semana y dia. `trained` y `planned` llegan como fechas
   ISO completas, no como numeros de dia: una semana puede cruzar dos meses y
   con solo el numero no se sabria a cual pertenece cada casilla. */
function isoDe(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
/* Lunes de la semana de una fecha. getDay() empieza en domingo. */
function lunesDe(d){
  const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  x.setDate(x.getDate()-((x.getDay()+6)%7));
  return x;
}

function Calendar({trained=[],planned=[],selected=null,onDay,anchor,mode='mes'}){
  const hoy=new Date();
  const base=anchor||hoy;
  const hoyISO=isoDe(hoy);
  const marcadas=new Set(trained), planeadas=new Set(planned);
  const dow=['L','M','X','J','V','S','D'];

  /* Celdas a pintar: null es hueco de relleno. */
  let celdas=[];
  if(mode==='mes'){
    const y=base.getFullYear(), m=base.getMonth();
    const hueco=(new Date(y,m,1).getDay()+6)%7;
    const nDias=new Date(y,m+1,0).getDate();
    for(let i=0;i<hueco;i++) celdas.push(null);
    for(let d=1;d<=nDias;d++) celdas.push(new Date(y,m,d));
  }else if(mode==='semana'){
    const l=lunesDe(base);
    for(let i=0;i<7;i++) celdas.push(new Date(l.getFullYear(),l.getMonth(),l.getDate()+i));
  }else{
    celdas=[new Date(base.getFullYear(),base.getMonth(),base.getDate())];
  }

  const Celda=({d,grande})=>{
    if(d===null) return <div></div>;
    const iso=isoDe(d);
    const entrenado=marcadas.has(iso), planificado=planeadas.has(iso);
    const esHoy=iso===hoyISO, elegido=iso===selected;
    let border=`1px solid ${BORDER}`, bg=CARD, ring='none';
    if(planificado) border=`1px solid ${BSTRONG}`;
    if(entrenado) bg='var(--gb-elev)';
    if(elegido) border=`1.5px solid var(--gb-text1)`;
    if(esHoy&&!elegido) ring=`0 0 0 1.5px var(--gb-text1)`;
    return(
      <button onClick={()=>onDay&&onDay(d)}
        style={{position:'relative',aspectRatio:grande?'auto':'1',minHeight:grande?96:undefined,borderRadius:R,background:bg,border,boxShadow:ring,cursor:'pointer',outline:'none',display:'flex',flexDirection:grande?'column':'row',alignItems:'center',justifyContent:'center',gap:grande?6:0,padding:0}}>
        <span style={{fontFamily:grande?DSP:UI,fontWeight:grande?700:(esHoy?600:400),fontSize:grande?30:13,color:entrenado||esHoy||elegido?TEXT1:TEXT2}}>{d.getDate()}</span>
        {grande&&(
          <span style={{fontFamily:UI,fontSize:12.5,color:TEXT2}}>
            {entrenado?'Entrenado':planificado?'Planificado':'Sin sesión'}
          </span>
        )}
        {entrenado&&!grande&&<span style={{position:'absolute',bottom:5,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:SAGE,boxShadow:`0 0 5px ${SAGE}`}}></span>}
        {entrenado&&grande&&<span style={{width:6,height:6,borderRadius:'50%',background:SAGE,boxShadow:`0 0 6px ${SAGE}`}}></span>}
      </button>
    );
  };

  if(mode==='dia') return <div><Celda d={celdas[0]} grande/></div>;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:8}}>
        {dow.map((d,i)=><div key={i} style={{textAlign:'center',fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
        {celdas.map((d,i)=><Celda key={i} d={d}/>)}
      </div>
    </div>
  );
}

/* ── Period toggle (Día / Semana / Mes) ──────────────── */
function PeriodToggle({value,onChange,options=['Día','Semana','Mes']}){
  return(
    <div style={{display:'flex',background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:3}}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)} style={{flex:1,height:30,borderRadius:6,background:value===o?OW:'transparent',border:'none',cursor:'pointer',fontFamily:UI,fontSize:12,fontWeight:value===o?500:400,color:value===o?OI:TEXT2,outline:'none',transition:'all 150ms ease'}}>{o}</button>
      ))}
    </div>
  );
}

/* ── Pill (filter chips — stay rounded) ──────────────── */
function Pill({label,active,onClick,color,chevron}){
  const ac=color||OW;
  return(
    <button onClick={onClick} style={{flexShrink:0,height:34,padding:'0 15px',borderRadius:999,background:active?ac:'transparent',border:`1px solid ${active?ac:BDEF}`,cursor:'pointer',fontFamily:UI,fontSize:12.5,fontWeight:active?500:400,color:active?OI:TEXT2,outline:'none',whiteSpace:'nowrap',transition:'all 150ms ease',display:'flex',alignItems:'center',gap:6}}>
      {label}
      {chevron!==undefined&&<span style={{display:'inline-flex',transition:'transform 200ms ease',transform:chevron?'rotate(180deg)':'rotate(0)'}}><Icon name="chevron-down" size={13} color={active?OI:TEXT2} sw={2}/></span>}
    </button>
  );
}
function PillRow({children}){ return <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:2}}>{children}</div>; }

/* ── Field ───────────────────────────────────────────── */
function Field({label,type='text',placeholder,value,onChange,suffix,prefix,optional}){
  const [f,setF]=useState(false);
  return(
    <div style={{marginBottom:14}}>
      {label&&<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
        <span style={{fontFamily:MONO,fontSize:10,color:f?TEXT2:TEXT3,letterSpacing:'0.14em',textTransform:'uppercase',transition:'color 150ms'}}>{label}</span>
        {optional&&<span style={{fontFamily:UI,fontSize:10,color:TEXT3}}>opcional</span>}
      </div>}
      <div style={{display:'flex',alignItems:'center',gap:7,background:INPUT,border:`1px solid ${f?'rgba(159,216,154,0.5)':BDEF}`,borderRadius:R,height:48,padding:'0 15px',boxShadow:f?'0 0 6px rgba(159,216,154,0.45)':'none',transition:'border-color 150ms,box-shadow 150ms'}}>
        {prefix&&<span style={{fontFamily:UI,fontSize:14,color:TEXT3}}>{prefix}</span>}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{flex:1,background:'transparent',border:'none',outline:'none',color:TEXT1,fontFamily:UI,fontSize:14,width:'100%'}}/>
        {suffix&&<span style={{fontFamily:MONO,fontSize:11,color:TEXT3,letterSpacing:'0.06em'}}>{suffix}</span>}
      </div>
    </div>
  );
}

/* ── Buttons ─────────────────────────────────────────── */
function PrimaryBtn({children,onClick,color=OW,icon,disabled}){
  return(
    <button onClick={disabled?undefined:onClick} style={{width:'100%',height:52,background:disabled?'var(--gb-input)':color,border:'none',borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:disabled?TEXT3:OI,cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,outline:'none'}}>
      {children}{icon&&<Icon name={icon} size={16} color={disabled?TEXT3:OI} sw={2}/>}
    </button>
  );
}
function OutlineBtn({children,onClick,icon,color}){
  return(
    <button onClick={onClick} style={{width:'100%',height:52,background:'transparent',border:`1px solid ${BDEF}`,borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:color||TEXT1,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,outline:'none'}}>
      {icon&&<Icon name={icon} size={16} color={color||TEXT1}/>}{children}
    </button>
  );
}
function GhostLink({children,onClick}){
  return <button onClick={onClick} style={{background:'none',border:'none',cursor:'pointer',fontFamily:UI,fontSize:13,color:TEXT2,outline:'none',padding:'6px 0'}}>{children}</button>;
}

/* ── BottomSheet ─────────────────────────────────────── */
function BottomSheet({open,onClose,children,title}){
  return(
    <div style={{position:'absolute',inset:0,zIndex:50,pointerEvents:open?'auto':'none'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(8,8,10,0.62)',opacity:open?1:0,transition:'opacity 260ms ease'}}></div>
      <div style={{position:'absolute',left:0,right:0,bottom:0,maxHeight:'84%',background:ELEV,borderTopLeftRadius:20,borderTopRightRadius:20,border:`1px solid ${BORDER}`,borderBottom:'none',transform:open?'translateY(0)':'translateY(101%)',transition:'transform 300ms cubic-bezier(0.16,1,0.30,1)',display:'flex',flexDirection:'column',boxShadow:'0 -16px 48px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',justifyContent:'center',paddingTop:10,paddingBottom:4,flexShrink:0}}>
          <div style={{width:38,height:4,borderRadius:999,background:BSTRONG}}></div>
        </div>
        {title&&<div style={{padding:'8px 22px 4px',fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em',flexShrink:0}}>{title}</div>}
        <div style={{overflowY:'auto',padding:'8px 22px 26px'}}>{children}</div>
      </div>
    </div>
  );
}

/* ── LineChart (steel line, sage-glow PR points) ─────── */
function LineChart({data,prIndex=[],color=STEEL,w=310,h=90}){
  const max=Math.max(...data), min=Math.min(...data), span=(max-min)||1;
  const step=data.length>1?w/(data.length-1):w;
  const pts=data.map((v,i)=>[i*step, h-((v-min)/span)*(h-10)-5]);
  const line=pts.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area=`${line} ${w},${h} 0,${h}`;
  const gid='lcg-'+Math.random().toString(36).slice(2,7);
  return(
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{display:'block',overflow:'visible'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.20"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>{const pr=prIndex.includes(i);return <circle key={i} cx={p[0]} cy={p[1]} r={pr?4:2.4} fill={pr?SAGE:color} style={pr?{filter:`drop-shadow(0 0 4px ${SAGE}) drop-shadow(0 0 8px rgba(159,216,154,0.6))`}:{}}/>;})}
    </svg>
  );
}

/* ── StatusDot ───────────────────────────────────────── */
function StatusDot({status}){
  const c=status==='progressing'?SAGE:status==='stagnating'?AMBER:NEUTRAL;
  return <span style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0,boxShadow:status==='progressing'?`0 0 6px ${SAGE}`:'none'}}></span>;
}

/* ── Stepper (− [val] +) ─────────────────────────────── */
function Stepper({value,unit,onDec,onInc}){
  const btn={width:26,height:28,borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,outline:'none'};
  return(
    <div style={{display:'flex',alignItems:'center',gap:4,flex:1,minWidth:0}}>
      <button onClick={onDec} style={btn}><Icon name="minus" size={13} color={TEXT2} sw={2}/></button>
      <div style={{flex:1,minWidth:0,textAlign:'center'}}>
        <span style={{fontFamily:DSP,fontWeight:700,fontSize:17,color:TEXT1}}>{value}</span>
        <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',marginLeft:3}}>{unit}</span>
      </div>
      <button onClick={onInc} style={btn}><Icon name="plus" size={13} color={TEXT2} sw={2}/></button>
    </div>
  );
}

/* ── DaySelector (calendar + CTA, for GymBro & Trainer) ── */
function DaySelector({title,subtitle,trained=[1,3,6,8,10,13],planned=[15,17,20,22],cta,onCta,onBack,tint}){
  const [sel,setSel]=useState(13);
  const tintC=tint==='steel'?STEEL:OW;
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 110px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em'}}>{title}</div>
            {subtitle&&<div style={{fontFamily:UI,fontSize:13,color:TEXT2,marginTop:2}}>{subtitle}</div>}
          </div>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:16,marginBottom:14}}>
          <div style={{fontFamily:DSP,fontWeight:400,fontSize:18,color:TEXT1,marginBottom:14}}>Julio 2026</div>
          <Calendar trained={trained} planned={planned} today={13} selected={sel} onDay={setSel}/>
          <div style={{display:'flex',gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${BORDER}`}}>
            <span style={{display:'flex',alignItems:'center',gap:6,fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase'}}><span style={{width:5,height:5,borderRadius:'50%',background:SAGE,boxShadow:`0 0 5px ${SAGE}`}}></span>Sesión</span>
            <span style={{display:'flex',alignItems:'center',gap:6,fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase'}}><span style={{width:9,height:9,borderRadius:3,border:`1px solid ${BSTRONG}`}}></span>Planificado</span>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',left:20,right:20,bottom:26}}>
        <PrimaryBtn onClick={()=>onCta&&onCta(sel)} color={tint==='steel'?STEEL:OW} icon="chevron-right">{cta}</PrimaryBtn>
      </div>
    </div>
  );
}

/* ── QR placeholder (brand mark centered) ────────────── */
function QRPlaceholder({size=120}){
  const cells=[];
  const seed=[1,1,1,1,0,1,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,1,0,1,0,0,1,1,1,0,1,0,1];
  for(let i=0;i<36;i++) cells.push(seed[i]);
  return(
    <div style={{width:size,height:size,background:'var(--gb-invert)',borderRadius:R,padding:size*0.09,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:2,position:'relative'}}>
      {cells.map((c,i)=><div key={i} style={{background:c?'var(--gb-bg)':'transparent',borderRadius:1}}></div>)}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:'var(--gb-invert)',borderRadius:6,padding:'6px 7px'}}><Isotype h={16} color={'var(--gb-bg)'}/></div>
      </div>
    </div>
  );
}

/* ── Fechas ──────────────────────────────────────────────
   Una sola fuente de verdad para el calendario. Antes cada pantalla
   llevaba julio de 2026 escrito a mano y el dia 13 fijo. */
const MONTHS=['enero','febrero','marzo','abril','mayo','junio',
              'julio','agosto','septiembre','octubre','noviembre','diciembre'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
/* Etiqueta "Agosto 2026" del mes indicado (por defecto, el actual). */
function monthLabel(y,m){ const d=new Date(); const Y=y==null?d.getFullYear():y, M=m==null?d.getMonth()+1:m;
  return `${cap(MONTHS[M-1])} ${Y}`; }
/* Clave "YYYY-MM" que espera GET /sessions?month= */
function monthKey(y,m){ const d=new Date(); const Y=y==null?d.getFullYear():y, M=m==null?d.getMonth()+1:m;
  return `${Y}-${String(M).padStart(2,'0')}`; }
/* "2026-08-28" en hora local: toISOString() usa UTC y a partir de las
   ~19h en America desplaza la fecha un dia. */
function todayISO(){ const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
/* "28 de agosto" para titulos de dia. */
function dayLabel(day,y,m){ const d=new Date(); const M=m==null?d.getMonth()+1:m;
  return `${day} de ${MONTHS[M-1]}`; }
/* Abreviaturas de los ultimos n meses, para los ejes de las graficas. */
function lastMonthsShort(n=4){ const d=new Date(), out=[];
  for(let i=n-1;i>=0;i--){ const x=new Date(d.getFullYear(),d.getMonth()-i,1);
    out.push(cap(MONTHS[x.getMonth()].slice(0,3))); }
  return out; }

window.GB = {
  BG,CARD,ELEV,INPUT,OW,SAGE,STEEL,AMBER,NEUTRAL,BORDER,BDEF,BSTRONG,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
  MONTHS, monthLabel, monthKey, todayISO, dayLabel, lastMonthsShort,
  isoDe, lunesDe,
  TAXONOMY, Icon, Isotype, Logo, ThemeToggle, StatusBar, TabBar, ProgressRing, Calendar, PeriodToggle,
  Pill, PillRow, Field, PrimaryBtn, OutlineBtn, GhostLink, BottomSheet, LineChart, StatusDot, Stepper, QRPlaceholder, DaySelector,
};
