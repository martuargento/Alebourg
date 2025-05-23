// App.jsx
import { Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Home from './components/Home';
// Importá más componentes si tenés más rutas
// import Ofertas from './components/Ofertas';
// import Infaltables from './components/Infaltables';
// import Administracion from './components/Administracion';

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/ofertas" element={<Ofertas />} />
        <Route path="/infaltables" element={<Infaltables />} />
        <Route path="/administracion" element={<Administracion />} /> */}
      </Routes>
    </>
  );
}

export default App;
