// Función para parsear el precio desde el string del JSON
export const parsearPrecio = (precioStr) => {
  // Eliminar espacios y reemplazar comas por puntos
  const precioLimpio = precioStr.trim().replace(/,/g, '');
  // Convertir a número
  return parseFloat(precioLimpio);
};

// Función para redondear al múltiplo de 500 más cercano hacia abajo
export const redondearA500 = (precio) => {
  return Math.floor(precio / 500) * 500;
};

// Función para ajustar precios según los rangos
export const ajustarPrecio = (precioOriginal) => {
  const precio = parsearPrecio(precioOriginal);
  let precioAjustado = precio;
  
  // Aplicar ajustes según rangos
  if (precio < 1500) precioAjustado += 1000;
  else if (precio < 2000) precioAjustado += 2500;
  else if (precio < 3000) precioAjustado += 3000;
  else if (precio < 4000) precioAjustado += 3000;
  else if (precio < 5000) precioAjustado += 3500;
  else if (precio < 6000) precioAjustado += 4000;
  else if (precio < 7000) precioAjustado += 4500;
  else if (precio < 8000) precioAjustado += 5000;
  else if (precio < 9000) precioAjustado += 5500;
  else if (precio < 10000) precioAjustado += 5500;
  else if (precio < 11000) precioAjustado += 6000;
  else if (precio < 12000) precioAjustado += 6500;
  else if (precio < 13000) precioAjustado += 7000;
  else if (precio < 14000) precioAjustado += 7000;
  else if (precio < 15000) precioAjustado += 7000;
  else if (precio < 16000) precioAjustado += 7000;
  else if (precio < 30000) precioAjustado += 8500;
  else if (precio < 40000) precioAjustado += 11000;
  else if (precio < 50000) precioAjustado += 13000;
  else if (precio < 60000) precioAjustado += 14000;
  else if (precio < 70000) precioAjustado += 15000;
  else if (precio < 80000) precioAjustado += 16000;
  else if (precio < 100000) precioAjustado += 19000;
  else if (precio >= 100000) precioAjustado += 24000;
  
  // Redondear al múltiplo de 500 más cercano hacia abajo
  return redondearA500(precioAjustado);
};

// Función para formatear el precio para mostrar
export const formatearPrecio = (precio) => {
  return precio.toLocaleString('es-AR');
}; 