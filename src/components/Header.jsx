import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { usarCarrito } from '../context/CarritoContexto';
import logo from '../assets/logo.png'; // <-- Importar el logo aquí

const Header = () => {
  const { carrito } = usarCarrito();
  const navigate = useNavigate();

  const estaLogueado = localStorage.getItem('logueado') === 'true';

  const manejarLogout = () => {
    localStorage.removeItem('logueado');
    navigate('/');
  };

  const cantidadTotal = carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);

  return (
  <nav className="navbar navbar-expand-lg px-4 navbarestilo" style={{ backgroundColor: 'rgba(12, 188, 233, 0.98)', color: 'rgb(255, 255, 255)' }}>


      <Link className="navbar-brand" to="/">
      <img 
        src={logo} 
        alt="Alebourg" 
        className="logo"
        style={{ height: '55px', objectFit: 'contain' }} 
      />
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/">Productos</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/novedades">Novedades</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" to="/verpedido">Ver Pedido</Link>
          </li>
        </ul>

        <div className="d-flex align-items-center">
          {estaLogueado ? (
            <button className="btn btn-outline-danger me-3" onClick={manejarLogout}>
              Cerrar sesión
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline-primary me-3 boton-login">
              Iniciar sesión
            </Link>
          )}
          <Link to="/verpedido" className="btn btn-outline-secondary position-relative botonCarritoEstilo">
            <FaShoppingCart size={20} />
            {cantidadTotal > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cantidadTotal}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
