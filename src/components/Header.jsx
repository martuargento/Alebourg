// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { usarCarrito } from '../context/CarritoContexto';
import logo from '../assets/logo.png';

const Header = () => {
  const { carrito } = usarCarrito();
  const navigate = useNavigate();
  const [showCategories, setShowCategories] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoriesRef = useRef(null);

  // Cerrar categorías al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/martuargento/Alebourg/main/public/productosalebourgactulizados.json');
        const data = await response.json();
        
        const categoriasMap = {};
        data.forEach(producto => {
          if (!producto.categoria) return;
          const categoria = producto.categoria.trim();
          if (categoria) {
            categoriasMap[categoria] = (categoriasMap[categoria] || 0) + 1;
          }
        });

        setCategorias(
          Object.entries(categoriasMap)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  const manejarLogout = () => {
    localStorage.removeItem('logueado');
    navigate('/');
  };

  const formatCategory = (name) => {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[\/&]/g, '-')
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const cantidadTotal = carrito.reduce((total, p) => total + p.cantidad, 0);
  const estaLogueado = localStorage.getItem('logueado') === 'true';

  return (
    <nav className="navbar navbar-expand-lg px-4 navbarestilo" style={{ backgroundColor: 'rgba(12, 188, 233, 0.98)' }}>
      <Link className="navbar-brand" to="/">
        <img src={logo} alt="Alebourg" style={{ height: '55px', objectFit: 'contain' }} />
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
          
          <li className="nav-item position-relative" ref={categoriesRef}>
            <button 
              className="nav-link text-white bg-transparent border-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowCategories(!showCategories);
              }}
            >
              Categorías
            </button>
            
            {showCategories && (
              <div className="categories-panel shadow">
                {loading ? (
                  <div className="p-3">Cargando categorías...</div>
                ) : (
                  categorias.map((categoria, index) => (
                    <Link
                      key={index}
                      to={`/categoria/${formatCategory(categoria.nombre)}`}
                      className="category-item"
                      onClick={() => setShowCategories(false)}
                    >
                      <span>{categoria.nombre}</span>
                      <span className="badge bg-primary rounded-pill">{categoria.cantidad}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </li>

          <li className="nav-item">
            <Link className="nav-link text-white" to="/verpedido">Ver Pedido</Link>
          </li>
        </ul>

        <div className="d-flex align-items-center gap-3">
          {estaLogueado ? (
            <button 
              className="btn btn-outline-danger"
              onClick={manejarLogout}
            >
              Cerrar sesión
            </button>
          ) : (
            <Link 
              to="/login" 
              className="btn btn-outline-light boton-login"
            >
              Iniciar sesión
            </Link>
          )}
          
          <Link 
            to="/verpedido" 
            className="btn btn-outline-light position-relative botonCarritoEstilo"
          >
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