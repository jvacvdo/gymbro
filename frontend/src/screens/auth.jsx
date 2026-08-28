// GymBro — Auth: Welcome, Login (+ Google), 3-step Register
const { BG,CARD,ELEV,INPUT,OW,SAGE,STEEL,BORDER,BDEF,BSTRONG,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,
        Icon,Isotype,Logo,StatusBar,Field,PrimaryBtn,GhostLink,QRPlaceholder } = window.GB;
const { useState:useStateA } = React;

/* ── Welcome ─────────────────────────────────────────── */
function WelcomeScreen({onStart,onLogin}){
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{position:'absolute',top:110,left:'50%',transform:'translateX(-50%)',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle, rgba(159,216,154,0.16) 0%, rgba(159,216,154,0) 68%)',pointerEvents:'none'}}></div>
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 28px',position:'relative'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}>
          <Isotype h={64} color={TEXT1}/>
          <div style={{marginTop:22,marginBottom:26}}><Logo size={30}/></div>
          <div style={{fontFamily:DSP,fontWeight:700,fontSize:40,lineHeight:1.04,color:TEXT1,letterSpacing:'-0.02em',marginBottom:14}}>Entrena con<br/>certeza.</div>
          <div style={{fontFamily:UI,fontSize:16,lineHeight:1.5,color:TEXT2,maxWidth:290}}>Tus datos, traducidos al instante. Sabe si tu esfuerzo rinde y qué mover para seguir subiendo.</div>
        </div>
        <div style={{paddingBottom:34,display:'flex',flexDirection:'column',gap:12}}>
          <PrimaryBtn onClick={onStart} icon="chevron-right">Empezar</PrimaryBtn>
          <button onClick={onLogin} style={{width:'100%',height:52,background:'transparent',border:`1px solid ${BDEF}`,borderRadius:R,fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,cursor:'pointer',outline:'none'}}>Ya tengo cuenta</button>
        </div>
      </div>
    </div>
  );
}

/* ── Login (+ Google) ────────────────────────────────── */
function GoogleG({size=18}){
  return(
    <svg width={size} height={size} viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
  );
}
function LoginScreen({onBack,onDone,onToRegister}){
  const [f,setF]=useStateA({email:'',pass:''});
  const set=k=>e=>setF(v=>({...v,[k]:e.target.value}));
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 24px 24px'}}>
        <div style={{display:'flex',justifyContent:'center',position:'relative',marginBottom:26}}>
          <button onClick={onBack} style={{position:'absolute',left:0,top:0,background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
          <Logo size={20}/>
        </div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1,letterSpacing:'-0.02em',marginBottom:24}}>Bienvenido de vuelta</div>
        <Field label="Email" type="email" placeholder="alex@correo.com" value={f.email} onChange={set('email')}/>
        <Field label="Contraseña" type="password" placeholder="••••••••" value={f.pass} onChange={set('pass')}/>
        <div style={{marginTop:10}}><PrimaryBtn onClick={onDone}>Iniciar sesión</PrimaryBtn></div>
        <div style={{textAlign:'center',marginTop:10,marginBottom:18}}>
          <GhostLink onClick={()=>{}}>¿Olvidaste tu contraseña?</GhostLink>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <div style={{flex:1,height:1,background:BORDER}}></div>
          <span style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase'}}>o continúa con</span>
          <div style={{flex:1,height:1,background:BORDER}}></div>
        </div>
        <button onClick={onDone} style={{width:'100%',height:52,background:CARD,border:`1px solid ${BDEF}`,borderRadius:R,cursor:'pointer',outline:'none',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{position:'absolute',left:18,display:'flex'}}><GoogleG size={19}/></span>
          <span style={{fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1}}>Iniciar sesión con Google</span>
        </button>
        <div style={{textAlign:'center',marginTop:18}}>
          <GhostLink onClick={onToRegister}>¿No tienes cuenta? <span style={{color:TEXT1}}>Regístrate</span></GhostLink>
        </div>
      </div>
    </div>
  );
}

/* ── Register — 3 steps ──────────────────────────────── */
function StepDots({step}){
  return(
    <div style={{display:'flex',gap:7,justifyContent:'center',marginBottom:22}}>
      {[0,1,2].map(i=><span key={i} style={{width:i===step?22:7,height:7,borderRadius:999,background:i===step?OW:BSTRONG,transition:'all 220ms ease'}}></span>)}
    </div>
  );
}
function ChoiceCard({label,selected,onClick}){
  return(
    <button onClick={onClick} style={{width:'100%',textAlign:'left',background:selected?'var(--gb-elev)':CARD,border:`${selected?2:1}px solid ${selected?TEXT1:BDEF}`,borderRadius:R,padding:selected?'14px 15px':'15px 16px',marginBottom:9,cursor:'pointer',outline:'none',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
      <span style={{fontFamily:UI,fontSize:14.5,fontWeight:selected?500:400,color:selected?TEXT1:TEXT2}}>{label}</span>
      {selected&&<Icon name="check" size={17} color={SAGE} sw={2.4}/>}
    </button>
  );
}
function SexToggle({value,onChange}){
  const opts=['Hombre','Mujer','Prefiero no decir'];
  return(
    <div style={{display:'flex',gap:7}}>
      {opts.map(o=>(
        <button key={o} onClick={()=>onChange(o)} style={{flex:o==='Prefiero no decir'?1.4:1,height:44,borderRadius:R,background:value===o?OW:'transparent',border:`1px solid ${value===o?OW:BDEF}`,cursor:'pointer',fontFamily:UI,fontSize:12.5,fontWeight:value===o?500:400,color:value===o?BG:TEXT2,outline:'none',padding:'0 6px'}}>{o}</button>
      ))}
    </div>
  );
}

function RegisterScreen({onBack,onDone,onToLogin}){
  const [step,setStep]=useStateA(0);
  const [q,setQ]=useStateA({goal:'',exp:'',freq:''});
  const [m,setM]=useStateA({weight:'',height:'',age:'',sex:'Prefiero no decir'});
  const [a,setA]=useStateA({name:'',user:'',email:'',pass:'',pass2:''});
  const setQk=k=>v=>setQ(s=>({...s,[k]:v}));
  const setAk=k=>e=>setA(s=>({...s,[k]:e.target.value}));
  const setMk=k=>e=>setM(s=>({...s,[k]:e.target.value}));
  const back=()=>step===0?onBack():setStep(step-1);

  const GOALS=['Ganar músculo y fuerza','Perder grasa corporal','Mejorar mi rendimiento físico','Mantenerme activo y saludable'];
  const EXP=['Soy nuevo, menos de 6 meses','Entre 6 meses y 2 años','Más de 2 años','Entrené antes y estoy volviendo'];
  const FREQ=['1–2 días','3–4 días','5–6 días','Depende de mi semana'];

  const Head=({t,s})=><div style={{marginBottom:18}}>
    <div style={{fontFamily:DSP,fontWeight:700,fontSize:28,color:TEXT1,letterSpacing:'-0.02em',lineHeight:1.05}}>{t}</div>
    {s&&<div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,marginTop:8,lineHeight:1.45}}>{s}</div>}
  </div>;
  const QLabel=({children})=><div style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1,margin:'18px 0 10px'}}>{children}</div>;

  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{padding:'0 24px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <button onClick={back} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
        </div>
        <StepDots step={step}/>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 24px 28px'}}>
        {step===0&&(
          <>
            <Head t="¿Qué te trae al gym?" s="Esto nos ayuda a entender tu progreso."/>
            <QLabel>¿Cuál es tu objetivo principal?</QLabel>
            {GOALS.map(g=><ChoiceCard key={g} label={g} selected={q.goal===g} onClick={()=>setQk('goal')(g)}/>)}
            <QLabel>¿Cuánto tiempo llevas entrenando?</QLabel>
            {EXP.map(g=><ChoiceCard key={g} label={g} selected={q.exp===g} onClick={()=>setQk('exp')(g)}/>)}
            <QLabel>¿Cuántos días por semana puedes entrenar?</QLabel>
            {FREQ.map(g=><ChoiceCard key={g} label={g} selected={q.freq===g} onClick={()=>setQk('freq')(g)}/>)}
            <div style={{marginTop:18}}><PrimaryBtn onClick={()=>setStep(1)} icon="chevron-right">Continuar</PrimaryBtn></div>
          </>
        )}
        {step===1&&(
          <>
            <Head t="Tu punto de partida" s="Este paso es opcional. Puedes completarlo después desde tu perfil."/>
            <Field label="Peso actual" optional type="number" placeholder="0" suffix="KG" value={m.weight} onChange={setMk('weight')}/>
            <Field label="Altura" optional type="number" placeholder="0" suffix="CM" value={m.height} onChange={setMk('height')}/>
            <Field label="Edad" optional type="number" placeholder="0" suffix="AÑOS" value={m.age} onChange={setMk('age')}/>
            <div style={{fontFamily:MONO,fontSize:10,color:TEXT3,letterSpacing:'0.14em',textTransform:'uppercase',margin:'4px 0 9px'}}>Sexo · opcional</div>
            <SexToggle value={m.sex} onChange={v=>setM(s=>({...s,sex:v}))}/>
            <div style={{textAlign:'center',margin:'16px 0 4px'}}><GhostLink onClick={()=>setStep(2)}>Completar después →</GhostLink></div>
            <PrimaryBtn onClick={()=>setStep(2)} icon="chevron-right">Continuar</PrimaryBtn>
          </>
        )}
        {step===2&&(
          <>
            <Head t="Crea tu cuenta"/>
            <Field label="Nombre completo" placeholder="Álex Moreno" value={a.name} onChange={setAk('name')}/>
            <Field label="Nombre de usuario" prefix="@" placeholder="alexmoreno" value={a.user} onChange={setAk('user')}/>
            <Field label="Email" type="email" placeholder="alex@correo.com" value={a.email} onChange={setAk('email')}/>
            <Field label="Contraseña" type="password" placeholder="••••••••" value={a.pass} onChange={setAk('pass')}/>
            <Field label="Confirmar contraseña" type="password" placeholder="••••••••" value={a.pass2} onChange={setAk('pass2')}/>
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'16px',display:'flex',gap:15,alignItems:'center',margin:'6px 0 20px'}}>
              <QRPlaceholder size={90}/>
              <div>
                <div style={{fontFamily:UI,fontWeight:500,fontSize:14,color:TEXT1,marginBottom:5}}>Tu código GymBro</div>
                <div style={{fontFamily:UI,fontSize:12,color:TEXT2,lineHeight:1.45}}>Otros usuarios pueden escanearlo para entrenarse contigo.</div>
              </div>
            </div>
            <PrimaryBtn onClick={onDone}>Crear cuenta</PrimaryBtn>
            <div style={{textAlign:'center',marginTop:14}}>
              <GhostLink onClick={onToLogin}>¿Ya tienes cuenta? <span style={{color:TEXT1}}>Inicia sesión</span></GhostLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window.GB,{ WelcomeScreen, LoginScreen, RegisterScreen });
