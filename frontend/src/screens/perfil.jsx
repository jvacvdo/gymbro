// GymBro — Perfil: athlete view + Apariencia toggle, Trainer button, Plan screen, Trainer view
const PF = window.GB;
const { useState:useStatePF, useEffect:useEffectPF } = React;

const CLIENTS=[
  {n:'María López',last:'Ayer',s:'progressing'},
  {n:'Diego Ruiz',last:'Hace 2 días',s:'maintaining'},
  {n:'Sara Vidal',last:'Hace 9 días',s:'stagnating'},
  {n:'Tomás Gil',last:'Hoy',s:'progressing'},
];

function PerfilScreen({light,onToggle}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,ThemeToggle,PrimaryBtn } = PF;
  const [view,setView]=useStatePF('profile');   // profile | plan | trainer
  const [hasTrainer,setHasTrainer]=useStatePF(true);   // Trainer plan purchased?
  const [me,setMe]=useStatePF(null);

  useEffectPF(()=>{
    let alive=true;
    PF.api.getMe().then(u=>{ if(alive) setMe(u); }).catch(()=>{});
    return ()=>{alive=false;};
  },[]);

  const nombre = me && me.name ? me.name : 'Tu perfil';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || '—';
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const alta = me && me.created_at
    ? (d=>`Miembro desde ${MESES[d.getMonth()]} ${d.getFullYear()}`)(new Date(me.created_at))
    : '';

  if(view==='plan') return <PlanScreen onBack={()=>setView('profile')} hasTrainer={hasTrainer} onPick={()=>setHasTrainer(true)}/>;
  if(view==='trainer') return <TrainerView onBack={()=>setView('profile')}/>;

  const SETTINGS=[['pencil','Editar perfil'],['bell','Notificaciones'],['ruler','Unidades','kg'],['shield','Privacidad'],['crown','Plan actual','plan'],['logout','Cerrar sesión']];

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 100px'}}>
        {/* Header */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:8,marginBottom:22}}>
          <div style={{width:84,height:84,borderRadius:'50%',background:`linear-gradient(135deg, var(--gb-elev), var(--gb-surface))`,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
            <span style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1}}>{iniciales}</span>
          </div>
          <div style={{fontFamily:DSP,fontWeight:700,fontSize:24,color:TEXT1,letterSpacing:'-0.01em'}}>{nombre}</div>
          <div style={{fontFamily:UI,fontSize:13,color:TEXT2,marginTop:2}}>{me&&me.username?'@'+me.username:''}</div>
          <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:8}}>{alta}</div>
        </div>

        {/* Goal */}
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'15px 17px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>Tu objetivo</div>
            <div style={{fontFamily:UI,fontWeight:500,fontSize:16,color:TEXT1}}>{me&&me.goal?me.goal:'—'}</div>
          </div>
          <button style={{width:34,height:34,borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',outline:'none'}}><Icon name="pencil" size={15} color={TEXT2}/></button>
        </div>

        {/* Motivational */}
        <div style={{background:'rgba(138,162,192,0.09)',border:`1px solid rgba(138,162,192,0.22)`,borderRadius:R,padding:'15px 17px',marginBottom:16}}>
          <div style={{fontFamily:MONO,fontSize:9,color:STEEL,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:7}}>Esta semana</div>
          <div style={{fontFamily:DSP,fontWeight:400,fontSize:19,color:TEXT1,lineHeight:1.25,letterSpacing:'-0.01em'}}>Llevas 3 semanas sin faltar. Eso se nota.</div>
        </div>

        {/* Stats strip */}
        <div style={{display:'flex',background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'16px 0',marginBottom:24}}>
          {[['Sesiones','148'],['Volumen','2.1M kg'],['Racha','21 días']].map(([l,v],i)=>(
            <div key={l} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,borderRight:i<2?`1px solid ${BORDER}`:'none'}}>
              <span style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>{l}</span>
              <span style={{fontFamily:DSP,fontWeight:700,fontSize:20,color:TEXT1,lineHeight:1}}>{v}</span>
            </div>
          ))}
        </div>

        {/* Apariencia */}
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Apariencia</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'14px 16px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:13}}>
            <Icon name={light?'sun':'moon'} size={17} color={TEXT2}/>
            <span style={{fontFamily:UI,fontSize:14,color:TEXT1}}>Modo oscuro</span>
          </div>
          <ThemeToggle light={light} onToggle={onToggle}/>
        </div>

        {/* Settings */}
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Ajustes</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,overflow:'hidden',marginBottom:24}}>
          {SETTINGS.map((s,i)=>(
            <button key={i} onClick={()=>s[2]==='plan'&&setView('plan')} style={{width:'100%',display:'flex',alignItems:'center',gap:13,padding:'14px 16px',background:'transparent',border:'none',borderBottom:i<SETTINGS.length-1?`1px solid ${BORDER}`:'none',cursor:'pointer',outline:'none',textAlign:'left'}}>
              <Icon name={s[0]} size={17} color={s[1]==='Cerrar sesión'?'#FF6B6B':TEXT2}/>
              <span style={{flex:1,fontFamily:UI,fontSize:14,color:s[1]==='Cerrar sesión'?'#FF6B6B':TEXT1}}>{s[1]}</span>
              {s[2]&&s[2]!=='plan'&&<span style={{fontFamily:MONO,fontSize:10,color:TEXT2,letterSpacing:'0.06em',textTransform:'uppercase'}}>{s[2]}</span>}
              <Icon name="chevron-right" size={16} color={TEXT3}/>
            </button>
          ))}
        </div>

        {/* Trainer button */}
        <button onClick={()=>setView(hasTrainer?'trainer':'plan')} style={{width:'100%',display:'flex',alignItems:'center',gap:13,background:CARD,border:`1px solid ${BDEF}`,borderRadius:R,padding:'16px 16px',cursor:'pointer',outline:'none',textAlign:'left'}}>
          <div style={{width:38,height:38,borderRadius:R,background:'var(--gb-elev)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name="dumbbell" size={18} color={hasTrainer?SAGE:TEXT2}/></div>
          <div style={{flex:1}}>
            <div style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>Modo Trainer</div>
          </div>
          {hasTrainer? <Icon name="chevron-right" size={19} color={TEXT2}/> : <Icon name="lock" size={17} color={TEXT3}/>}
        </button>
        <div style={{fontFamily:UI,fontSize:12,color:TEXT3,marginTop:8,paddingLeft:2}}>Gestiona a las personas que entrenas.</div>
      </div>
    </div>
  );
}

/* ── Plan Actual screen ──────────────────────────────── */
function PlanScreen({onBack,hasTrainer,onPick}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar } = PF;
  const PLANS=[
    {id:'free',name:'Free',price:null,glow:null,feats:['Registro ilimitado','Progreso básico','Sin Modo Trainer'],cta:'Plan actual',disabled:true},
    {id:'pro',name:'Pro',price:'$2.99 / mes',glow:'steel',feats:['Todo lo de Free','Análisis de IA completo','Detección de estancamiento','Gráficos detallados','Sin Modo Trainer'],cta:'Elegir Pro'},
    {id:'trainer',name:'Trainer',price:'Desde $9.99 / mes',glow:'sage',feats:['Todo lo de Pro','Modo Trainer activo','Hasta 20 clientes','Panel de gestión de clientes','Progreso en tiempo real'],cta:'Elegir Trainer'},
  ];
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
        </div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1,letterSpacing:'-0.02em',marginBottom:8}}>Elige tu plan</div>
        <div style={{fontFamily:UI,fontSize:14,color:TEXT2,lineHeight:1.45,marginBottom:22}}>Desbloquea el Modo Trainer y gestiona a tus clientes.</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {PLANS.map(pl=>{
            const glowCol=pl.glow==='sage'?'rgba(159,216,154,0.4)':pl.glow==='steel'?'rgba(138,162,192,0.4)':null;
            const bc=pl.glow==='sage'?'rgba(159,216,154,0.35)':pl.glow==='steel'?'rgba(138,162,192,0.35)':BORDER;
            return(
              <div key={pl.id} style={{background:CARD,border:`1px solid ${bc}`,borderRadius:R,padding:'18px 18px',boxShadow:glowCol?`0 0 20px ${glowCol.replace('0.4','0.14')}`:'none'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <span style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1}}>{pl.name}</span>
                  {pl.price&&<span style={{fontFamily:MONO,fontSize:11,color:pl.glow==='sage'?SAGE:STEEL,letterSpacing:'0.04em'}}>{pl.price}</span>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                  {pl.feats.map((f,i)=>{
                    const no=f.startsWith('Sin ');
                    return(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:9}}>
                        <Icon name={no?'minus':'check'} size={14} color={no?TEXT3:(pl.glow==='sage'?SAGE:pl.glow==='steel'?STEEL:TEXT2)} sw={2.2}/>
                        <span style={{fontFamily:UI,fontSize:13,color:no?TEXT3:TEXT2}}>{f}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={()=>{if(!pl.disabled){onPick();onBack();}}} disabled={pl.disabled} style={{width:'100%',height:46,borderRadius:R,background:pl.disabled?'var(--gb-input)':OW,border:'none',cursor:pl.disabled?'default':'pointer',fontFamily:UI,fontWeight:500,fontSize:14,color:pl.disabled?TEXT3:BG,outline:'none'}}>{pl.cta}</button>
              </div>
            );
          })}
        </div>
        <div style={{fontFamily:UI,fontSize:11,color:TEXT3,textAlign:'center',marginTop:18}}>Pagos seguros. Cancela cuando quieras.</div>
      </div>
    </div>
  );
}

/* ── Trainer view ────────────────────────────────────── */
function TrainerView({onBack}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,AMBER,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,PrimaryBtn,OutlineBtn,DaySelector,WorkoutFlow,StatusDot } = PF;
  const [client,setClient]=useStatePF(null);
  const [cstep,setCstep]=useStatePF('list');   // list | day | mode | view | flow
  const missing=CLIENTS.filter(c=>c.s==='stagnating');
  const first=(n)=>n.split(' ')[0];

  if(client&&cstep==='day') return <DaySelector title={`Rutina de ${client.n}`} subtitle="Elige un día para ver o cargar" cta="Ver / Cargar este día" onCta={()=>setCstep('mode')} onBack={()=>{setCstep('list');setClient(null);}}/>;
  if(client&&cstep==='mode') return <ModeSelector client={client} onView={()=>setCstep('view')} onLoad={()=>setCstep('flow')} onBack={()=>setCstep('day')}/>;
  if(client&&cstep==='view') return <ClientDashboard client={client} onBack={()=>setCstep('mode')}/>;
  if(client&&cstep==='flow') return <WorkoutFlow context={{mode:'trainer',name:client.n,tint:'steel'}} onExit={()=>{setCstep('list');setClient(null);}}/>;
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 100px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:24,color:TEXT1,letterSpacing:'-0.01em'}}>Modo Trainer</div>
            <div style={{fontFamily:UI,fontSize:13,color:TEXT2,marginTop:2}}>Tus clientes activos</div>
          </div>
        </div>
        <div style={{background:'rgba(196,150,58,0.08)',border:`1px solid rgba(196,150,58,0.28)`,borderRadius:R,padding:'13px 15px',marginBottom:14}}>
          <div style={{fontFamily:UI,fontWeight:500,fontSize:13,color:'#E0C088',marginBottom:9}}>{missing.length} clientes sin sesión esta semana</div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {missing.map(c=><span key={c.n} style={{fontFamily:UI,fontSize:11.5,color:TEXT2,padding:'5px 11px',background:'var(--gb-elev)',border:`1px solid ${BDEF}`,borderRadius:999}}>{c.n}</span>)}
          </div>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,overflow:'hidden',marginBottom:16}}>
          {CLIENTS.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderBottom:i<CLIENTS.length-1?`1px solid ${BORDER}`:'none'}}>
              <button onClick={()=>{setClient(c);setCstep('day');}} style={{display:'flex',alignItems:'center',gap:12,flex:1,background:'none',border:'none',cursor:'pointer',outline:'none',textAlign:'left',padding:0}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontFamily:UI,fontWeight:500,fontSize:13,color:TEXT1}}>{c.n.split(' ').map(w=>w[0]).join('')}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{c.n}</span>
                    <StatusDot status={c.s}/>
                  </div>
                  <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.05em'}}>Última sesión · {c.last}</div>
                </div>
              </button>
              <button style={{width:34,height:34,borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',outline:'none',flexShrink:0}}><Icon name="message" size={15} color={TEXT2}/></button>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={()=>{}} color={OW} icon="plus">Agregar cliente</PrimaryBtn>
      </div>
    </div>
  );
}

/* ── Mode selector (Ver sesión / Cargar rutina) ──────── */
function ModeSelector({client,onView,onLoad,onBack}){
  const { BG,CARD,ELEV,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,Icon,StatusBar } = PF;
  const Card=({tint,icon,title,desc,onClick})=>{
    const c=tint==='steel'?STEEL:SAGE;
    return(
      <button onClick={onClick} style={{width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:14,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'18px 16px',cursor:'pointer',outline:'none',marginBottom:12}}>
        <div style={{width:44,height:44,borderRadius:R,background:tint==='steel'?'rgba(138,162,192,0.12)':'rgba(159,216,154,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name={icon} size={20} color={c}/></div>
        <div style={{flex:1}}>
          <div style={{fontFamily:UI,fontWeight:500,fontSize:15.5,color:TEXT1,marginBottom:3}}>{title}</div>
          <div style={{fontFamily:UI,fontSize:12.5,color:TEXT2,lineHeight:1.4}}>{desc}</div>
        </div>
        <Icon name="chevron-right" size={18} color={TEXT3}/>
      </button>
    );
  };
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em'}}>{client.n}</div>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:3}}>13 Julio</div>
          </div>
        </div>
        <Card tint="sage" icon="chart" title="Ver sesión" desc="Revisa lo que registró tu cliente este día." onClick={onView}/>
        <Card tint="steel" icon="pencil" title="Cargar rutina" desc="Programa músculos, ejercicios y series para este día." onClick={onLoad}/>
      </div>
    </div>
  );
}

/* ── Client dashboard (read-only) ────────────────────── */
function ClientDashboard({client,onBack}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,ProgressRing,StatusDot,LineChart } = PF;
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase'}}>Vista de entrenador</span>
          <Icon name="message" size={18} color={TEXT2}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:13,marginBottom:22}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:UI,fontWeight:500,fontSize:17,color:TEXT1}}>{client.n.split(' ').map(w=>w[0]).join('')}</span>
          </div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em'}}>{client.n}</span>
              <StatusDot status={client.s}/>
            </div>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.06em',marginTop:3}}>Última sesión · {client.last}</div>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-around',marginBottom:22}}>
          <ProgressRing size={96} progress={0.7} value="9,820" label="kg sem" color="sage" sw={4}/>
          <ProgressRing size={96} progress={0.55} value="4" label="sesiones" color="steel" sw={4}/>
          <ProgressRing size={96} progress={0.66} value="66%" label="adher." color="sage" sw={4}/>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'16px 16px 12px',marginBottom:16}}>
          <div style={{fontFamily:MONO,fontSize:9,color:STEEL,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Volumen · últimas semanas</div>
          <LineChart data={[70,74,78,80,84,88,92]} prIndex={[6]} color={STEEL}/>
        </div>
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Sesiones recientes</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,overflow:'hidden'}}>
          {[['Pecho y Tríceps','Ayer','5.2k kg'],['Pierna completa','Hace 3 días','8.1k kg'],['Espalda y Bíceps','Hace 5 días','6.4k kg']].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:i<2?`1px solid ${BORDER}`:'none'}}>
              <div>
                <div style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1,marginBottom:2}}>{s[0]}</div>
                <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.05em'}}>{s[1]}</div>
              </div>
              <span style={{fontFamily:DSP,fontWeight:700,fontSize:15,color:TEXT2}}>{s[2]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window.GB,{ PerfilScreen });
