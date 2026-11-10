import { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ isDark, onToggle }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 575);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 575);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <button
      onClick={onToggle}
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