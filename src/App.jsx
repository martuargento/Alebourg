// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import VerPedido from './components/VerPedido';
import Footer from './components/Footer';
import Login from './components/Login';
import ProductosPorCategoria from './components/ProductosPorCategoria'; // Nuevo componente
import DetalleProducto from './components/DetalleProducto';
import AdminPrecios from './components/AdminPrecios';
import AdminMetricas from './components/AdminMetricas';
import { useEffect } from 'react';
import { trackVisit } from './services/apiService';
import { ProveedorCarrito } from './context/CarritoContexto';
import { AdminConfigProvider } from './context/AdminConfigContexto';
import './App.css';

function App() {
  const location = useLocation();

  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname]);

  return (
    <AdminConfigProvider>
      <ProveedorCarrito>
        <div>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verpedido" element={<VerPedido />} />
            <Route path="/login" element={<Login />} />
            <Route path="/categoria/:nombreCategoria" element={<ProductosPorCategoria />} />
            <Route path="/producto/:id" element={<DetalleProducto />} />
            <Route path="/admin/precios" element={<AdminPrecios />} />
            <Route path="/admin/metricas" element={<AdminMetricas />} />
          </Routes>
          <Footer />
        </div>
      </ProveedorCarrito>
    </AdminConfigProvider>
  );
}

export default App;