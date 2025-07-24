// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import VerPedido from './components/VerPedido';
import Footer from './components/Footer';
import Login from './components/Login';
import ProductosPorCategoria from './components/ProductosPorCategoria'; // Nuevo componente
import DetalleProducto from './components/DetalleProducto';
import AdminPrecios from './components/AdminPrecios';
import { ProveedorCarrito } from './context/CarritoContexto';
import './App.css';

function App() {
  return (
    <ProveedorCarrito>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verpedido" element={<VerPedido />} />
        <Route path="/login" element={<Login />} />
        <Route path="/categoria/:nombreCategoria" element={<ProductosPorCategoria />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/admin/precios" element={<AdminPrecios />} />
      </Routes>
      <Footer />
    </ProveedorCarrito>
  );
}

export default App;