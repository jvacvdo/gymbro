// GymBro — Perfil: athlete view + Apariencia toggle, Trainer button, Plan screen, Trainer view
const PF = window.GB;
const { useState:useStatePF, useEffect:useEffectPF } = React;

function PerfilScreen({light,onToggle,onLogout}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar,ThemeToggle,PrimaryBtn,OutlineBtn,BottomSheet,Field } = PF;
  const [view,setView]=useStatePF('profile');   // profile | plan
  const [me,setMe]=useStatePF(null);
  const [stats,setStats]=useStatePF(null);
  const [edit,setEdit]=useStatePF(false);
  const [borrar,setBorrar]=useStatePF(false);
  const [aviso,setAviso]=useStatePF('');

  useEffectPF(()=>{
    let alive=true;
    PF.api.getMe().then(u=>{ if(alive) setMe(u); }).catch(()=>{});
    PF.api.getStats().then(s=>{ if(alive) setStats(s); }).catch(()=>{});
    return ()=>{alive=false;};
  },[]);

  const nombre = me && me.name ? me.name : 'Tu perfil';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || '—';
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const alta = me && me.created_at
    ? (d=>`Miembro desde ${MESES[d.getMonth()]} ${d.getFullYear()}`)(new Date(me.created_at))
    : '';

  // Volumen acumulado: en kg hasta 1000, luego k y M. Un numero de siete
  // cifras no cabe en la columna y tampoco se lee de un vistazo.
  const fmtVol = kg =>
    kg>=1e6 ? `${(kg/1e6).toFixed(1)}M kg`
    : kg>=1e3 ? `${Math.round(kg/1e3)}k kg`
    : `${kg} kg`;

  const sesiones = stats ? stats.sessions : 0;
  const semanas  = stats ? stats.streak_weeks : 0;
  const STATS = [
    ['Sesiones', String(sesiones)],
    ['Volumen',  fmtVol(stats ? stats.volume_kg : 0)],
    ['Racha',    semanas===1?'1 sem':`${semanas} sem`],
  ];
  const frase =
    sesiones===0 ? 'Aún no has entrenado. Tu primera sesión empieza aquí.'
    : semanas>=2 ? `Llevas ${semanas} semanas sin faltar. Eso se nota.`
    : 'Buen comienzo. Lo que cuenta ahora es repetir.';

  // Datos del registro. Se piden al crear la cuenta, asi que devolverlos
  // visibles es parte del trato.
  const FISICO = me ? [
    ['Peso',   me.weight!=null?`${me.weight} kg`:null],
    ['Altura', me.height!=null?`${me.height} cm`:null],
    ['Edad',   me.age!=null?`${me.age} años`:null],
    ['Sexo',   me.sex||null],
  ].filter(([,v])=>v) : [];

  if(view==='plan') return <PlanScreen onBack={()=>setView('profile')}/>;

  /* Cada ajuste lleva su accion. Los que aun no existen lo dicen en vez de
     no hacer nada al pulsarlos. */
  const proximamente=()=>setAviso('Esa sección todavía no está disponible.');
  const SETTINGS=[
    ['pencil','Editar perfil',null,()=>{setAviso('');setEdit(true);}],
    ['bell','Notificaciones',null,proximamente],
    ['ruler','Unidades','kg',proximamente],
    ['shield','Privacidad',null,proximamente],
    ['crown','Plan actual',null,()=>setView('plan')],
    ['logout','Cerrar sesión',null,()=>{PF.api.logout();onLogout&&onLogout();}],
  ];

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
          <div style={{fontFamily:DSP,fontWeight:400,fontSize:19,color:TEXT1,lineHeight:1.25,letterSpacing:'-0.01em'}}>{frase}</div>
        </div>

        {/* Stats strip */}
        <div style={{display:'flex',background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'16px 0',marginBottom:24}}>
          {STATS.map(([l,v],i)=>(
            <div key={l} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,borderRight:i<2?`1px solid ${BORDER}`:'none'}}>
              <span style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>{l}</span>
              <span style={{fontFamily:DSP,fontWeight:700,fontSize:20,color:TEXT1,lineHeight:1}}>{v}</span>
            </div>
          ))}
        </div>

        {/* Datos fisicos */}
        {FISICO.length>0&&(
          <>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>Tus datos</div>
            <div style={{display:'flex',flexWrap:'wrap',background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'4px 0',marginBottom:24}}>
              {FISICO.map(([l,v])=>(
                <div key={l} style={{width:'50%',display:'flex',flexDirection:'column',gap:4,padding:'12px 17px'}}>
                  <span style={{fontFamily:MONO,fontSize:8.5,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>{l}</span>
                  <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,lineHeight:1}}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

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
            <button key={i} onClick={s[3]} style={{width:'100%',display:'flex',alignItems:'center',gap:13,padding:'14px 16px',background:'transparent',border:'none',borderBottom:i<SETTINGS.length-1?`1px solid ${BORDER}`:'none',cursor:'pointer',outline:'none',textAlign:'left'}}>
              <Icon name={s[0]} size={17} color={s[1]==='Cerrar sesión'?'#FF6B6B':TEXT2}/>
              <span style={{flex:1,fontFamily:UI,fontSize:14,color:s[1]==='Cerrar sesión'?'#FF6B6B':TEXT1}}>{s[1]}</span>
              {s[2]&&<span style={{fontFamily:MONO,fontSize:10,color:TEXT2,letterSpacing:'0.06em',textTransform:'uppercase'}}>{s[2]}</span>}
              <Icon name="chevron-right" size={16} color={TEXT3}/>
            </button>
          ))}
        </div>
        {aviso&&<div style={{fontFamily:UI,fontSize:12.5,color:TEXT3,marginTop:-14,marginBottom:22,paddingLeft:2}}>{aviso}</div>}

        {/* Modo Trainer — bloqueado hasta que exista el plan de pago */}
        <button onClick={()=>setView('plan')} style={{width:'100%',display:'flex',alignItems:'center',gap:13,background:CARD,border:`1px solid ${BDEF}`,borderRadius:R,padding:'16px 16px',cursor:'pointer',outline:'none',textAlign:'left'}}>
          <div style={{width:38,height:38,borderRadius:R,background:'var(--gb-elev)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon name="dumbbell" size={18} color={TEXT2}/></div>
          <div style={{flex:1}}>
            <div style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>Modo Trainer</div>
          </div>
          <Icon name="lock" size={17} color={TEXT3}/>
        </button>
        <div style={{fontFamily:UI,fontSize:12,color:TEXT3,marginTop:8,paddingLeft:2}}>Gestiona a las personas que entrenas. Próximamente.</div>

        {/* Zona de peligro. Separada del resto a proposito. */}
        <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${BORDER}`}}>
          <button onClick={()=>setBorrar(true)} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',fontFamily:UI,fontSize:13,color:'#FF6B6B'}}>
            Borrar mi cuenta
          </button>
          <div style={{fontFamily:UI,fontSize:11.5,color:TEXT3,marginTop:6,lineHeight:1.5}}>
            Se borran tus entrenamientos, tu progreso y tus compañeros. No se puede deshacer.
          </div>
        </div>
      </div>

      <EditProfileSheet open={edit} me={me} onClose={()=>setEdit(false)} onSaved={u=>{setMe(u);setEdit(false);}}/>
      <DeleteAccountSheet open={borrar} me={me} onClose={()=>setBorrar(false)} onDeleted={()=>onLogout&&onLogout()}/>
    </div>
  );
}

/* ── Borrar cuenta ───────────────────────────────────── */
function DeleteAccountSheet({open,me,onClose,onDeleted}){
  const { TEXT1,TEXT2,TEXT3,UI,MONO,BottomSheet,Field,OutlineBtn,R,BG } = PF;
  const [txt,setTxt]=useStatePF('');
  const [busy,setBusy]=useStatePF(false);
  const [err,setErr]=useStatePF('');
  /* Se pide escribir el propio usuario: un boton de "si, borrar" se pulsa
     sin leer, y esto no tiene deshacer. */
  const clave=me&&me.username?me.username:'';
  const puede=txt.trim()===clave&&clave!=='';

  useEffectPF(()=>{ if(open){ setTxt(''); setErr(''); } },[open]);

  const borrar=async()=>{
    if(busy||!puede) return;
    setBusy(true); setErr('');
    try{ await PF.api.deleteMe(); onDeleted(); }
    catch(e){ setErr(e.message||'No se pudo borrar la cuenta'); setBusy(false); }
  };

  return(
    <BottomSheet open={open} onClose={onClose} title="Borrar mi cuenta">
      <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,lineHeight:1.55,marginBottom:14}}>
        Esto borra para siempre tu cuenta, todos tus entrenamientos, tus series
        registradas y tus conexiones con otros usuarios. <span style={{color:TEXT1}}>No hay forma de recuperarlo.</span>
      </div>
      <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,marginBottom:10}}>
        Para confirmar, escribe tu usuario: <span style={{fontFamily:MONO,fontSize:12.5,color:TEXT1}}>{clave}</span>
      </div>
      <Field label="Tu usuario" prefix="@" placeholder={clave} value={txt} onChange={e=>setTxt(e.target.value)}/>
      {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',marginBottom:10}}>{err}</div>}
      <button onClick={borrar} disabled={!puede||busy}
        style={{width:'100%',height:52,borderRadius:R,background:puede?'#FF6B6B':'var(--gb-input)',border:'none',cursor:puede?'pointer':'default',fontFamily:UI,fontWeight:500,fontSize:15,color:puede?BG:TEXT3,outline:'none',marginBottom:10}}>
        {busy?'Borrando…':'Borrar mi cuenta para siempre'}
      </button>
      <OutlineBtn onClick={onClose}>Cancelar</OutlineBtn>
    </BottomSheet>
  );
}

/* ── Editar perfil ───────────────────────────────────── */
function EditProfileSheet({open,me,onClose,onSaved}){
  const { TEXT2,UI,BottomSheet,Field,PrimaryBtn,OutlineBtn } = PF;
  const [f,setF]=useStatePF({name:'',username:'',weight:'',height:'',age:''});
  const [busy,setBusy]=useStatePF(false);
  const [err,setErr]=useStatePF('');

  /* Al abrir se rellena con lo que ya hay: editar no deberia empezar en blanco. */
  useEffectPF(()=>{
    if(open&&me) setF({
      name:me.name||'', username:me.username||'',
      weight:me.weight==null?'':String(me.weight),
      height:me.height==null?'':String(me.height),
      age:me.age==null?'':String(me.age),
    });
    if(open) setErr('');
  },[open,me]);

  const set=k=>e=>setF(s=>({...s,[k]:e.target.value}));
  const guardar=async()=>{
    if(busy) return;
    setBusy(true); setErr('');
    try{
      const u=await PF.api.updateMe({
        name:f.name, username:f.username,
        weight:f.weight===''?null:Number(f.weight),
        height:f.height===''?null:Number(f.height),
        age:f.age===''?null:Number(f.age),
      });
      onSaved(u);
    }catch(e){ setErr(e.message||'No se pudo guardar'); }
    finally{ setBusy(false); }
  };

  return(
    <BottomSheet open={open} onClose={onClose} title="Editar perfil">
      <Field label="Nombre completo" value={f.name} onChange={set('name')}/>
      <Field label="Nombre de usuario" prefix="@" value={f.username} onChange={set('username')}/>
      <Field label="Peso" optional type="number" suffix="KG" value={f.weight} onChange={set('weight')}/>
      <Field label="Altura" optional type="number" suffix="CM" value={f.height} onChange={set('height')}/>
      <Field label="Edad" optional type="number" suffix="AÑOS" value={f.age} onChange={set('age')}/>
      {err&&<div style={{fontFamily:UI,fontSize:12.5,color:'#E0A0A0',marginBottom:10}}>{err}</div>}
      <div style={{marginBottom:10}}>
        <PrimaryBtn onClick={guardar} disabled={busy||!f.name.trim()||!f.username.trim()} icon="check">{busy?'Guardando…':'Guardar cambios'}</PrimaryBtn>
      </div>
      <OutlineBtn onClick={onClose}>Cancelar</OutlineBtn>
    </BottomSheet>
  );
}

/* ── Plan Actual screen ──────────────────────────────── */
function PlanScreen({onBack}){
  const { BG,CARD,ELEV,OW,SAGE,STEEL,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
          Icon,StatusBar } = PF;
  /* Los planes de pago aun no tienen pasarela. Se muestran como lo que son
     —lo que viene— en vez de un boton de compra que no cobra nada. */
  const PLANS=[
    {id:'free',name:'Free',price:null,glow:null,feats:['Registro ilimitado','Progreso básico','GymBro / GymSis','Sin Modo Trainer'],cta:'Tu plan actual',disabled:true},
    {id:'pro',name:'Pro',price:'Próximamente',glow:'steel',feats:['Todo lo de Free','Análisis de IA completo','Detección de estancamiento','Gráficos detallados'],cta:'Aún no disponible',disabled:true},
    {id:'trainer',name:'Trainer',price:'Próximamente',glow:'sage',feats:['Todo lo de Pro','Modo Trainer activo','Hasta 20 clientes','Panel de gestión de clientes','Progreso en tiempo real'],cta:'Aún no disponible',disabled:true},
  ];
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
        </div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1,letterSpacing:'-0.02em',marginBottom:8}}>Planes</div>
        <div style={{fontFamily:UI,fontSize:14,color:TEXT2,lineHeight:1.45,marginBottom:22}}>Hoy GymBro es gratis y completo. Estos son los planes en los que estamos trabajando.</div>
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
                <div style={{width:'100%',height:46,borderRadius:R,background:'var(--gb-input)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT3}}>{pl.cta}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontFamily:UI,fontSize:11,color:TEXT3,textAlign:'center',marginTop:18}}>Todavía no hay cobros. Te avisaremos antes de activar ningún plan.</div>
      </div>
    </div>
  );
}

/* TrainerView, ModeSelector y ClientDashboard vivian aqui con clientes
   inventados (Maria Lopez, Diego Ruiz...). El Modo Trainer esta bloqueado
   hasta que exista el plan de pago, asi que se retiran en vez de dejar
   pantallas de mentira accesibles. Recuperables del historial de git. */

Object.assign(window.GB,{ PerfilScreen });
