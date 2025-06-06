// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaChevronDown, FaTimes, FaChevronUp } from 'react-icons/fa';
import { usarCarrito } from '../context/CarritoContexto';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { carrito } = usarCarrito();
  const navigate = useNavigate();
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme'));
  const categoriesRef = useRef(null);
  const buttonRef = useRef(null);

  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMobileCategories(false);
      setIsClosing(false);
    }, 80);
  };

  const handleToggleMobileMenu = () => {
    if (showMobileMenu) {
      setShowMobileMenu(false);
      setShowMobileCategories(false);
      document.body.style.overflow = 'auto';
    } else {
      setShowMobileMenu(true);
      document.body.style.overflow = 'hidden';
    }
  };

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
        const response = await fetch('https://raw.githubusercontent.com/martinalejandronuniezcursor2/alebourgprueba/refs/heads/main/public/productosalebourgactulizados.json');
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

  // Escuchar cambios en el tema
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setCurrentTheme(document.documentElement.getAttribute('data-theme'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Limpiar el estilo del body al desmontar el componente
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
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
          <img 
            src={document.documentElement.getAttribute('data-theme') === 'light' ? '/logolight.png' : logo} 
            alt="Alebourg" 
            style={{ height: '55px', objectFit: 'contain' }} 
          />
        </Link>

        <button
          className="navbar-toggler d-sm-none"
          type="button"
          onClick={handleToggleMobileMenu}
          aria-controls="navbarMobile"
          aria-expanded={showMobileMenu}
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
                        <span style={{
                          color: '#999',
                          fontSize: '0.9em'
                        }}>{categoria.cantidad}</span>
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
            <ThemeToggle />
            {/* Desktop Cart Button */}
            <Link 
              to="/verpedido" 
              className="btn btn-outline-light position-relative botonCarritoEstilo"
            >
              <FaShoppingCart size={18} />
              {cantidadTotal > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {cantidadTotal}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Menu - Solo visible en xs */}
        <div className={`mobile-menu d-sm-none ${showMobileMenu ? 'show' : ''}`}>
          <div className="mobile-menu-container" style={{ 
            height: '100vh',
            backgroundColor: '#1e1e1e'
          }}>
            <div className="mobile-menu-header">
              <Link className="navbar-brand" to="/">
                <img 
                  src={document.documentElement.getAttribute('data-theme') === 'light' ? '/logolight.png' : logo} 
                  alt="Alebourg" 
                  style={{ height: '40px', objectFit: 'contain' }} 
                />
              </Link>
              <button
                className="mobile-menu-close"
                onClick={handleToggleMobileMenu}
              >
                <FaTimes />
              </button>
            </div>

            <div className="mobile-menu-content" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              <ul className="mobile-menu-nav">
                <li className="mobile-menu-item">
                  <Link 
                    to="/" 
                    className="mobile-menu-link"
                    onClick={handleToggleMobileMenu}
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
                        transition: 'transform 0.08s ease'
                      }}
                      size={12}
                    />
                  </button>
                  {showMobileCategories && (
                    <>
                      <div 
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'var(--mobile-overlay-bg)',
                          zIndex: 9998,
                          animation: isClosing ? 'fadeOut 0.08s ease-out forwards' : 'fadeIn 0.08s ease-out forwards'
                        }} 
                        onClick={handleCloseMenu} 
                      />
                      <div style={{
                        position: 'fixed',
                        top: '20px',
                        left: '10px',
                        right: '10px',
                        bottom: '20px',
                        backgroundColor: 'var(--mobile-menu-bg)',
                        zIndex: 9999,
                        padding: '20px',
                        overflowY: 'auto',
                        borderRadius: '10px',
                        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                        border: '1px solid var(--mobile-menu-border)',
                        animation: isClosing ? 'slideDown 0.06s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'slideUp 0.06s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                        willChange: 'transform, opacity'
                      }}>
                        <style>
                          {`
                            @keyframes slideUp {
                              from {
                                opacity: 0;
                                transform: translateY(50vh) scale(0.9);
                              }
                              to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                              }
                            }
                            @keyframes slideDown {
                              from {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                              }
                              to {
                                opacity: 0;
                                transform: translateY(50vh) scale(0.9);
                              }
                            }
                            @keyframes fadeIn {
                              from {
                                opacity: 0;
                              }
                              to {
                                opacity: 1;
                              }
                            }
                            @keyframes fadeOut {
                              from {
                                opacity: 1;
                              }
                              to {
                                opacity: 0;
                              }
                            }
                          `}
                        </style>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                          borderBottom: '1px solid var(--mobile-menu-border)',
                          paddingBottom: '10px'
                        }}>
                          <h4 style={{ 
                            color: 'var(--text-color)', 
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: '500'
                          }}>Categorías</h4>
                          <button 
                            onClick={handleCloseMenu}
                            className="categories-close"
                            style={{
                              background: 'none',
                              padding: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                        {loading ? (
                          <div className="p-3" style={{ color: 'var(--text-color)' }}>Cargando...</div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {categorias.map((categoria, index) => (
                              <Link
                                key={index}
                                to={`/categoria/${formatCategory(categoria.nombreOriginal)}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px 15px',
                                  backgroundColor: 'var(--mobile-menu-item-bg)',
                                  borderRadius: '8px',
                                  color: 'var(--text-color)',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s ease',
                                  fontSize: '0.95rem'
                                }}
                                onClick={() => {
                                  setShowMobileCategories(false);
                                  handleToggleMobileMenu();
                                }}
                              >
                                <span>{categoria.nombre}</span>
                                <span style={{
                                  color: 'var(--text-color)',
                                  opacity: '0.6',
                                  fontSize: '0.9em'
                                }}>{categoria.cantidad}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
                <li className="mobile-menu-item" style={{ marginTop: '1rem' }}>
                  <div className="d-flex justify-content-center">
                    <ThemeToggle />
                  </div>
                </li>
              </ul>

              <div style={{ flex: 0.2 }}></div>

              <div className="mobile-menu-footer">
                <hr className="mobile-menu-divider" />
                {estaLogueado ? (
                  <button 
                    onClick={() => {
                      manejarLogout();
                      handleToggleMobileMenu();
                    }}
                    className="mobile-menu-admin"
                  >
                    cerrar sesión
                  </button>
                ) : (
                  <Link 
                    to="/login" 
                    className="mobile-menu-admin"
                    onClick={handleToggleMobileMenu}
                  >
                    admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Cart Button - Solo visible en xs */}
      <Link 
        to="/verpedido" 
        className="floating-cart-button d-sm-none"
      >
        <FaShoppingCart size={22} />
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