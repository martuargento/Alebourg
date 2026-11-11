import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { obtenerErrorApi } from './api/products';
import { usePreciosConfig } from './hooks/useConfiguracion';
import Header from './components/Header';
import Footer from './components/Footer';
import RutaProtegida from './routes/RutaProtegida';
import { trackVisit } from './api/analytics';
import './App.css';
import Login from './pages/Login';
import Tienda from './pages/Tienda';
import VerPedido from './pages/VerPedido';
import ProductosPorCategoria from './pages/ProductosPorCategoria';
import DetalleProducto from './pages/DetalleProducto';
import AdminPrecios from './pages/AdminPrecios';
import AdminCarrusel from './pages/AdminCarrusel';
import AdminMetricas from './pages/AdminMetricas';
import AdminProductoEditor from './components/AdminProductoEditor';

function PaginaConPrecios({ children }) {
  const configuracion = usePreciosConfig();

  if (configuracion.isPending) {
    return <main className="container py-5 text-center" role="status">Cargando configuración de precios...</main>;
  }

  if (configuracion.error) {
    return (
      <main className="container py-5" role="alert">
        <h2>No se pudo cargar la configuración de precios desde la base de datos.</h2>
        <p>{obtenerErrorApi(configuracion.error, 'La base de datos no está disponible.')}</p>
        <Link to="/login">Iniciar sesión para revisar la configuración</Link>
      </main>
    );
  }

  return children;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    trackVisit(location.pathname).catch((error) => {
      console.error('No se pudo registrar la visita:', error);
    });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<PaginaConPrecios><Tienda /></PaginaConPrecios>} />
        <Route path="/verpedido" element={<PaginaConPrecios><VerPedido /></PaginaConPrecios>} />
        <Route path="/login" element={<Login />} />
        <Route path="/categoria/:nombreCategoria" element={<PaginaConPrecios><ProductosPorCategoria /></PaginaConPrecios>} />
        <Route path="/producto/:id" element={<PaginaConPrecios><DetalleProducto /></PaginaConPrecios>} />
        <Route
          path="/admin/precios"
          element={
            <RutaProtegida>
              <AdminPrecios />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/carrusel"
          element={
            <RutaProtegida>
              <AdminCarrusel />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/metricas"
          element={
            <RutaProtegida>
              <AdminMetricas />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/productos/nuevo"
          element={
            <RutaProtegida>
              <AdminProductoEditor />
            </RutaProtegida>
          }
        />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}
