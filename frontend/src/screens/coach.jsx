// GymBro — Entrenador. Tarjeta en Inicio + hoja de preguntas.
//
// El motor de reglas del backend siempre responde; la redaccion de Gemini es
// un extra. Si /coach/ask da 503 (sin clave o sin cuota), la tarjeta sigue
// mostrando las cargas calculadas: nunca se queda en blanco.
const CO = window.GB;
const { useState:useStateCO, useEffect:useEffectCO } = React;

function CoachCard({onEntrena}){
  const { CARD,ELEV,SAGE,STEEL,AMBER,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,BottomSheet,PrimaryBtn,OutlineBtn,Field } = CO;
  const [data,setData]=useStateCO(null);
  const [cargando,setCargando]=useStateCO(true);
  const [abierto,setAbierto]=useStateCO(false);

  useEffectCO(()=>{
    let vivo=true;
    CO.api.getCoach()
      .then(r=>{ if(vivo) setData(r); })
      .catch(()=>{ if(vivo) setData(null); })
      .finally(()=>{ if(vivo) setCargando(false); });
    return ()=>{vivo=false;};
  },[]);

  if(cargando) return (
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:18,marginBottom:24}}>
      <div style={{fontFamily:UI,fontSize:13,color:TEXT3}}>Analizando tu historial…</div>
    </div>
  );
  if(!data) return null;

  const color = s => s==='estancado'?AMBER : s==='nuevo'?TEXT3 : SAGE;

  return(
    <>
      <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
        Tu entrenador
        {data.ai&&<span style={{fontFamily:MONO,fontSize:8,color:STEEL,letterSpacing:'0.08em',padding:'2px 6px',background:'rgba(138,162,192,0.12)',borderRadius:4}}>IA</span>}
      </div>

      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:18,marginBottom:24}}>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:20,color:TEXT1,letterSpacing:'-0.01em',lineHeight:1.25,marginBottom:6}}>
          {data.headline}
        </div>
        <div style={{fontFamily:UI,fontSize:13,color:TEXT2,lineHeight:1.5,marginBottom:data.has_data?14:0}}>
          {data.ai&&data.ai_text ? data.ai_text : data.detail}
        </div>

        {/* Cargas calculadas. Salen de las reglas, no del modelo. */}
        {data.exercises&&data.exercises.length>0&&(
          <div style={{borderTop:`1px solid ${BORDER}`,paddingTop:13,marginBottom:13}}>
            {data.exercises.slice(0,4).map((e,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0'}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontFamily:UI,fontSize:13.5,color:TEXT1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.exercise}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.06em',marginTop:2}}>ÚLTIMO {e.last_kg} KG</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                  <div style={{fontFamily:DSP,fontWeight:700,fontSize:17,color:color(e.state)}}>{e.suggested_kg}<span style={{fontFamily:MONO,fontSize:9,color:TEXT3,marginLeft:2}}>kg</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.warnings&&data.warnings.length>0&&(
          <div style={{background:'rgba(196,150,58,0.08)',border:`1px solid rgba(196,150,58,0.24)`,borderRadius:6,padding:'10px 12px',marginBottom:13}}>
            {data.warnings.map((w,i)=>(
              <div key={i} style={{fontFamily:UI,fontSize:12,color:'#E0C088',lineHeight:1.45}}>{w}</div>
            ))}
          </div>
        )}

        {data.has_data
          ? <div style={{display:'flex',gap:9}}>
              <div style={{flex:1}}><OutlineBtn onClick={()=>setAbierto(true)} icon="message">Preguntar</OutlineBtn></div>
              <div style={{flex:1}}><PrimaryBtn onClick={onEntrena} color={SAGE} icon="chevron-right">Entrenar</PrimaryBtn></div>
            </div>
          : <PrimaryBtn onClick={onEntrena} color={SAGE} icon="chevron-right">Registrar sesión</PrimaryBtn>}

        <div style={{fontFamily:UI,fontSize:10.5,color:TEXT3,lineHeight:1.45,marginTop:12}}>
          {data.disclaimer}
        </div>
      </div>

      <AskSheet open={abierto} onClose={()=>setAbierto(false)}/>
    </>
  );
}

/* ── Preguntas libres ────────────────────────────────── */
function AskSheet({open,onClose}){
  const { TEXT1,TEXT2,TEXT3,UI,MONO,BORDER,BottomSheet,Field,PrimaryBtn,OutlineBtn } = CO;
  const [q,setQ]=useStateCO('');
  const [resp,setResp]=useStateCO('');
  const [busy,setBusy]=useStateCO(false);
  const [err,setErr]=useStateCO('');

  const SUGERIDAS=[
    '¿Por qué no progreso?',
    '¿Cuántas series debería hacer?',
    '¿Qué entreno mañana?',
  ];

  const preguntar=async(texto)=>{
    const t=(texto!==undefined?texto:q).trim();
    if(!t||busy) return;
    setBusy(true); setErr(''); setResp('');
    if(texto!==undefined) setQ(texto);
    try{
      const r=await CO.api.askCoach(t);
      setResp(r.answer);
    }catch(e){ setErr(e.message||'No se pudo responder'); }
    finally{ setBusy(false); }
  };
  const cerrar=()=>{ setQ(''); setResp(''); setErr(''); onClose(); };

  return(
    <BottomSheet open={open} onClose={cerrar} title="Pregunta a tu entrenador">
      <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>
        {SUGERIDAS.map(s=>(
          <button key={s} onClick={()=>preguntar(s)} disabled={busy}
            style={{fontFamily:UI,fontSize:12,color:TEXT2,background:'transparent',border:`1px solid ${BORDER}`,borderRadius:999,padding:'6px 12px',cursor:busy?'default':'pointer',outline:'none'}}>{s}</button>
        ))}
      </div>

      <Field label="Tu pregunta" placeholder="¿Qué quieres saber?" value={q} onChange={e=>setQ(e.target.value)}/>

      {resp&&(
        <div style={{background:'var(--gb-elev)',border:`1px solid ${BORDER}`,borderRadius:8,padding:'14px 15px',marginBottom:14}}>
          <div style={{fontFamily:UI,fontSize:13.5,color:TEXT1,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{resp}</div>
        </div>
      )}
      {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',marginBottom:12,lineHeight:1.5}}>{err}</div>}

      <div style={{marginBottom:10}}>
        <PrimaryBtn onClick={()=>preguntar()} disabled={busy||!q.trim()} icon="chevron-right">{busy?'Pensando…':'Preguntar'}</PrimaryBtn>
      </div>
      <OutlineBtn onClick={cerrar}>Cerrar</OutlineBtn>
    </BottomSheet>
  );
}

Object.assign(window.GB,{ CoachCard });
