// src/context/CarritoContexto.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const CarritoContexto = createContext();

export const ProveedorCarrito = ({ children }) => {
  const [carrito, setCarrito] = useState(() => {
    // Intentar recuperar el carrito del localStorage al iniciar
    const carritoGuardado = localStorage.getItem('carrito');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  // Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

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

  // Función para aumentar la cantidad de un producto
  const aumentarCantidad = (productoId) => {
    setCarrito(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      )
    );
  };

  // Función para disminuir la cantidad de un producto
  const disminuirCantidad = (productoId) => {
    setCarrito(prev =>
      prev.map(p =>
        p.id === productoId && p.cantidad > 1
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
      ).filter(p => p.cantidad > 0)
    );
  };

  // Función para eliminar un producto del carrito
  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(p => p.id !== productoId));
  };

  // Función para vaciar el carrito
  const vaciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem('carrito'); // También limpiamos el localStorage
  };

  return (
    <CarritoContexto.Provider value={{ 
      carrito, 
      agregarAlCarrito, 
      aumentarCantidad, 
      disminuirCantidad,
      eliminarDelCarrito,
      vaciarCarrito 
    }}>
      {children}
    </CarritoContexto.Provider>
  );
};

export const usarCarrito = () => useContext(CarritoContexto);
