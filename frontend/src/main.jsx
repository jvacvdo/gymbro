// El orden de estos imports importa: replica el orden de <script> del
// prototipo. globals.js primero (define React y window.GB), luego shared.jsx
// que puebla window.GB, y despues cada pantalla que se registra en el.
import './globals.js';

import './ds/styles.css';
import './theme.css';

import './screens/isotype-path.js';
import './screens/shared.jsx';
import './attach-api.js';
import './screens/auth.jsx';
import './screens/home.jsx';
import './screens/entrena.jsx';
import './screens/progreso.jsx';
import './screens/perfil.jsx';
import './screens/gymbro.jsx';
import './screens/legal.jsx';
import './screens/coach.jsx';

import App from './App.jsx';

window.ReactDOM.createRoot(document.getElementById('root')).render(<App />);
