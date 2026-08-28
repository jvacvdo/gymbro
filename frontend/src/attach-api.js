// Expone el cliente API dentro de window.GB, que es como las pantallas
// acceden a todo lo compartido. Debe importarse DESPUES de shared.jsx,
// porque ese archivo reasigna window.GB entero.
import * as api from './api.js';

Object.assign(window.GB, { api });
