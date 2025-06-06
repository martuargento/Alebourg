import React, { useState, useRef } from 'react';
import { Form } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Buscador = ({ onBuscar }) => {
  const [busqueda, setBusqueda] = useState('');
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    onBuscar(valor);
  };

  const handleSearchClick = () => {
    inputRef.current.focus();
  };

  return (
    <div className="mb-3">
      <div className="search-container" style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--search-border)',
        borderRadius: '8px',
        backgroundColor: 'var(--search-bg)',
        cursor: 'text'
      }}>
        <div 
          onClick={handleSearchClick}
          style={{
            padding: '0 16px',
            color: 'var(--text-color-secondary)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <FaSearch size={14} />
        </div>
        <Form.Control
          ref={inputRef}
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={handleChange}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-color)',
            boxShadow: 'none',
            fontSize: '0.95rem',
            padding: '12px 0',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
};

export default Buscador; 