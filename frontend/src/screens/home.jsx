// GymBro — Inicio (Home): calendar, próxima sesión, historial muscular
const H = window.GB;
const { useState:useStateH, useEffect:useEffectH } = React;

/* Une nombres de musculo en titulo legible: "Pecho y Triceps" */
function joinMuscles(names){
  if(!names.length) return 'Sesion';
  if(names.length===1) return names[0];
  return names.slice(0,-1).join(', ')+' y '+names[names.length-1];
}
/* Convierte los `muscles` del backend a la forma `groups` que pinta la hoja */
function toGroups(muscles){
  return (muscles||[]).map(m=>({muscle:m.muscle,exercises:(m.exercises||[]).map(e=>e.name)}));
}

function HomeScreen({onEntrena,light,onToggle}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,
          Icon,Logo,ThemeToggle,StatusBar,Calendar,PeriodToggle,Pill,PillRow,BottomSheet,LineChart,PrimaryBtn } = H;
  const [period,setPeriod]=useStateH('Mes');
  const [selDay,setSelDay]=useStateH(null);
  const [group,setGroup]=useStateH('Tren Superior');
  const [muscle,setMuscle]=useStateH('Pecho');

  const [trained,setTrained]=useStateH([]);
  const [planned,setPlanned]=useStateH([]);
  const [next,setNext]=useStateH(null);
  const [chart,setChart]=useStateH([]);

  /* Mes que se muestra. Se recalcula en cada render, asi que si la app
     queda abierta y cambia el dia, el calendario sigue al reloj. */
  const MES=H.monthKey();

  /* Calendario del mes + proxima sesion */
  useEffectH(()=>{
    let alive=true;
    H.api.getSessions(MES).then(rows=>{
      if(!alive) return;
      const day=d=>parseInt(String(d).slice(8,10),10);
      setTrained(rows.filter(r=>r.status==='entrenado').map(r=>day(r.date)));
      setPlanned(rows.filter(r=>r.status==='planificado').map(r=>day(r.date)));
    }).catch(()=>{});
    H.api.getNextSession().then(n=>{ if(alive) setNext(n); }).catch(()=>{});
    return ()=>{alive=false;};
  },[MES]);

  /* Historial muscular: serie de carga maxima del musculo activo */
  useEffectH(()=>{
    let alive=true;
    H.api.getMuscleProgress(muscle)
      .then(r=>{ if(alive) setChart((r&&r.points&&r.points.length)?r.points:[]); })
      .catch(()=>{ if(alive) setChart([]); });
    return ()=>{alive=false;};
  },[muscle]);

  /* La lista del mes solo trae fecha y estado. El detalle por dia solo lo
     conocemos de la proxima sesion; el resto de dias abren en estado vacio. */
  const nextDay = next ? parseInt(String(next.date).slice(8,10),10) : null;
  const plan = (selDay && selDay===nextDay) ? {groups:toGroups(next.muscles)} : null;

  const groups=Object.keys(H.TAXONOMY);
  const muscles=Object.keys(H.TAXONOMY[group]);

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 100px'}}>
        {/* header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <Logo size={20}/>
          <ThemeToggle light={light} onToggle={onToggle}/>
        </div>

        {/* Calendar module */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontFamily:DSP,fontWeight:400,fontSize:22,color:TEXT1,letterSpacing:'-0.01em'}}>{H.monthLabel()}</span>
        </div>
        <div style={{marginBottom:14}}><PeriodToggle value={period} onChange={setPeriod}/></div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R8(),padding:16,marginBottom:22}}>
          <Calendar trained={trained} planned={planned} selected={selDay} onDay={setSelDay}/>
          <div style={{display:'flex',gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${BORDER}`}}>
            <span style={{display:'flex',alignItems:'center',gap:6,fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase'}}><span style={{width:5,height:5,borderRadius:'50%',background:SAGE,boxShadow:`0 0 5px ${SAGE}`}}></span>Entrenado</span>
            <span style={{display:'flex',alignItems:'center',gap:6,fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase'}}><span style={{width:9,height:9,borderRadius:3,border:`1px solid ${H.BSTRONG}`}}></span>Planificado</span>
          </div>
        </div>

        {/* Próxima sesión */}
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Tu próxima sesión</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R8(),padding:18,marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontFamily:DSP,fontWeight:700,fontSize:26,color:TEXT1,letterSpacing:'-0.01em',lineHeight:1}}>{next?joinMuscles((next.muscles||[]).map(m=>m.muscle)):'Sin sesión'}</div>
              <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:7}}>{next?`Día ${nextDay} · ${next.exercise_count} ejercicios · ~${next.est_minutes} min`:'Nada planificado todavía'}</div>
            </div>
            {next&&next.est_volume_pct!==0&&(
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:next.est_volume_pct>0?SAGE:TEXT3,letterSpacing:'0.06em'}}>{next.est_volume_pct>0?'↑':'↓'}{Math.abs(next.est_volume_pct)}%</div>
                <div style={{fontFamily:MONO,fontSize:8,color:TEXT3,letterSpacing:'0.06em'}}>vol. est.</div>
              </div>
            )}
          </div>
          <PrimaryBtn onClick={onEntrena} color={OW} icon="chevron-right">Entrena</PrimaryBtn>
        </div>

        {/* Historial muscular */}
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12}}>Tu historial muscular</div>
        <div style={{marginBottom:10}}>
          <PillRow>
            {groups.map(g=><Pill key={g} label={g} active={group===g} onClick={()=>{setGroup(g);setMuscle(Object.keys(H.TAXONOMY[g])[0]);}}/>)}
          </PillRow>
        </div>
        <div style={{marginBottom:14}}>
          <PillRow>
            {muscles.map(m=><Pill key={m} label={m} active={muscle===m} onClick={()=>setMuscle(m)} color={STEEL}/>)}
          </PillRow>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R8(),padding:'16px 16px 12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
            <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{muscle}</span>
            <span style={{fontFamily:MONO,fontSize:9,color:STEEL,letterSpacing:'0.08em',textTransform:'uppercase'}}>Carga máx · kg</span>
          </div>
          {chart.length
            ? <LineChart data={chart} prIndex={[chart.length-1]} color={STEEL}/>
            : <div style={{height:96,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:UI,fontSize:12.5,color:TEXT3}}>Sin datos para {muscle} todavía</div>}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
            {H.lastMonthsShort(4).map(m=><span key={m} style={{fontFamily:MONO,fontSize:8,color:TEXT3,letterSpacing:'0.06em'}}>{m}</span>)}
          </div>
        </div>
      </div>

      {/* Day sheet */}
      <BottomSheet open={!!selDay} onClose={()=>setSelDay(null)} title={selDay?H.dayLabel(selDay):''}>
        {plan? (
          <>
            {plan.groups.map((g,i)=>(
              <div key={i} style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
                  <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>{g.muscle}</span>
                  <button style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="pencil" size={15} color={TEXT3}/></button>
                </div>
                {g.exercises.map((e,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:j<g.exercises.length-1?`1px solid ${BORDER}`:'none'}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:TEXT3}}></span>
                    <span style={{fontFamily:UI,fontSize:13.5,color:TEXT2}}>{e}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{marginTop:8}}><PrimaryBtn onClick={()=>{setSelDay(null);onEntrena();}} color={SAGE} icon="chevron-right">Entrena</PrimaryBtn></div>
          </>
        ):(
          <div style={{padding:'30px 0 20px',textAlign:'center'}}>
            <div style={{fontFamily:UI,fontSize:14,color:TEXT2,marginBottom:18}}>Día de descanso. Sin sesión planificada.</div>
            <PrimaryBtn onClick={()=>{setSelDay(null);onEntrena();}} color={OW} icon="plus">Planificar sesión</PrimaryBtn>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

Object.assign(window.GB,{ HomeScreen });
function R8(){ return window.GB.R; }
