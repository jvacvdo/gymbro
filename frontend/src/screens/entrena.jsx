// GymBro — Entrena + reusable 4-stage WorkoutFlow (shared by GymBro tab & Trainer)
const E = window.GB;
const { useState:useStateE, useEffect:useEffectE } = React;

/* ═══ Stage 1 — Muscle/exercise selection ═══════════════ */
function SelectStage({picked,setPicked,onStart,intro}){
  const { CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,BSTRONG,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,PrimaryBtn,TAXONOMY } = E;
  const [openGroup,setOpenGroup]=useStateE('Tren Superior');
  const [openMuscle,setOpenMuscle]=useStateE('Pecho');
  const groups=Object.keys(TAXONOMY);
  const total=Object.values(picked).reduce((n,a)=>n+a.length,0);
  const toggleEx=(muscle,ex)=>setPicked(p=>{
    const cur=p[muscle]||[]; const has=cur.includes(ex);
    const next=has?cur.filter(x=>x!==ex):[...cur,ex];
    const out={...p}; if(next.length)out[muscle]=next; else delete out[muscle]; return out;
  });
  return(
    <>
      {intro}
      {groups.map(g=>{
        const gOpen=openGroup===g;
        return(
          <div key={g} style={{marginBottom:8,border:`1px solid ${gOpen?BSTRONG:BORDER}`,borderRadius:R,overflow:'hidden',background:gOpen?'var(--gb-surface)':'transparent'}}>
            <button onClick={()=>setOpenGroup(gOpen?null:g)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'transparent',border:'none',padding:'14px 15px',cursor:'pointer',outline:'none'}}>
              <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>{g}</span>
              <span style={{display:'inline-flex',transition:'transform 200ms ease',transform:gOpen?'rotate(180deg)':'rotate(0)'}}><Icon name="chevron-down" size={17} color={TEXT2}/></span>
            </button>
            {gOpen&&<div style={{padding:'0 12px 12px'}}>
              {Object.keys(TAXONOMY[g]).map(m=>{
                const mOpen=openMuscle===m, cnt=(picked[m]||[]).length;
                return(
                  <div key={m} style={{marginLeft:6,borderLeft:`1px solid ${BORDER}`,paddingLeft:10,marginBottom:4}}>
                    <button onClick={()=>setOpenMuscle(mOpen?null:m)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'transparent',border:'none',padding:'9px 4px',cursor:'pointer',outline:'none'}}>
                      <span style={{fontFamily:UI,fontSize:13.5,color:mOpen||cnt?TEXT1:TEXT2}}>{m}{cnt?` · ${cnt}`:''}</span>
                      <span style={{display:'inline-flex',transition:'transform 200ms ease',transform:mOpen?'rotate(180deg)':'rotate(0)'}}><Icon name="chevron-down" size={14} color={TEXT3}/></span>
                    </button>
                    {mOpen&&TAXONOMY[g][m].map((ex,i)=>{
                      const on=(picked[m]||[]).includes(ex);
                      return(
                        <button key={i} onClick={()=>toggleEx(m,ex)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'transparent',border:'none',padding:'9px 4px 9px 12px',cursor:'pointer',outline:'none',textAlign:'left'}}>
                          <span style={{fontFamily:UI,fontSize:13,color:on?TEXT1:TEXT2}}>{ex}</span>
                          <span style={{width:22,height:22,borderRadius:6,border:`1.5px solid ${on?SAGE:BDEF}`,background:on?'rgba(159,216,154,0.14)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{on&&<Icon name="check" size={12} color={SAGE} sw={2.4}/>}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
      <div style={{marginTop:14}}><PrimaryBtn onClick={total?onStart:undefined} color={SAGE} icon="chevron-right" disabled={!total}>Comenzar sesión{total?` · ${total}`:''}</PrimaryBtn></div>
    </>
  );
}

/* ═══ WorkoutFlow — Stages 2–4 (+ optional Stage 1) ═════ */
// context: { mode:'athlete'|'gymbro'|'trainer', name, tint:'sage'|'steel' }
function WorkoutFlow({context={mode:'athlete'},date,onExit}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,BSTRONG,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,PrimaryBtn,OutlineBtn,Stepper,BottomSheet } = E;
  const tint = context.tint || (context.mode==='trainer'?'steel':'sage');
  const tintC = tint==='steel'?STEEL:SAGE;
  const tintGlow = tint==='steel'?'rgba(138,162,192,0.18)':'rgba(159,216,154,0.18)';

  const [stage,setStage]=useStateE('select');   // select | panel | logger | summary
  const [picked,setPicked]=useStateE({});
  const [session,setSession]=useStateE([]);
  const [mi,setMi]=useStateE(0);   // active muscle index
  const [ei,setEi]=useStateE(0);   // active exercise index

  /* Id de la sesion en el backend. Se crea al arrancar y se va actualizando,
     asi lo registrado sobrevive a cerrar la app a media sesion. */
  const [sessionId,setSessionId]=useStateE(null);
  const persiste = context.mode!=='trainer';   // la rutina de un cliente aun no se guarda

  const build=()=>{
    const s=Object.keys(picked).map(m=>({
      muscle:m, status:'pending',
      exercises:picked[m].map(name=>({name,done:false,series:[
        {kg:60,reps:8,done:false,by:'ti'},{kg:80,reps:6,done:false,by:'ti'},
      ]})),
    }));
    setSession(s); setStage('panel');
    if(persiste){
      E.api.createSession(s,{status:'planificado',date:date||E.todayISO()})
        .then(r=>setSessionId(r&&r.id))
        .catch(()=>{});   // sin id se cae al guardado final de siempre
    }
  };
  const enterMuscle=(idx)=>{
    setSession(s=>s.map((m,i)=>i===idx&&m.status==='pending'?{...m,status:'progress'}:m));
    const firstUndone=session[idx].exercises.findIndex(e=>!e.done);
    setMi(idx); setEi(firstUndone<0?0:firstUndone); setStage('logger');
  };
  const updSeries=(fn)=>setSession(s=>s.map((m,i)=>i!==mi?m:{...m,exercises:m.exercises.map((e,j)=>j!==ei?e:{...e,series:fn(e.series)})}));
  const muscle=session[mi], exercise=muscle&&muscle.exercises[ei];
  const muscleDone = muscle && muscle.exercises.every(e=>e.done);
  const allDone = session.length>0 && session.every(m=>m.status==='done');
  /* Basta una serie marcada para que la sesion valga la pena guardarse.
     Exigir el ritual completo (cada ejercicio, cada musculo) hacia que
     saltarse un ejercicio costase la sesion entera. */
  const hasLoggedSets = session.some(m=>m.exercises.some(e=>e.series.some(x=>x.done)));
  const [confirmExit,setConfirmExit]=useStateE(false);
  const tryExit = () => hasLoggedSets ? setConfirmExit(true) : onExit();

  const finishExercise=()=>{
    const ex=muscle.exercises;
    const updated=ex.map((e,j)=>j===ei?{...e,done:true}:e);
    setSession(s=>s.map((m,i)=>i===mi?{...m,exercises:updated}:m));
    const nxt=updated.findIndex(e=>!e.done);
    if(nxt>=0) setEi(nxt);
  };
  const finishMuscle=()=>{ setSession(s=>s.map((m,i)=>i===mi?{...m,status:'done'}:m)); setStage('panel'); };

  const [saveErr,setSaveErr]=useStateE('');
  const [saving,setSaving]=useStateE(false);
  const [autoSaved,setAutoSaved]=useStateE(false);

  /* Autoguardado. Cada cambio en las series se manda con una pausa corta,
     para no lanzar una peticion por cada toque en los steppers. */
  useEffectE(()=>{
    if(!persiste||!sessionId||!session.length) return;
    const t=setTimeout(()=>{
      E.api.updateSession(sessionId,{muscles:session})
        .then(()=>{ setAutoSaved(true); setSaveErr(''); })
        .catch(()=>{});   // el guardado final vuelve a intentarlo
    },900);
    return ()=>clearTimeout(t);
  },[session,sessionId,persiste]);
  /* Persiste la sesion completa antes de mostrar el resumen. Si el guardado
     falla no bloqueamos al usuario: pasa al resumen con el aviso. */
  const finishSession=async()=>{
    if(saving) return;
    setSaving(true); setSaveErr('');
    try{
      /* Si el autoguardado creo la sesion, se cierra esa. Crear otra
         duplicaria el entreno en el calendario y en las estadisticas. */
      if(persiste&&sessionId) await E.api.updateSession(sessionId,{muscles:session,status:'entrenado'});
      else await E.api.createSession(session,{status:'entrenado',date:date||E.todayISO()});
    }
    catch(e){ setSaveErr('No se pudo guardar la sesión: '+(e.message||'error')); }
    finally{ setSaving(false); setStage('summary'); }
  };

  /* Resumen real de lo registrado. Antes eran tres numeros fijos
     (52 min / 14 series / 4.120 kg) identicos para cualquier sesion. */
  const hechas = session.flatMap(m=>m.exercises.flatMap(e=>e.series.filter(x=>x.done)));
  const nSeries = hechas.length;
  const volumen = hechas.reduce((n,x)=>n+x.kg*x.reps,0);
  const minutos = Math.max(nSeries*4,1);
  const fmtKg = v => v>=1000 ? v.toLocaleString('es-ES') : String(v);

  /* Stage 1 */
  if(stage==='select') return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        {context.mode!=='athlete'&&<ContextBar context={context} tintC={tintC}/>}
        <SelectStage picked={picked} setPicked={setPicked} onStart={build} intro={
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:DSP,fontWeight:400,fontSize:26,color:TEXT1,letterSpacing:'-0.01em'}}>¿Qué entrenas hoy?</div>
            <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,marginTop:6}}>Elige músculos y ejercicios para la sesión.</div>
          </div>
        }/>
      </div>
    </div>
  );

  /* Stage 2 — Session panel */
  if(stage==='panel') return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 120px'}}>
        {context.mode!=='athlete'&&<ContextBar context={context} tintC={tintC}/>}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button onClick={tryExit} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:24,color:TEXT1,letterSpacing:'-0.01em'}}>Sesión de hoy</div>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:3}}>{E.dayLabel(parseInt((date||E.todayISO()).slice(8,10),10))} · {session.length} músculos</div>
          </div>
        </div>
        {session.map((m,i)=>{
          const done=m.status==='done', prog=m.status==='progress';
          const bc=done?'rgba(159,216,154,0.4)':prog?'rgba(138,162,192,0.4)':BORDER;
          return(
            <button key={i} onClick={()=>enterMuscle(i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:CARD,border:`1px solid ${bc}`,borderRadius:R,padding:'16px 16px',marginBottom:10,cursor:'pointer',outline:'none',textAlign:'left'}}>
              <div>
                <div style={{fontFamily:UI,fontWeight:500,fontSize:16,color:TEXT1,marginBottom:3}}>{m.muscle}</div>
                <div style={{fontFamily:UI,fontSize:12.5,color:TEXT2}}>{m.exercises.length} ejercicios{done?' · completado':prog?' · en progreso':''}</div>
              </div>
              {done? <span style={{width:26,height:26,borderRadius:'50%',background:'rgba(159,216,154,0.14)',border:`1.5px solid ${SAGE}`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="check" size={14} color={SAGE} sw={2.4}/></span>
               : <span style={{width:9,height:9,borderRadius:'50%',background:prog?STEEL:TEXT3,boxShadow:prog?`0 0 6px ${STEEL}`:'none'}}></span>}
            </button>
          );
        })}
      </div>
      {hasLoggedSets&&(
        <div style={{position:'absolute',left:20,right:20,bottom:26}}>
          {/* El resplandor se reserva para la sesion completa: celebrar un
              cierre parcial seria enganoso. */}
          {allDone&&<div style={{position:'absolute',inset:'-8px -8px',background:`radial-gradient(ellipse, ${tintGlow} 0%, transparent 70%)`,pointerEvents:'none'}}></div>}
          <div style={{position:'relative'}}>
            {!allDone&&(
              <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',textAlign:'center',marginBottom:9}}>
                {session.filter(m=>m.status!=='done').length} sin terminar{autoSaved?' · guardado':' · se guardan igual'}
              </div>
            )}
            <PrimaryBtn onClick={finishSession} disabled={saving} color={OW} icon="check">{saving?'Guardando…':'Finalizar sesión'}</PrimaryBtn>
          </div>
        </div>
      )}

      <BottomSheet open={confirmExit} onClose={()=>setConfirmExit(false)} title={autoSaved?'¿Terminar la sesión?':'¿Salir sin guardar?'}>
        <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,lineHeight:1.5,marginBottom:18}}>
          {autoSaved
            ? 'Lo que llevas registrado ya está guardado. Puedes darla por terminada o dejarla a medias y seguir después.'
            : 'Tienes series registradas en esta sesión. Si sales ahora se pierden.'}
        </div>
        <div style={{marginBottom:10}}>
          <PrimaryBtn onClick={()=>{setConfirmExit(false);finishSession();}} color={OW} icon="check">{autoSaved?'Terminar sesión':'Guardar y salir'}</PrimaryBtn>
        </div>
        <OutlineBtn onClick={()=>{setConfirmExit(false);onExit();}}>{autoSaved?'Dejar a medias':'Salir sin guardar'}</OutlineBtn>
      </BottomSheet>
    </div>
  );

  /* Stage 3 — Logger */
  if(stage==='logger'&&exercise) return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 150px'}}>
        {context.mode!=='athlete'&&<ContextBar context={context} tintC={tintC}/>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <button onClick={()=>setStage('panel')} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <span style={{fontFamily:MONO,fontSize:10,color:tintC,letterSpacing:'0.1em',textTransform:'uppercase'}}>Ejercicio {ei+1} de {muscle.exercises.length}</span>
          <Icon name="dots" size={20} color={TEXT3}/>
        </div>
        <div style={{fontFamily:MONO,fontSize:11,color:TEXT3,letterSpacing:'0.06em',marginBottom:6}}>{muscle.muscle} <span style={{opacity:0.6}}>›</span> </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <button onClick={()=>setEi(Math.max(0,ei-1))} disabled={ei===0} style={{background:'none',border:'none',cursor:ei===0?'default':'pointer',padding:0,outline:'none',display:'flex',opacity:ei===0?0.25:1}}><Icon name="back" size={22} color={TEXT2}/></button>
          <span style={{fontFamily:DSP,fontWeight:400,fontSize:26,color:TEXT1,letterSpacing:'-0.01em',textAlign:'center',flex:1}}>{exercise.name}</span>
          <button onClick={()=>setEi(Math.min(muscle.exercises.length-1,ei+1))} disabled={ei===muscle.exercises.length-1} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex',transform:'rotate(180deg)',opacity:ei===muscle.exercises.length-1?0.25:1}}><Icon name="back" size={22} color={TEXT2}/></button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'24px 42px 1fr 1fr 28px',gap:6,alignItems:'center',padding:'0 4px 10px'}}>
          {['SET','ANT.','KG','REPS',''].map((h,i)=><span key={i} style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textAlign:i>1?'center':'left'}}>{h}</span>)}
        </div>
        {exercise.series.map((r,j)=>(
          <div key={j} style={{background:r.done?'rgba(159,216,154,0.05)':CARD,border:`1px solid ${r.done?'rgba(159,216,154,0.22)':BORDER}`,borderRadius:8,padding:'10px',marginBottom:8}}>
            <div style={{display:'grid',gridTemplateColumns:'24px 42px 1fr 1fr 28px',gap:6,alignItems:'center'}}>
              <span style={{fontFamily:MONO,fontSize:13,color:TEXT2,textAlign:'center'}}>{j+1}</span>
              <span style={{fontFamily:MONO,fontSize:10,color:TEXT3}}>{r.kg}×{r.reps}</span>
              <Stepper value={r.kg} unit="kg" onDec={()=>updSeries(ss=>ss.map((x,k)=>k===j?{...x,kg:Math.max(0,x.kg-2.5)}:x))} onInc={()=>updSeries(ss=>ss.map((x,k)=>k===j?{...x,kg:x.kg+2.5}:x))}/>
              <Stepper value={r.reps} unit="reps" onDec={()=>updSeries(ss=>ss.map((x,k)=>k===j?{...x,reps:Math.max(0,x.reps-1)}:x))} onInc={()=>updSeries(ss=>ss.map((x,k)=>k===j?{...x,reps:x.reps+1}:x))}/>
              <button onClick={()=>updSeries(ss=>ss.map((x,k)=>k===j?{...x,done:!x.done}:x))} style={{width:28,height:28,borderRadius:'50%',border:`1.5px solid ${r.done?SAGE:BDEF}`,background:r.done?'rgba(159,216,154,0.14)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',outline:'none',padding:0}}>{r.done&&<Icon name="check" size={14} color={SAGE} sw={2.4}/>}</button>
            </div>
            <div style={{display:'flex',gap:8,marginTop:9,paddingTop:9,borderTop:`1px solid ${BORDER}`,alignItems:'center'}}>
              <button onClick={()=>updSeries(ss=>ss.length>1?ss.filter((_,k)=>k!==j):ss)} style={{flex:1,height:30,borderRadius:8,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,outline:'none',fontFamily:UI,fontSize:11,color:TEXT2}}><Icon name="minus" size={12} color={TEXT2} sw={2}/>Quitar</button>
              <button onClick={()=>updSeries(ss=>{const c=[...ss];c.splice(j+1,0,{kg:r.kg,reps:r.reps,done:false,by:'ti'});return c;})} style={{flex:1,height:30,borderRadius:8,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,outline:'none',fontFamily:UI,fontSize:11,color:TEXT2}}><Icon name="plus" size={12} color={TEXT2} sw={2}/>Añadir</button>
              {context.mode!=='athlete'&&<span style={{fontFamily:MONO,fontSize:8,color:r.by==='ti'?tintC:STEEL,letterSpacing:'0.05em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{context.mode==='trainer'?`Prog. ${context.name?.split(' ')[0]||''}`:(r.by==='ti'?'Por ti':`Por ${context.name?.split(' ')[0]||''}`)}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{position:'absolute',left:20,right:20,bottom:26}}>
        {muscleDone
          ? <PrimaryBtn onClick={finishMuscle} color={OW} icon="check">Finalizar músculo</PrimaryBtn>
          : <OutlineBtn onClick={finishExercise} icon="check">Finalizar ejercicio</OutlineBtn>}
      </div>
    </div>
  );

  /* Stage 4 — Summary */
  const isTrainer=context.mode==='trainer';
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <StatusBar/>
      <div style={{position:'absolute',top:120,left:'50%',transform:'translateX(-50%)',width:340,height:340,borderRadius:'50%',background:`radial-gradient(circle, ${isTrainer?'rgba(138,162,192,0.20)':'rgba(159,216,154,0.20)'} 0%, transparent 68%)`,pointerEvents:'none'}}></div>
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 24px',position:'relative'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}>
          <div style={{width:72,height:72,borderRadius:'50%',border:`2px solid ${saveErr?'#E0A0A0':tintC}`,background:saveErr?'rgba(224,160,160,0.12)':(isTrainer?'rgba(138,162,192,0.12)':'rgba(159,216,154,0.12)'),display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22,boxShadow:saveErr?'none':`0 0 22px ${isTrainer?'rgba(138,162,192,0.4)':'rgba(159,216,154,0.4)'}`}}><Icon name={saveErr?'minus':'check'} size={32} color={saveErr?'#E0A0A0':tintC} sw={2.4}/></div>
          <div style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1,letterSpacing:'-0.02em',marginBottom:isTrainer?10:22}}>{saveErr?'Sesión no guardada':(isTrainer?'Rutina guardada':'Sesión completada')}</div>
          {saveErr&&(
            <div style={{fontFamily:UI,fontSize:13,color:'#E0A0A0',lineHeight:1.5,maxWidth:280,marginBottom:18}}>{saveErr}</div>
          )}
          {isTrainer
            ? <div style={{fontFamily:UI,fontSize:14,color:TEXT2,lineHeight:1.5,maxWidth:260,marginBottom:8}}>Para {context.name}. El atleta verá esta rutina en su calendario.</div>
            : <div style={{display:'flex',gap:28,marginBottom:8}}>
                {[[String(minutos),'min'],[String(nSeries),'series'],[fmtKg(volumen),'kg']].map(([v,u])=>(
                  <div key={u} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <span style={{fontFamily:DSP,fontWeight:700,fontSize:26,color:TEXT1}}>{v}</span>
                    <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>{u}</span>
                  </div>
                ))}
              </div>}
        </div>
        <div style={{paddingBottom:34,display:'flex',flexDirection:'column',gap:12}}>
          {isTrainer
            ? <button onClick={onExit} style={{width:'100%',height:52,background:'transparent',border:`1px solid ${BDEF}`,borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,cursor:'pointer',outline:'none'}}>Volver a clientes</button>
            : <>
                <PrimaryBtn onClick={onExit} icon="chevron-right">Ver resumen completo</PrimaryBtn>
                <button onClick={onExit} style={{width:'100%',height:52,background:'transparent',border:`1px solid ${BDEF}`,borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,cursor:'pointer',outline:'none'}}>Volver al inicio</button>
              </>}
        </div>
      </div>
    </div>
  );
}

/* Context bar (gymbro/trainer) */
function ContextBar({context,tintC}){
  const { MONO,UI,TEXT1,TEXT2 } = E;
  const trainer=context.mode==='trainer';
  const bg=trainer?'rgba(138,162,192,0.1)':'rgba(159,216,154,0.1)';
  const bc=trainer?'rgba(138,162,192,0.28)':'rgba(159,216,154,0.28)';
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,background:bg,border:`1px solid ${bc}`,borderRadius:8,padding:'9px 13px',margin:'0 0 16px'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:tintC,boxShadow:`0 0 6px ${tintC}`}}></span>
      <span style={{fontFamily:UI,fontSize:12.5,color:TEXT1}}>{trainer?`Cargando para ${context.name}`:`Entrenando con ${context.name}`}</span>
    </div>
  );
}

/* ═══ Entrena tab (athlete) ═════════════════════════════ */
function EntrenaScreen({onFinish}){
  const { BG,CARD,OW,SAGE,BORDER,BDEF,TEXT1,TEXT2,UI,DSP,MONO,R,
          Icon,StatusBar,Calendar } = E;
  const [flow,setFlow]=useStateE(false);
  const [selDay,setSelDay]=useStateE(new Date().getDate());
  const [cal,setCal]=useStateE({trained:[],planned:[]});
  const MES=E.monthKey();

  useEffectE(()=>{
    let alive=true;
    E.api.getSessions(MES).then(rows=>{
      if(!alive) return;
      const day=d=>parseInt(String(d).slice(8,10),10);
      setCal({
        trained:rows.filter(r=>r.status==='entrenado').map(r=>day(r.date)),
        planned:rows.filter(r=>r.status==='planificado').map(r=>day(r.date)),
      });
    }).catch(()=>{});
    return ()=>{alive=false;};
  },[flow,MES]);
  /* El dia elegido en el calendario es el dia con el que se guarda la sesion.
     Antes se seleccionaba un dia y la sesion caia siempre en hoy. */
  const fecha=`${MES}-${String(selDay).padStart(2,'0')}`;
  if(flow) return <WorkoutFlow context={{mode:'athlete'}} date={fecha} onExit={()=>{setFlow(false);onFinish&&onFinish();}}/>;
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 100px'}}>
        <div style={{fontFamily:DSP,fontWeight:400,fontSize:28,color:TEXT1,letterSpacing:'-0.01em',marginBottom:6}}>Entrena</div>
        <div style={{fontFamily:UI,fontSize:14,color:TEXT2,marginBottom:22}}>Elige un día para planificar tu sesión.</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:16,marginBottom:16}}>
          <div style={{fontFamily:DSP,fontWeight:400,fontSize:18,color:TEXT1,marginBottom:14}}>{E.monthLabel()}</div>
          <Calendar trained={cal.trained} planned={cal.planned} selected={selDay} onDay={setSelDay}/>
        </div>
        <button onClick={()=>setFlow(true)} style={{width:'100%',height:52,background:OW,border:'none',borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:BG,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,outline:'none'}}>
          <Icon name="dumbbell" size={16} color={BG}/>Comenzar a entrenar
        </button>
      </div>
    </div>
  );
}

Object.assign(window.GB,{ EntrenaScreen, WorkoutFlow });
