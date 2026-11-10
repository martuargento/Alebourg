import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const carritoStorage = createJSONStorage(() => ({
  getItem(name) {
    const stored = localStorage.getItem(name);
    if (stored === null) return null;
    const parsed = JSON.parse(stored);
    return JSON.stringify(Array.isArray(parsed)
      ? { state: { carrito: parsed }, version: 0 }
      : parsed);
  },
  setItem(name, value) {
    localStorage.setItem(name, value);
  },
  removeItem(name) {
    localStorage.removeItem(name);
  },
}));

export const useCarritoStore = create(persist((set) => ({
  carrito: [],
  agregarAlCarrito: (producto) => set((state) => {
    const existente = state.carrito.find((item) => item.id === producto.id);
    return {
      carrito: existente
        ? state.carrito.map((item) => (
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ))
        : [...state.carrito, { ...producto, cantidad: 1 }],
    };
  }),
  aumentarCantidad: (productoId) => set((state) => ({
    carrito: state.carrito.map((item) => (
      item.id === productoId ? { ...item, cantidad: item.cantidad + 1 } : item
    )),
  })),
  disminuirCantidad: (productoId) => set((state) => ({
    carrito: state.carrito
      .map((item) => (
        item.id === productoId && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      ))
      .filter((item) => item.cantidad > 0),
  })),
  eliminarDelCarrito: (productoId) => set((state) => ({
    carrito: state.carrito.filter((item) => item.id !== productoId),
  })),
  vaciarCarrito: () => set({ carrito: [] }),
}), {
  name: 'carrito',
  storage: carritoStorage,
  partialize: (state) => ({ carrito: state.carrito }),
}));
