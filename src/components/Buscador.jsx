import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Buscador = ({ onBuscar }) => {
  const [busqueda, setBusqueda] = useState('');

  const handleChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    onBuscar(valor);
  };

  return (
    <div className="mb-4">
      <InputGroup>
        <InputGroup.Text 
          style={{ 
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRight: 'none',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          <FaSearch size={14} />
        </InputGroup.Text>
        <Form.Control
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={handleChange}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: 'none',
            color: 'white',
            boxShadow: 'none',
            fontSize: '0.95rem'
          }}
          className="border-start-0"
        />
      </InputGroup>
    </div>
  );
};

export default Buscador; 