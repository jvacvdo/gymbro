// Shell de navegacion. Portado de ui_kits/app/index.html, con dos cambios:
//  1. window.GB se lee en tiempo de render (no en top-level), para no depender
//     del orden de evaluacion de modulos.
//  2. El frame fijo de 390x844 pasa a ser flexible: ocupa la pantalla en movil
//     y se centra como maqueta de telefono en escritorio.
const { useState } = React;

export default function App() {
  const G = window.GB;
  const [route, setRoute] = useState('welcome');   // welcome | register | login | app
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

  if (route === 'welcome')
    return wrap(<G.WelcomeScreen onStart={() => setRoute('register')} onLogin={() => setRoute('login')} />);
  if (route === 'register')
    return wrap(<G.RegisterScreen onBack={() => setRoute('welcome')} onDone={() => { setTab('inicio'); setRoute('app'); }} onToLogin={() => setRoute('login')} />);
  if (route === 'login')
    return wrap(<G.LoginScreen onBack={() => setRoute('welcome')} onDone={() => { setTab('inicio'); setRoute('app'); }} onToRegister={() => setRoute('register')} />);

  return wrap(
    <React.Fragment>
      {tab === 'inicio'   && <G.HomeScreen onEntrena={() => setTab('entrena')} light={light} onToggle={toggle} />}
      {tab === 'entrena'  && <G.EntrenaScreen onFinish={() => setTab('inicio')} />}
      {tab === 'gymbro'   && <G.GymBroScreen />}
      {tab === 'progreso' && <G.ProgresoScreen />}
      {tab === 'perfil'   && <G.PerfilScreen light={light} onToggle={toggle} />}
      <G.TabBar active={tab} onTab={setTab} />
    </React.Fragment>
  );
}
