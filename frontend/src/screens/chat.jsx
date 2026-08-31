// GymBro — Chat con el entrenador.
//
// Conversacion con historial: el backend recibe los ultimos turnos, asi que
// se le puede preguntar "¿y entonces?" y sabe de que se habla. Las cargas
// siguen saliendo del motor de reglas; Gemini solo las explica.
const CH = window.GB;
const { useState:useStateCH, useEffect:useEffectCH, useRef:useRefCH } = React;

const SUGERIDAS = [
  '¿Qué entreno hoy?',
  '¿Por qué no progreso?',
  '¿Cuántas series hago?',
  'Arma mi semana',
];

function CoachChat({open,onClose}){
  const { BG,CARD,ELEV,SAGE,STEEL,BORDER,BDEF,INPUT,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar } = CH;
  const [msgs,setMsgs]=useStateCH([]);
  const [q,setQ]=useStateCH('');
  const [busy,setBusy]=useStateCH(false);
  const [err,setErr]=useStateCH('');
  const finalRef=useRefCH(null);

  // Al abrir por primera vez, saluda con el consejo del dia ya calculado.
  useEffectCH(()=>{
    if(!open||msgs.length) return;
    let vivo=true;
    CH.api.getCoach().then(r=>{
      if(!vivo) return;
      const texto = r.has_data
        ? (r.ai&&r.ai_text ? r.ai_text : r.headline+' '+r.detail)
        : 'Todavía no tienes entrenamientos registrados. En cuanto registres el primero puedo decirte qué peso te toca.';
      setMsgs([{role:'coach',text:texto}]);
    }).catch(()=>{
      if(vivo) setMsgs([{role:'coach',text:'Cuéntame qué necesitas.'}]);
    });
    return ()=>{vivo=false;};
  },[open]);

  // Mantener la vista abajo segun llegan mensajes.
  useEffectCH(()=>{
    if(finalRef.current) finalRef.current.scrollIntoView({behavior:'smooth',block:'end'});
  },[msgs,busy]);

  const enviar=async(texto)=>{
    const t=(texto!==undefined?texto:q).trim();
    if(!t||busy) return;
    setErr(''); setQ('');
    const previos=msgs;
    setMsgs(m=>[...m,{role:'tu',text:t}]);
    setBusy(true);
    try{
      const r=await CH.api.askCoach(t,previos);
      setMsgs(m=>[...m,{role:'coach',text:r.answer}]);
    }catch(e){
      setErr(e.message||'No se pudo responder');
      // La pregunta se queda escrita para no obligar a repetirla.
      setQ(t);
      setMsgs(m=>m.slice(0,-1));
    }finally{ setBusy(false); }
  };

  if(!open) return null;

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column',zIndex:60}}>
      <StatusBar/>

      <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 20px 14px',borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}>
          <Icon name="back" size={20} color={TEXT2}/>
        </button>
        <div style={{flex:1}}>
          <div style={{fontFamily:DSP,fontWeight:700,fontSize:19,color:TEXT1,letterSpacing:'-0.01em'}}>Tu entrenador</div>
          <div style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2}}>Responde con tus datos reales</div>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'18px 20px 10px'}}>
        {msgs.map((m,i)=>{
          const mio=m.role==='tu';
          return(
            <div key={i} style={{display:'flex',justifyContent:mio?'flex-end':'flex-start',marginBottom:12}}>
              <div style={{
                maxWidth:'82%',
                background:mio?'rgba(159,216,154,0.14)':CARD,
                border:`1px solid ${mio?'rgba(159,216,154,0.3)':BORDER}`,
                borderRadius:mio?'14px 14px 4px 14px':'14px 14px 14px 4px',
                padding:'11px 14px',
                fontFamily:UI,fontSize:14,lineHeight:1.55,
                color:mio?TEXT1:TEXT2,whiteSpace:'pre-wrap',
              }}>{m.text}</div>
            </div>
          );
        })}
        {busy&&(
          <div style={{display:'flex',justifyContent:'flex-start',marginBottom:12}}>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:'14px 14px 14px 4px',padding:'11px 14px',fontFamily:UI,fontSize:14,color:TEXT3}}>Pensando…</div>
          </div>
        )}
        {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',textAlign:'center',marginBottom:10,lineHeight:1.5}}>{err}</div>}
        <div ref={finalRef}></div>
      </div>

      {/* Sugerencias: solo mientras la conversacion no ha arrancado */}
      {msgs.length<=1&&!busy&&(
        <div style={{display:'flex',gap:7,flexWrap:'wrap',padding:'0 20px 12px',flexShrink:0}}>
          {SUGERIDAS.map(s=>(
            <button key={s} onClick={()=>enviar(s)}
              style={{fontFamily:UI,fontSize:12,color:TEXT2,background:'transparent',border:`1px solid ${BORDER}`,borderRadius:999,padding:'7px 13px',cursor:'pointer',outline:'none'}}>{s}</button>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:9,alignItems:'center',padding:'12px 20px 22px',borderTop:`1px solid ${BORDER}`,flexShrink:0}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') enviar(); }}
          placeholder="Pregunta lo que quieras…"
          maxLength={400}
          style={{flex:1,height:46,background:INPUT,border:`1px solid ${BDEF}`,borderRadius:R,padding:'0 14px',outline:'none',fontFamily:UI,fontSize:14,color:TEXT1}}/>
        <button onClick={()=>enviar()} disabled={busy||!q.trim()}
          style={{width:46,height:46,borderRadius:R,background:(busy||!q.trim())?'var(--gb-input)':SAGE,border:'none',cursor:(busy||!q.trim())?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',outline:'none',flexShrink:0}}>
          <Icon name="chevron-right" size={19} color={(busy||!q.trim())?TEXT3:BG} sw={2.2}/>
        </button>
      </div>
    </div>
  );
}

/* Boton flotante que abre el chat. */
function CoachFab({onClick}){
  const { SAGE,BG,Icon } = CH;
  return(
    <button onClick={onClick} aria-label="Hablar con tu entrenador"
      style={{position:'absolute',right:20,bottom:100,width:54,height:54,borderRadius:'50%',background:SAGE,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(0,0,0,0.45)',outline:'none',zIndex:30}}>
      <Icon name="message" size={22} color={BG} sw={1.9}/>
    </button>
  );
}

Object.assign(window.GB,{ CoachChat, CoachFab });
