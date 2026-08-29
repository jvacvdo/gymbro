// GymBro — 5th tab: training companions (GymBro / GymSis)
// Conectado al backend: /users/search, /connections, /connections/{id}/session
const GY = window.GB;
const { useState:useStateGY, useEffect:useEffectGY } = React;

function GymBroScreen(){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,Isotype,Logo,StatusBar,BottomSheet,PrimaryBtn,StatusDot,QRPlaceholder } = GY;
  const [conns,setConns]=useStateGY([]);
  const [loading,setLoading]=useStateGY(true);
  const [sheet,setSheet]=useStateGY(false);
  const [active,setActive]=useStateGY(null);
  const [step,setStep]=useStateGY('list');          // list | flow | live
  const [mode,setMode]=useStateGY('user');          // add modal: user | qr
  const [err,setErr]=useStateGY('');

  const load=()=>{
    setLoading(true);
    GY.api.getConnections()
      .then(r=>setConns(r||[]))
      .catch(()=>setConns([]))
      .finally(()=>setLoading(false));
  };
  useEffectGY(load,[]);

  const label=(c)=>c.sex==='Mujer'?'GymSis':'GymBro';
  const initials=(n)=>n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');

  const respond=async(c,action)=>{
    setErr('');
    try{ await GY.api.respondConnection(c.id,action); load(); }
    catch(e){ setErr(e.message||'No se pudo responder'); }
  };

  if(step==='flow'&&active)
    return <GY.WorkoutFlow context={{mode:'gymbro',name:active.name,tint:'sage'}} onExit={()=>{setStep('list');setActive(null);load();}}/>;
  if(step==='live'&&active)
    return <ConnectedSession conn={active} onBack={()=>{setStep('list');setActive(null);}} onTrain={()=>setStep('flow')}/>;

  const pendientes=conns.filter(c=>c.status==='pending');
  const aceptadas=conns.filter(c=>c.status==='accepted');

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 110px'}}>
        <div style={{marginBottom:20}}>
          <Logo size={20}/>
          <div style={{fontFamily:UI,fontSize:14,color:TEXT2,marginTop:8}}>Tus compañeros</div>
        </div>

        {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',marginBottom:12}}>{err}</div>}

        {loading? (
          <div style={{padding:'40px 0',textAlign:'center',fontFamily:UI,fontSize:13,color:TEXT3}}>Cargando…</div>
        ):(!conns.length? (
          /* Sin conexiones: es el estado real de una cuenta nueva */
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'40px 10px'}}>
            <div style={{width:96,height:96,borderRadius:'50%',background:CARD,border:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22}}>
              <Isotype h={40} color={TEXT3}/>
            </div>
            <div style={{fontFamily:DSP,fontWeight:700,fontSize:22,color:TEXT1,letterSpacing:'-0.01em',marginBottom:8}}>Todavía no tienes un GymBro.</div>
            <div style={{fontFamily:UI,fontSize:14,color:TEXT2,lineHeight:1.5,maxWidth:260,marginBottom:26}}>Entrena con alguien y avancen juntos.</div>
            <PrimaryBtn onClick={()=>setSheet(true)} icon="plus">Agregar GymBro / GymSis</PrimaryBtn>
          </div>
        ):(
          <>
            {pendientes.length>0&&(
              <>
                <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Solicitudes</div>
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                  {pendientes.map(c=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:13,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'13px 14px'}}>
                      <div style={{width:44,height:44,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{initials(c.name)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:UI,fontWeight:500,fontSize:14.5,color:TEXT1}}>{c.name}</div>
                        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,marginTop:2}}>@{c.username}</div>
                      </div>
                      {c.incoming? (
                        <div style={{display:'flex',gap:7,flexShrink:0}}>
                          <button onClick={()=>respond(c,'accept')} style={{height:32,padding:'0 13px',borderRadius:R,background:OW,border:'none',cursor:'pointer',fontFamily:UI,fontWeight:500,fontSize:12.5,color:BG,outline:'none'}}>Aceptar</button>
                          <button onClick={()=>respond(c,'reject')} style={{height:32,padding:'0 11px',borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',fontFamily:UI,fontSize:12.5,color:TEXT2,outline:'none'}}>No</button>
                        </div>
                      ):(
                        <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase',flexShrink:0}}>Enviada</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {aceptadas.length>0&&(
              <>
                <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Compañeros</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {aceptadas.map(c=>(
                    <button key={c.id} onClick={()=>{setActive(c);setStep('live');}} style={{display:'flex',alignItems:'center',gap:13,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'13px 14px',cursor:'pointer',outline:'none',textAlign:'left'}}>
                      <div style={{width:44,height:44,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{initials(c.name)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                          <span style={{fontFamily:UI,fontWeight:500,fontSize:14.5,color:TEXT1}}>{c.name}</span>
                          <span style={{fontFamily:MONO,fontSize:8.5,color:c.sex==='Mujer'?SAGE:STEEL,letterSpacing:'0.08em',textTransform:'uppercase',padding:'2px 7px',background:c.sex==='Mujer'?'rgba(159,216,154,0.12)':'rgba(138,162,192,0.12)',borderRadius:5}}>{label(c)}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <StatusDot status={c.today?'progressing':'maintaining'}/>
                          <span style={{fontFamily:UI,fontSize:12,color:c.today?SAGE:TEXT3}}>
                            {c.today?'Entrenando hoy'
                              :c.days_since==null?'Sin entrenos todavía'
                              :c.days_since===0?'Entrenó hoy'
                              :c.days_since===1?'Último entreno: ayer'
                              :`Último entreno: hace ${c.days_since} días`}
                          </span>
                        </div>
                      </div>
                      <Icon name="chevron-right" size={18} color={TEXT3}/>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ))}
      </div>

      {conns.length>0&&(
        <button onClick={()=>setSheet(true)} style={{position:'absolute',right:20,bottom:100,width:54,height:54,borderRadius:'50%',background:OW,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(0,0,0,0.4)',outline:'none',zIndex:20}}>
          <Icon name="plus" size={22} color={BG} sw={2}/>
        </button>
      )}

      <BottomSheet open={sheet} onClose={()=>{setSheet(false);load();}} title="Agregar compañero/a">
        <div style={{display:'flex',gap:8,background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:3,marginBottom:18}}>
          {[['user','Buscar por usuario'],['qr','Tu código QR']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,height:34,borderRadius:6,background:mode===m?OW:'transparent',border:'none',cursor:'pointer',fontFamily:UI,fontSize:12,fontWeight:mode===m?500:400,color:mode===m?BG:TEXT2,outline:'none'}}>{l}</button>
          ))}
        </div>
        {mode==='user' ? <UserSearch onAdded={load}/> : <QRPanel/>}
      </BottomSheet>
    </div>
  );
}

/* ── Buscador real de usuarios ────────────────────────── */
function UserSearch({onAdded}){
  const { CARD,OW,BG,INPUT,BORDER,BDEF,ELEV,TEXT1,TEXT2,TEXT3,UI,MONO,R,Icon } = GY;
  const [q,setQ]=useStateGY('');
  const [rows,setRows]=useStateGY([]);
  const [busy,setBusy]=useStateGY(false);
  const [err,setErr]=useStateGY('');

  /* Busca sola al escribir, con pausa para no lanzar una peticion por tecla. */
  useEffectGY(()=>{
    if(q.trim().length<2){ setRows([]); return; }
    let alive=true;
    const t=setTimeout(()=>{
      GY.api.searchUsers(q.trim())
        .then(r=>{ if(alive) setRows(r||[]); })
        .catch(()=>{ if(alive) setRows([]); });
    },280);
    return ()=>{alive=false;clearTimeout(t);};
  },[q]);

  const add=async(u)=>{
    if(busy) return;
    setBusy(true); setErr('');
    try{
      await GY.api.addConnection(u.username);
      setRows(rs=>rs.map(r=>r.username===u.username?{...r,connection:'pending'}:r));
      onAdded&&onAdded();
    }catch(e){ setErr(e.message||'No se pudo enviar la solicitud'); }
    finally{ setBusy(false); }
  };

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,background:INPUT,border:`1px solid ${BDEF}`,borderRadius:R,height:46,padding:'0 14px',marginBottom:16}}>
        <Icon name="search" size={16} color={TEXT3}/>
        <span style={{fontFamily:UI,fontSize:14,color:TEXT3}}>@</span>
        <input
          value={q} onChange={e=>setQ(e.target.value)} placeholder="buscar usuario…" autoComplete="off"
          style={{flex:1,background:'transparent',border:'none',outline:'none',fontFamily:UI,fontSize:14,color:TEXT1}}/>
      </div>
      {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',marginBottom:10}}>{err}</div>}
      {q.trim().length>=2&&!rows.length&&(
        <div style={{padding:'18px 0',textAlign:'center',fontFamily:UI,fontSize:13,color:TEXT3}}>Nadie con ese nombre.</div>
      )}
      {rows.map((s,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:`1px solid ${BORDER}`}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:ELEV,border:`1px solid ${BDEF}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontFamily:UI,fontWeight:500,fontSize:13,color:TEXT1}}>{s.name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1}}>{s.name}</div>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3}}>@{s.username}</div>
          </div>
          {s.connection
            ? <span style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.08em',textTransform:'uppercase',flexShrink:0}}>{s.connection==='accepted'?'Ya conectados':'Pendiente'}</span>
            : <button onClick={()=>add(s)} disabled={busy} style={{height:34,padding:'0 16px',borderRadius:R,background:OW,border:'none',cursor:'pointer',fontFamily:UI,fontWeight:500,fontSize:12.5,color:BG,outline:'none',flexShrink:0}}>Agregar</button>}
        </div>
      ))}
    </div>
  );
}

/* ── Codigo QR propio ─────────────────────────────────── */
function QRPanel(){
  const { TEXT1,TEXT2,TEXT3,UI,MONO,QRPlaceholder } = GY;
  const [me,setMe]=useStateGY(null);
  useEffectGY(()=>{
    let alive=true;
    GY.api.getMe().then(u=>{ if(alive) setMe(u); }).catch(()=>{});
    return ()=>{alive=false;};
  },[]);
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 0 8px'}}>
      <div style={{marginBottom:16}}><QRPlaceholder size={180}/></div>
      <div style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,marginBottom:4}}>{me?me.name:''}</div>
      <div style={{fontFamily:MONO,fontSize:11,color:TEXT3,marginBottom:14}}>@{me?me.username:''}</div>
      <div style={{fontFamily:UI,fontSize:13,color:TEXT2,textAlign:'center',lineHeight:1.5,maxWidth:250}}>
        Comparte tu usuario para que te agreguen. El escaneo de códigos llegará en una próxima versión.
      </div>
    </div>
  );
}

/* ── Sesion del companero ─────────────────────────────── */
function ConnectedSession({conn,onBack,onTrain}){
  const { BG,CARD,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,PrimaryBtn } = GY;
  const [data,setData]=useStateGY(null);
  const [loading,setLoading]=useStateGY(true);

  /* Refresco periodico: mientras el companero registra series, esta vista
     se actualiza sola sin que haya que salir y entrar. */
  useEffectGY(()=>{
    let alive=true;
    const pull=()=>GY.api.getConnectionSession(conn.id)
      .then(r=>{ if(alive){ setData(r); setLoading(false); } })
      .catch(()=>{ if(alive){ setData(null); setLoading(false); } });
    pull();
    const t=setInterval(pull,15000);
    return ()=>{alive=false;clearInterval(t);};
  },[conn.id]);

  const muscles=(data&&data.muscles)||[];
  const titulo=muscles.length
    ? muscles.map(m=>m.muscle).join(' y ')
    : 'Sin sesión hoy';

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 110px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          {muscles.length>0&&(
            <span style={{fontFamily:MONO,fontSize:10,color:SAGE,letterSpacing:'0.1em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:SAGE,boxShadow:`0 0 6px ${SAGE}`}}></span>En vivo
            </span>
          )}
          <span style={{width:20}}></span>
        </div>
        <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>
          {conn.name.split(' ')[0]}
        </div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:28,color:TEXT1,letterSpacing:'-0.01em',marginBottom:20}}>{loading?'Cargando…':titulo}</div>

        {!loading&&!muscles.length&&(
          <div style={{padding:'20px 0 26px',textAlign:'center'}}>
            <div style={{fontFamily:UI,fontSize:14,color:TEXT2,marginBottom:20}}>
              {conn.name.split(' ')[0]} todavía no ha registrado nada hoy.
            </div>
            <PrimaryBtn onClick={onTrain} color={SAGE} icon="chevron-right">Entrenar juntos</PrimaryBtn>
          </div>
        )}

        {muscles.map((m,i)=>(
          <div key={i} style={{marginBottom:14}}>
            <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>{m.muscle}</div>
            {(m.exercises||[]).map((ex,j)=>{
              const hechas=(ex.series||[]).filter(s=>s.done);
              return(
                <div key={j} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'14px 15px',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:hechas.length?11:0}}>
                    <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>{ex.name}</span>
                    {ex.done&&<Icon name="check" size={15} color={SAGE} sw={2.4}/>}
                  </div>
                  {hechas.map((s,k)=>(
                    <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderTop:`1px solid ${BORDER}`}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                        <span style={{fontFamily:MONO,fontSize:11,color:TEXT3}}>{k+1}</span>
                        <span style={{fontFamily:DSP,fontWeight:700,fontSize:15,color:TEXT1}}>{s.kg}<span style={{fontFamily:MONO,fontSize:9,color:TEXT3,marginLeft:2}}>kg</span></span>
                        <span style={{fontFamily:DSP,fontWeight:700,fontSize:15,color:TEXT1}}>{s.reps}<span style={{fontFamily:MONO,fontSize:9,color:TEXT3,marginLeft:2}}>reps</span></span>
                      </div>
                    </div>
                  ))}
                  {!hechas.length&&<div style={{fontFamily:UI,fontSize:12.5,color:TEXT3,paddingTop:9,borderTop:`1px solid ${BORDER}`,marginTop:9}}>Sin series registradas</div>}
                </div>
              );
            })}
          </div>
        ))}

        {muscles.length>0&&(
          <div style={{marginTop:6}}>
            <PrimaryBtn onClick={onTrain} color={SAGE} icon="chevron-right">Entrenar juntos</PrimaryBtn>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window.GB,{ GymBroScreen });
