// src/context/CarritoContexto.jsx
import React, { createContext, useContext, useState } from 'react';

const CarritoContexto = createContext();

export const ProveedorCarrito = ({ children }) => {
  const [carrito, setCarrito] = useState([]);

  // Función para agregar producto al carrito
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      // Si ya existe, aumentamos cantidad
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.map(p =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      // Si no existe, lo agregamos con cantidad 1
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  // Podemos agregar funciones para eliminar o limpiar carrito

  return (
    <CarritoContexto.Provider value={{ carrito, agregarAlCarrito }}>
      {children}
    </CarritoContexto.Provider>
  );
};

export const usarCarrito = () => useContext(CarritoContexto);
