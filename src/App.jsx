import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Novedades from './components/Novedades';
import VerPedido from './components/VerPedido';
import Footer from './components/Footer';
import Login from './components/Login';  
import { ProveedorCarrito } from './context/CarritoContexto';

function App() {
  return (
    <ProveedorCarrito>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/verpedido" element={<VerPedido />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </ProveedorCarrito>
  );
}

export default App;
