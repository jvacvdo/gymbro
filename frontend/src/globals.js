// Puente entre el bundle ES y el prototipo del design system, que fue escrito
// contra los globals `React` y `window.GB`. Este modulo se importa el primero
// de todos: los imports ES se evaluan en orden, asi que los globals ya existen
// cuando shared.jsx se ejecuta.
import React from 'react';
import * as ReactDOM from 'react-dom/client';

window.React = React;
window.ReactDOM = ReactDOM;
window.GB = {};
