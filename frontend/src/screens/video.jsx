// GymBro — Vídeos de técnica.
//
// Dos niveles a proposito. Si el ejercicio tiene video elegido, se reproduce
// dentro de la app. Si no, se abre una busqueda en YouTube. Asi los 45
// ejercicios tienen algo desde el primer dia, y el catalogo curado va
// creciendo sin tocar codigo: basta anadir al JSON del backend.
//
// Se usa youtube-nocookie: la politica de privacidad dice que no hay
// seguimiento publicitario y el dominio normal planta cookies de anuncios.
const VD = window.GB;
const { useState:useStateVD, useEffect:useEffectVD } = React;

// El mapa se pide una vez y se comparte entre pantallas.
let mapaVideos = null;
let cargaEnCurso = null;
function cargarVideos(){
  if(mapaVideos) return Promise.resolve(mapaVideos);
  if(!cargaEnCurso){
    cargaEnCurso = VD.api.getVideos()
      .then(m=>{ mapaVideos = m || {}; return mapaVideos; })
      .catch(()=>{ mapaVideos = {}; return mapaVideos; });
  }
  return cargaEnCurso;
}

function urlBusqueda(ejercicio){
  return 'https://www.youtube.com/results?search_query=' +
    encodeURIComponent('como hacer ' + ejercicio + ' tecnica correcta');
}

/* Boton discreto para abrir la ficha de tecnica. */
function VideoBtn({exercise,onOpen}){
  const { TEXT2,UI,BDEF,R,Icon } = VD;
  return(
    <button onClick={()=>onOpen(exercise)}
      style={{display:'inline-flex',alignItems:'center',gap:6,height:30,padding:'0 11px',borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,cursor:'pointer',fontFamily:UI,fontSize:11.5,color:TEXT2,outline:'none'}}>
      <Icon name="play" size={12} color={TEXT2}/>Ver técnica
    </button>
  );
}

/* Hoja con el reproductor o el enlace de busqueda. */
function VideoSheet({exercise,onClose}){
  const { CARD,BORDER,BDEF,TEXT1,TEXT2,TEXT3,UI,DSP,R,BottomSheet,OutlineBtn } = VD;
  const [vid,setVid]=useStateVD(undefined);   // undefined = cargando

  useEffectVD(()=>{
    if(!exercise){ setVid(undefined); return; }
    let vivo=true;
    cargarVideos().then(m=>{ if(vivo) setVid(m[exercise] || null); });
    return ()=>{vivo=false;};
  },[exercise]);

  return(
    <BottomSheet open={!!exercise} onClose={onClose} title={exercise||''}>
      {vid===undefined&&(
        <div style={{padding:'26px 0',textAlign:'center',fontFamily:UI,fontSize:13,color:TEXT3}}>Cargando…</div>
      )}

      {vid&&(
        <>
          <div style={{position:'relative',width:'100%',paddingTop:'56.25%',borderRadius:R,overflow:'hidden',background:'#000',marginBottom:14}}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`}
              title={`Técnica de ${exercise}`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:0}}
            />
          </div>
          <div style={{fontFamily:UI,fontSize:11.5,color:TEXT3,lineHeight:1.5,marginBottom:14}}>
            Vídeo de YouTube, ajeno a GymBro. Si algo no te encaja con tu caso,
            pregunta a un profesional del gimnasio.
          </div>
        </>
      )}

      {vid===null&&(
        <>
          <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,lineHeight:1.55,marginBottom:16}}>
            Todavía no tenemos un vídeo elegido para este ejercicio. Puedes
            buscarlo en YouTube:
          </div>
          <a href={urlBusqueda(exercise)} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',height:52,borderRadius:R,background:'transparent',border:`1px solid ${BDEF}`,fontFamily:UI,fontWeight:500,fontSize:15,color:TEXT1,textDecoration:'none',marginBottom:12}}>
            Buscar en YouTube
          </a>
        </>
      )}

      <OutlineBtn onClick={onClose}>Cerrar</OutlineBtn>
    </BottomSheet>
  );
}

Object.assign(window.GB,{ VideoBtn, VideoSheet });
