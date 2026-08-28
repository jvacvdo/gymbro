// GymBro — Progreso: 3-level filters, dynamic chart, records, stagnation alert
const P = window.GB;
const { useState:useStateP, useEffect:useEffectP } = React;

function ProgresoScreen(){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,AMBER,BORDER,BDEF,BSTRONG,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,ProgressRing,Pill,PillRow,LineChart,TAXONOMY } = P;
  const [group,setGroup]=useStateP('Tren Superior');
  const [muscle,setMuscle]=useStateP('Pecho');
  const [exercise,setExercise]=useStateP('Press banca');
  const [open,setOpen]=useStateP(false);   // collapsed by default

  const groups=Object.keys(TAXONOMY);
  const muscles=Object.keys(TAXONOMY[group]);
  const exercises=TAXONOMY[group][muscle];

  const [data,setData]=useStateP({chart:[],records:[],stagnating:false,sessions:0});

  useEffectP(()=>{
    let alive=true;
    P.api.getExerciseProgress(exercise)
      .then(r=>{ if(alive) setData({chart:r.chart||[],records:r.records||[],stagnating:!!r.stagnating,sessions:r.sessions||0}); })
      .catch(()=>{ if(alive) setData({chart:[],records:[],stagnating:false,sessions:0}); });
    return ()=>{alive=false;};
  },[exercise]);

  const CHART=data.chart, RECORDS=data.records, stagnating=data.stagnating;
  const sesiones=data.sessions;
  const last=CHART.length?CHART[CHART.length-1]:0;
  const first=CHART.length?CHART[0]:0;
  const gain=last-first;
  const gainPct=first?Math.round((gain/first)*100):0;
  const gainRing=last?Math.min(gain/last+0.3,0.95):0;

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 100px'}}>
        <div style={{fontFamily:DSP,fontWeight:400,fontSize:28,color:TEXT1,letterSpacing:'-0.01em',marginBottom:18}}>Progreso</div>

        {/* Collapsible 3-level filter (collapsed by default) */}
        <div style={{background:CARD,border:`1px solid ${open?BSTRONG:BORDER}`,borderRadius:R,marginBottom:20,overflow:'hidden'}}>
          <button onClick={()=>setOpen(o=>!o)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'transparent',border:'none',padding:'13px 15px',cursor:'pointer',outline:'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0}}>
              <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>Filtro</span>
              <span style={{fontFamily:UI,fontSize:13.5,color:TEXT1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{group} · {muscle} · {exercise}</span>
            </div>
            <span style={{display:'inline-flex',transition:'transform 200ms ease',transform:open?'rotate(180deg)':'rotate(0)',flexShrink:0}}><Icon name="chevron-down" size={17} color={TEXT2}/></span>
          </button>
          {open&&(
            <div style={{display:'flex',flexDirection:'column',gap:9,padding:'2px 13px 14px'}}>
              <div>
                <div style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Grupo</div>
                <PillRow>{groups.map(g=><Pill key={g} label={g} active={group===g} onClick={()=>{const m=Object.keys(TAXONOMY[g])[0];setGroup(g);setMuscle(m);setExercise(TAXONOMY[g][m][0]);}}/>)}</PillRow>
              </div>
              <div>
                <div style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Músculo</div>
                <PillRow>{muscles.map(m=><Pill key={m} label={m} active={muscle===m} onClick={()=>{setMuscle(m);setExercise(TAXONOMY[group][m][0]);}} color={STEEL}/>)}</PillRow>
              </div>
              <div>
                <div style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Ejercicio</div>
                <PillRow>{exercises.map(x=><Pill key={x} label={x} active={exercise===x} onClick={()=>setExercise(x)}/>)}</PillRow>
              </div>
            </div>
          )}
        </div>

        {/* stagnation alert (amber) */}
        {stagnating&&(
          <div style={{background:'rgba(196,150,58,0.08)',border:`1px solid rgba(196,150,58,0.28)`,borderRadius:R,padding:'13px 15px',marginBottom:18,display:'flex',gap:11,alignItems:'flex-start'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:AMBER,marginTop:5,flexShrink:0}}></div>
            <div>
              <div style={{fontFamily:UI,fontWeight:500,fontSize:13.5,color:'#E0C088',marginBottom:3}}>Progreso estancado</div>
              <div style={{fontFamily:UI,fontSize:12.5,color:TEXT2,lineHeight:1.45}}>Llevas 3 semanas con la misma carga en {exercise}. Prueba subir 2.5 kg o cambiar el tempo.</div>
            </div>
          </div>
        )}

        {/* rings */}
        <div style={{display:'flex',justifyContent:'space-around',marginBottom:22}}>
          <ProgressRing size={92} progress={last?0.82:0} value={`${last}`} label="kg máx" color="sage" sw={4}/>
          <ProgressRing size={92} progress={Math.min(sesiones/20,0.95)} value={`${sesiones}`} label="sesiones" color="steel" sw={4}/>
          <ProgressRing size={92} progress={gainRing} value={`+${gainPct}%`} label="carga" color="sage" sw={4}/>
        </div>

        {/* chart */}
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'16px 16px 12px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
            <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{exercise}</span>
            <span style={{fontFamily:MONO,fontSize:9,color:STEEL,letterSpacing:'0.08em',textTransform:'uppercase'}}>Carga máx · kg</span>
          </div>
          {CHART.length
            ? <LineChart data={CHART} prIndex={[CHART.length-1]} color={STEEL}/>
            : <div style={{height:96,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:UI,fontSize:12.5,color:TEXT3}}>Sin registros de {exercise} todavía</div>}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
            {['Mar','Abr','May','Jun'].map(m=><span key={m} style={{fontFamily:MONO,fontSize:8,color:TEXT3,letterSpacing:'0.06em'}}>{m}</span>)}
          </div>
        </div>

        {/* records */}
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Récords personales · {exercise}</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,overflow:'hidden'}}>
          {RECORDS.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:i<RECORDS.length-1?`1px solid ${BORDER}`:'none'}}>
              <span style={{fontFamily:UI,fontSize:13.5,color:TEXT2}}>{r[0]}</span>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontFamily:DSP,fontWeight:700,fontSize:17,color:TEXT1}}>{r[1]}</span>
                <span style={{fontFamily:MONO,fontSize:10,color:SAGE,letterSpacing:'0.06em',minWidth:44,textAlign:'right'}}>{r[2]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window.GB,{ ProgresoScreen });
