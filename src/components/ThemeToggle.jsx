import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 575);

  useEffect(() => {
    // Aplicar tema inicial
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Manejar cambios de tamaño de ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 575);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', !isDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <FaSun size={20} /> : <FaMoon size={20} />}
      {isMobile && (
        <span className="theme-text">
          {isDark ? "Tema claro" : "Tema oscuro"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle; 