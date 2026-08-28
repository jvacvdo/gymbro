// GymBro — 5th tab: training companions (GymBro / GymSis)
const GY = window.GB;
const { useState:useStateGY } = React;

const CONNECTIONS=[
  {n:'María López',u:'marialpz',sex:'M',today:true},
  {n:'Diego Ruiz',u:'diegoruiz',sex:'H',today:false,days:2},
  {n:'Tomás Gil',u:'tomasgil',sex:'H',today:true},
  {n:'Sara Vidal',u:'saravidal',sex:'M',today:false,days:5},
];
const SEARCH=[{n:'Laura Fernández',u:'laurafdz',sex:'M'},{n:'Javier Soto',u:'javisoto',sex:'H'}];

function GymBroScreen(){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,NEUTRAL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,Isotype,Logo,StatusBar,BottomSheet,PrimaryBtn,StatusDot } = GY;
  const [hasConns,setHasConns]=useStateGY(true);   // toggle empty vs list demo
  const [sheet,setSheet]=useStateGY(false);
  const [active,setActive]=useStateGY(null);        // selected connection
  const [step,setStep]=useStateGY('list');          // list | day | flow
  const [mode,setMode]=useStateGY('user');          // add modal: user | qr

  const label=(c)=>c.sex==='M'?'GymSis':'GymBro';
  const initials=(n)=>n.split(' ').map(w=>w[0]).join('');

  if(step==='day'&&active) return <GY.DaySelector title={`Entrenando con ${active.n.split(' ')[0]}`} subtitle="Elige el día de la sesión" cta="Cargar sesión de este día" onCta={()=>setStep('flow')} onBack={()=>{setStep('list');setActive(null);}}/>;
  if(step==='flow'&&active) return <GY.WorkoutFlow context={{mode:'gymbro',name:active.n,tint:'sage'}} onExit={()=>{setStep('list');setActive(null);}}/>;

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 110px'}}>
        {/* header */}
        <div style={{marginBottom:20}}>
          <Logo size={20}/>
          <div style={{fontFamily:UI,fontSize:14,color:TEXT2,marginTop:8}}>Tus compañeros</div>
        </div>

        {/* demo state toggle */}
        <button onClick={()=>setHasConns(v=>!v)} style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',background:'transparent',border:`1px solid ${BDEF}`,borderRadius:R,padding:'5px 10px',cursor:'pointer',outline:'none',marginBottom:18}}>
          Ver estado: {hasConns?'con compañeros':'vacío'}
        </button>

        {!hasConns? (
          /* empty state */
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'40px 10px'}}>
            <div style={{width:96,height:96,borderRadius:'50%',background:CARD,border:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22}}>
              <Isotype h={40} color={TEXT3}/>
            </div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em',marginBottom:8}}>Todavía no tienes un GymBro.</div>
            <div style={{fontFamily:UI,fontSize:14,color:TEXT2,lineHeight:1.5,maxWidth:260,marginBottom:26}}>Entrena con alguien y avancen juntos.</div>
            <PrimaryBtn onClick={()=>setSheet(true)} icon="plus">Agregar GymBro / GymSis</PrimaryBtn>
          </div>
        ):(
          /* list */
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {CONNECTIONS.map((c,i)=>(
              <button key={i} onClick={()=>c.today&&(setActive(c),setStep('day'))} style={{display:'flex',alignItems:'center',gap:13,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'13px 14px',cursor:c.today?'pointer':'default',outline:'none',textAlign:'left'}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{initials(c.n)}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <span style={{fontFamily:UI,fontWeight:500,fontSize:14.5,color:TEXT1}}>{c.n}</span>
                    <span style={{fontFamily:MONO,fontSize:8.5,color:c.sex==='M'?STEEL:SAGE,letterSpacing:'0.08em',textTransform:'uppercase',padding:'2px 7px',background:c.sex==='M'?'rgba(138,162,192,0.12)':'rgba(159,216,154,0.12)',borderRadius:5}}>{label(c)}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <StatusDot status={c.today?'progressing':'maintaining'}/>
                    <span style={{fontFamily:UI,fontSize:12,color:c.today?SAGE:TEXT3}}>{c.today?'Entrenando hoy':`Último entreno: hace ${c.days} días`}</span>
                  </div>
                </div>
                {c.today&&<Icon name="chevron-right" size={18} color={TEXT3}/>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* floating + */}
      {hasConns&&(
        <button onClick={()=>setSheet(true)} style={{position:'absolute',right:20,bottom:100,width:54,height:54,borderRadius:'50%',background:OW,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(0,0,0,0.4)',outline:'none',zIndex:20}}>
          <Icon name="plus" size={22} color={BG} sw={2}/>
        </button>
      )}

      {/* add modal */}
      <BottomSheet open={sheet} onClose={()=>setSheet(false)} title="Agregar compañero/a">
        <div style={{display:'flex',gap:8,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:3,marginBottom:18}}>
          {[['user','Buscar por usuario'],['qr','Escanear código QR']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,height:34,borderRadius:6,background:mode===m?OW:'transparent',border:'none',cursor:'pointer',fontFamily:UI,fontSize:12,fontWeight:mode===m?500:400,color:mode===m?BG:TEXT2,outline:'none'}}>{l}</button>
          ))}
        </div>
        {mode==='user'? (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,background:INPUTv(),border:`1px solid ${BDEF}`,borderRadius:R,height:46,padding:'0 14px',marginBottom:16}}>
              <Icon name="search" size={16} color={TEXT3}/>
              <span style={{fontFamily:UI,fontSize:14,color:TEXT3}}>@</span>
              <span style={{fontFamily:UI,fontSize:14,color:TEXT2}}>buscar usuario…</span>
            </div>
            {SEARCH.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:`1px solid ${BORDER}`}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontFamily:UI,fontWeight:500,fontSize:13,color:TEXT1}}>{s.n.split(' ').map(w=>w[0]).join('')}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{s.n}</div>
                  <div style={{fontFamily:MONO,fontSize:10,color:TEXT3}}>@{s.u}</div>
                </div>
                <button style={{height:34,padding:'0 16px',borderRadius:R,background:OW,border:'none',cursor:'pointer',fontFamily:UI,fontWeight:500,fontSize:12.5,color:BG,outline:'none'}}>Agregar</button>
              </div>
            ))}
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0 8px'}}>
            <div style={{width:220,height:220,borderRadius:12,border:`1.5px dashed ${BDEF}`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i)=>(
                <div key={i} style={{position:'absolute',width:26,height:26,borderTop:r===0?`2.5px solid ${STEEL}`:'none',borderBottom:r===1?`2.5px solid ${STEEL}`:'none',borderLeft:c===0?`2.5px solid ${STEEL}`:'none',borderRight:c===1?`2.5px solid ${STEEL}`:'none',top:r===0?16:'auto',bottom:r===1?16:'auto',left:c===0?16:'auto',right:c===1?16:'auto',borderRadius:4}}></div>
              ))}
              <Icon name="qr" size={54} color={TEXT3}/>
            </div>
            <div style={{fontFamily:UI,fontSize:13,color:TEXT2,textAlign:'center'}}>Apunta al código QR de tu compañero/a</div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
function INPUTv(){ return GY.INPUT; }

/* ── Connected session (both training same day) ──────── */
function ConnectedSession({conn,onBack}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,PrimaryBtn } = GY;
  const EXS=[
    {name:'Press banca',sets:[{kg:80,reps:8,by:'ti'},{kg:90,reps:6,by:conn.n.split(' ')[0]},{kg:100,reps:4,by:'ti'}]},
    {name:'Press inclinado',sets:[{kg:60,reps:10,by:conn.n.split(' ')[0]},{kg:65,reps:8,by:'ti'}]},
    {name:'Aperturas',sets:[]},
  ];
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 110px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <span style={{fontFamily:MONO,fontSize:10,color:SAGE,letterSpacing:'0.1em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:6}}><span style={{width:6,height:6,borderRadius:'50%',background:SAGE,boxShadow:`0 0 6px ${SAGE}`}}></span>En vivo</span>
          <Icon name="message" size={19} color={TEXT2}/>
        </div>
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>{conn.n.split(' ')[0]} está entrenando</div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:28,color:TEXT1,letterSpacing:'-0.01em',marginBottom:20}}>Pecho y Tríceps</div>

        {EXS.map((ex,i)=>(
          <div key={i} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'14px 15px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:ex.sets.length?11:0}}>
              <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>{ex.name}</span>
              <button style={{display:'flex',alignItems:'center',gap:5,height:30,padding:'0 12px',borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',fontFamily:UI,fontSize:12,color:TEXT2,outline:'none'}}><Icon name="plus" size={13} color={TEXT2} sw={2}/>Agregar datos</button>
            </div>
            {ex.sets.map((s,j)=>{
              const mine=s.by==='ti';
              return(
                <div key={j} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderTop:`1px solid ${BORDER}`}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                    <span style={{fontFamily:MONO,fontSize:11,color:TEXT3}}>{j+1}</span>
                    <span style={{fontFamily:DSP,fontWeight:700,fontSize:15,color:TEXT1}}>{s.kg}<span style={{fontFamily:MONO,fontSize:9,color:TEXT3,marginLeft:2}}>kg</span></span>
                    <span style={{fontFamily:DSP,fontWeight:700,fontSize:15,color:TEXT1}}>{s.reps}<span style={{fontFamily:MONO,fontSize:9,color:TEXT3,marginLeft:2}}>reps</span></span>
                  </div>
                  <span style={{fontFamily:MONO,fontSize:8.5,color:mine?SAGE:STEEL,letterSpacing:'0.06em',textTransform:'uppercase',padding:'3px 8px',background:mine?'rgba(159,216,154,0.1)':'rgba(138,162,192,0.1)',borderRadius:5}}>{mine?'Registrado por ti':`Por ${s.by}`}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window.GB,{ GymBroScreen });
