// GymBro — Politica de privacidad.
//
// AVISO PARA QUIEN MANTENGA ESTO: este texto es una base generica, no un
// documento revisado por un abogado. GymBro recoge peso, edad y sexo, que en
// el RGPD europeo pueden considerarse datos de salud y tienen requisitos mas
// estrictos. Antes de abrir el registro al publico conviene que lo revise
// alguien cualificado en tu jurisdiccion.
//
// Los valores entre {} de RESPONSABLE hay que rellenarlos.
const LG = window.GB;
const { useState:useStateLG } = React;

const RESPONSABLE = {
  titular: 'GymBro',              // nombre legal o comercial del responsable
  contacto: 'josevac95@gmail.com', // correo para ejercer derechos
  actualizado: '30 de agosto de 2026',
};

const SECCIONES = [
  {
    t: 'Quién trata tus datos',
    p: [
      `El responsable del tratamiento es ${RESPONSABLE.titular}. Puedes escribirnos a ${RESPONSABLE.contacto} para cualquier cuestión relacionada con tus datos o con esta política.`,
    ],
  },
  {
    t: 'Qué datos recogemos',
    p: [
      'Datos de cuenta: tu nombre, nombre de usuario, correo electrónico y una versión cifrada de tu contraseña. Nunca guardamos tu contraseña en claro y nadie del equipo puede leerla.',
      'Datos físicos que nos das al registrarte, todos opcionales salvo tu objetivo: peso, altura, edad y sexo.',
      'Datos de entrenamiento: las sesiones que registras, los ejercicios, las series, el peso y las repeticiones, y la fecha de cada una.',
      'Datos de tus conexiones: con qué otras personas usuarias estás conectado.',
      'Si entras con Google, recibimos de Google tu nombre, tu correo electrónico y un identificador de cuenta. No recibimos tu contraseña de Google ni accedemos a ningún otro dato de tu cuenta.',
    ],
  },
  {
    t: 'Para qué los usamos',
    p: [
      'Para darte el servicio: mostrarte tu progreso, calcular tus estadísticas y detectar estancamientos en tus cargas.',
      'Para identificarte al iniciar sesión y mantener tu sesión abierta.',
      'Para que puedas conectar con otras personas usuarias y ver sus entrenamientos cuando ambas partes lo aceptáis.',
      'No usamos tus datos para publicidad, no los vendemos y no los cedemos a terceros con fines comerciales.',
    ],
  },
  {
    t: 'Qué ven las demás personas',
    p: [
      'Tu nombre y tu nombre de usuario son visibles en el buscador de la aplicación, para que otras personas puedan encontrarte y enviarte una solicitud. Tu correo electrónico nunca aparece en esas búsquedas.',
      'Quien tenga una conexión aceptada contigo puede ver los entrenamientos que registras. Tus datos físicos —peso, altura, edad y sexo— no se comparten con nadie.',
      'Puedes deshacer una conexión en cualquier momento desde la pestaña GymBro.',
    ],
  },
  {
    t: 'Dónde se guardan',
    p: [
      'Tus datos se almacenan en MongoDB Atlas, un servicio de bases de datos gestionado, en servidores situados en la región que hemos configurado para la aplicación.',
      'En tu dispositivo guardamos únicamente el identificador de tu sesión, para no pedirte la contraseña cada vez que abres la aplicación. No usamos cookies de seguimiento ni de publicidad.',
    ],
  },
  {
    t: 'Cuánto tiempo los conservamos',
    p: [
      'Mientras tu cuenta exista. Cuando borras tu cuenta, eliminamos tu perfil, tus entrenamientos, tus series registradas y tus conexiones.',
      'El borrado es inmediato y no se puede deshacer. Puede quedar una copia en nuestras copias de seguridad durante un periodo limitado hasta que estas se renuevan.',
    ],
  },
  {
    t: 'Tus derechos',
    p: [
      'Puedes acceder a tus datos y modificarlos desde Perfil › Editar perfil.',
      'Puedes borrar tu cuenta y todos tus datos desde Perfil › Borrar mi cuenta.',
      'También puedes solicitarnos una copia de tus datos, su rectificación, la limitación de su tratamiento o presentar una reclamación ante la autoridad de protección de datos de tu país. Escríbenos a ' + RESPONSABLE.contacto + '.',
    ],
  },
  {
    t: 'Menores de edad',
    p: [
      'GymBro no está dirigida a menores de 16 años. Si detectamos una cuenta de una persona menor de esa edad sin el consentimiento de quien ejerza su tutela, la eliminaremos.',
    ],
  },
  {
    t: 'Seguridad',
    p: [
      'Las contraseñas se guardan cifradas con un algoritmo de hash diseñado para ese fin. El acceso a la base de datos está restringido por credenciales y las comunicaciones entre la aplicación y el servidor viajan cifradas.',
      'Ningún sistema es infalible. Si detectamos una brecha que afecte a tus datos, te lo comunicaremos.',
    ],
  },
  {
    t: 'Cambios en esta política',
    p: [
      `Si cambiamos esta política te avisaremos dentro de la aplicación. Última actualización: ${RESPONSABLE.actualizado}.`,
    ],
  },
];

function PrivacyScreen({onBack}){
  const { BG,CARD,BORDER,TEXT1,TEXT2,TEXT3,UI,DSP,MONO,R,Icon,StatusBar } = LG;
  return(
    <div style={{position:'absolute',inset:0,background:BG,display:'flex',flexDirection:'column'}}>
      <StatusBar/>
      <div style={{flex:1,overflowY:'auto',padding:'0 20px 40px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:18}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',padding:0,outline:'none',display:'flex'}}><Icon name="back" size={20} color={TEXT2}/></button>
        </div>
        <div style={{fontFamily:DSP,fontWeight:700,fontSize:30,color:TEXT1,letterSpacing:'-0.02em',marginBottom:6}}>Privacidad</div>
        <div style={{fontFamily:MONO,fontSize:9,color:TEXT3,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20}}>Actualizado el {RESPONSABLE.actualizado}</div>

        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:R,padding:'15px 17px',marginBottom:22}}>
          <div style={{fontFamily:UI,fontSize:13.5,color:TEXT2,lineHeight:1.55}}>
            Resumen: guardamos lo que necesitamos para mostrarte tu progreso.
            No vendemos tus datos ni los usamos para publicidad. Puedes borrar
            tu cuenta entera cuando quieras.
          </div>
        </div>

        {SECCIONES.map((s,i)=>(
          <div key={i} style={{marginBottom:22}}>
            <div style={{fontFamily:UI,fontWeight:500,fontSize:15.5,color:TEXT1,marginBottom:9}}>{s.t}</div>
            {s.p.map((t,j)=>(
              <div key={j} style={{fontFamily:UI,fontSize:13.5,color:TEXT2,lineHeight:1.6,marginBottom:9}}>{t}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window.GB,{ PrivacyScreen });
