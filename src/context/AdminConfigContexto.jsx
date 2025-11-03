import React, { createContext, useContext, useState } from 'react';

const AdminConfigContexto = createContext();

export const AdminConfigProvider = ({ children }) => {
  const [mostrarPreciosAdmin, setMostrarPreciosAdmin] = useState(
    localStorage.getItem('mostrarPreciosAdmin') !== 'false'
  );

  const toggleMostrarPreciosAdmin = () => {
    const nuevoValor = !mostrarPreciosAdmin;
    setMostrarPreciosAdmin(nuevoValor);
    localStorage.setItem('mostrarPreciosAdmin', nuevoValor);
  };

  return (
    <AdminConfigContexto.Provider value={{ mostrarPreciosAdmin, toggleMostrarPreciosAdmin }}>
      {children}
    </AdminConfigContexto.Provider>
  );
};

export const usarAdminConfig = () => {
  const context = useContext(AdminConfigContexto);
  if (!context) {
    throw new Error('usarAdminConfig debe ser usado dentro de un AdminConfigProvider');
  }
  return context;
};