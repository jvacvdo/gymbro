// Shell de navegacion. Portado de ui_kits/app/index.html, con dos cambios:
//  1. window.GB se lee en tiempo de render (no en top-level), para no depender
//     del orden de evaluacion de modulos.
//  2. El frame fijo de 390x844 pasa a ser flexible: ocupa la pantalla en movil
//     y se centra como maqueta de telefono en escritorio.
const { useState } = React;

/* El enlace del correo de recuperacion llega como /?reset=TOKEN. Se lee una
   sola vez al arrancar y se limpia de la barra de direcciones, para que el
   token no quede en el historial ni se reenvie al recargar. */
const RESET_TOKEN = (() => {
  try {
    const t = new URLSearchParams(window.location.search).get('reset');
    if (t) window.history.replaceState({}, '', window.location.pathname);
    return t || null;
  } catch { return null; }
})();

export default function App() {
  const G = window.GB;
  // Con token guardado se entra directo: obligar a iniciar sesion en cada
  // recarga con la sesion todavia viva no protege nada, solo molesta.
  // El enlace de recuperacion manda sobre todo lo demas.
  const [route, setRoute] = useState(() =>
    RESET_TOKEN ? 'reset' : (G && G.api && G.api.getToken() ? 'app' : 'welcome'));
  const [tab, setTab] = useState('inicio');
  const [light, setLight] = useState(false);
  const toggle = () => setLight(v => !v);

  const frame = {
    width: 'min(390px, 100vw)',
    height: 'min(844px, 100dvh)',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--gb-bg)',
  };
  const wrap = (el) => <div data-theme={light ? 'light' : 'dark'} style={frame}>{el}</div>;

  // Entrar en la app, decidiendo si falta completar el perfil. Google
  // devuelve nombre y correo, pero no objetivo ni experiencia.
  const entrar = (r) => {
    setTab('inicio');
    setRoute(r && r.needs_onboarding ? 'onboarding' : 'app');
  };

  if (route === 'reset')
    return wrap(<G.ResetPasswordScreen token={RESET_TOKEN} onDone={() => entrar()} onCancel={() => setRoute('welcome')} />);
  if (route === 'welcome')
    return wrap(<G.WelcomeScreen onStart={() => setRoute('register')} onLogin={() => setRoute('login')} />);
  if (route === 'register')
    return wrap(<G.RegisterScreen onBack={() => setRoute('welcome')} onDone={entrar} onToLogin={() => setRoute('login')} />);
  if (route === 'onboarding')
    return wrap(<G.RegisterScreen onboardingOnly onBack={() => setRoute('app')} onDone={() => entrar()} onToLogin={() => setRoute('login')} />);
  if (route === 'login')
    return wrap(<G.LoginScreen onBack={() => setRoute('welcome')} onDone={entrar} onToRegister={() => setRoute('register')} />);

  return wrap(
    <React.Fragment>
      {tab === 'inicio'   && <G.HomeScreen onEntrena={() => setTab('entrena')} light={light} onToggle={toggle} />}
      {tab === 'entrena'  && <G.EntrenaScreen onFinish={() => setTab('inicio')} />}
      {tab === 'gymbro'   && <G.GymBroScreen />}
      {tab === 'progreso' && <G.ProgresoScreen />}
      {tab === 'perfil'   && <G.PerfilScreen light={light} onToggle={toggle} onLogout={() => { setTab('inicio'); setRoute('welcome'); }} />}
      <G.TabBar active={tab} onTab={setTab} />
    </React.Fragment>
  );
}
