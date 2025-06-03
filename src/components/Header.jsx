// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaChevronDown, FaTimes } from 'react-icons/fa';
import { usarCarrito } from '../context/CarritoContexto';
import logo from '../assets/logo.png';

const Header = () => {
  const { carrito } = usarCarrito();
  const navigate = useNavigate();
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoriesRef = useRef(null);
  const buttonRef = useRef(null);

  // Cerrar categorías al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoriesRef.current && 
        !categoriesRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
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
        const response = await fetch('https://raw.githubusercontent.com/martuargento/Alebourg/refs/heads/main/public/productosalebourgactulizados.json');
        const data = await response.json();
        
        const categoriasMap = {};
        data.forEach(producto => {
          if (!producto.categoria) return;
          const categoria = producto.categoria.trim();
          if (categoria) {
            // Separar palabras basadas en mayúsculas
            const categoriaSeparada = categoria.replace(/([A-Z])/g, ' $1').trim();
            categoriasMap[categoria] = (categoriasMap[categoria] || 0) + 1;
          }
        });

        setCategorias(
          Object.entries(categoriasMap)
            .map(([nombre, cantidad]) => ({ 
              nombre: nombre.replace(/([A-Z])/g, ' $1').trim(), 
              nombreOriginal: nombre,
              cantidad 
            }))
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
    <>
      {/* Desktop Navigation */}
      <nav className="navbar navbar-expand-sm px-4 navbarestilo">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Alebourg" style={{ height: '55px', objectFit: 'contain' }} />
        </Link>

        <button
          className="navbar-toggler d-sm-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMobile"
          aria-controls="navbarMobile"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Desktop Menu */}
        <div className="collapse navbar-collapse d-none d-sm-flex">
          <ul className="navbar-nav me-auto mb-2 mb-sm-0">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">Productos</Link>
            </li>
            <li className="nav-item position-relative" ref={categoriesRef}>
              <button 
                ref={buttonRef}
                className="nav-link text-white bg-transparent border-0"
                onClick={() => setShowCategories(!showCategories)}
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
                        to={`/categoria/${formatCategory(categoria.nombreOriginal)}`}
                        className="category-item"
                        onClick={() => setShowCategories(false)}
                      >
                        <span>{categoria.nombre}</span>
                        <span className="category-count">{categoria.cantidad}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
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
              <div className="admin-hover-area">
                <Link 
                  to="/login" 
                  className="admin-link"
                >
                  admin
                </Link>
              </div>
            )}
            
            {/* Desktop Cart Button */}
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

        {/* Mobile Menu - Solo visible en xs */}
        <div className="collapse navbar-collapse mobile-menu d-sm-none" id="navbarMobile">
          <div className="mobile-menu-container">
            <div className="mobile-menu-header">
              <Link className="navbar-brand" to="/">
                <img src={logo} alt="Alebourg" style={{ height: '40px', objectFit: 'contain' }} />
              </Link>
              <button
                className="mobile-menu-close"
                data-bs-toggle="collapse"
                data-bs-target="#navbarMobile"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mobile-menu-content">
              <ul className="mobile-menu-nav">
                <li className="mobile-menu-item">
                  <Link 
                    to="/"
                    className="mobile-menu-link"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarMobile"
                  >
                    Productos
                  </Link>
                </li>
                <li className="mobile-menu-item">
                  <button 
                    className="mobile-menu-link"
                    onClick={() => setShowMobileCategories(!showMobileCategories)}
                  >
                    <span>Categorías</span>
                    <FaChevronDown 
                      style={{
                        transform: showMobileCategories ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                      }}
                      size={12}
                    />
                  </button>
                  {showMobileCategories && (
                    <div className="mobile-menu-categories">
                      {loading ? (
                        <div className="p-3 text-white">Cargando...</div>
                      ) : (
                        categorias.map((categoria, index) => (
                          <Link
                            key={index}
                            to={`/categoria/${formatCategory(categoria.nombreOriginal)}`}
                            className="mobile-category-item"
                            onClick={() => {
                              const menu = document.getElementById('navbarMobile');
                              const bsCollapse = new bootstrap.Collapse(menu);
                              bsCollapse.hide();
                            }}
                          >
                            <span>{categoria.nombre}</span>
                            <span className="mobile-category-count">{categoria.cantidad}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </li>
              </ul>
            </div>

            <div className="mobile-menu-footer">
              <hr className="mobile-menu-divider" />
              {estaLogueado ? (
                <button 
                  onClick={() => {
                    manejarLogout();
                    const menu = document.getElementById('navbarMobile');
                    const bsCollapse = new bootstrap.Collapse(menu);
                    bsCollapse.hide();
                  }}
                  className="mobile-menu-admin"
                >
                  cerrar sesión
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="mobile-menu-admin"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarMobile"
                >
                  admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Cart Button - Solo visible en xs */}
      <Link 
        to="/verpedido" 
        className="floating-cart-button d-sm-none"
      >
        <FaShoppingCart size={24} />
        {cantidadTotal > 0 && (
          <span className="badge">
            {cantidadTotal}
          </span>
        )}
      </Link>
    </>
  );
};

export default Header;