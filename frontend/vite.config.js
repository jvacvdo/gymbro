import { defineConfig } from 'vite';

// El prototipo del design system se escribió contra el runtime JSX clasico
// (React global + Babel standalone). Mantenemos esa semantica para poder
// portar los .jsx de ui_kits sin tocar una sola linea.
export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  server: { port: 5173 },
});
