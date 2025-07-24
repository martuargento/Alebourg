// Función para parsear el precio desde el string del JSON
export const parsearPrecio = (precioStr) => {
  const precioLimpio = precioStr.trim().replace(/,/g, '');
  return parseFloat(precioLimpio);
};

export const redondearA500 = (precio) => {
  return Math.floor(precio / 500) * 500;
};

export const ajustarPrecio = (precioOriginal, titulo = '', categoria = '') => {
  const precio = parsearPrecio(precioOriginal);
  let precioAjustado = precio;
  // Ajuste especial
  if (titulo.toLowerCase().startsWith('cable') && precio < 3000) {
    precioAjustado += 3500;
    return redondearA500(precioAjustado);
  }
  // Aplicar ajustes según rangos
  if (precio < 1500) precioAjustado += 1500;
  else if (precio < 2000) precioAjustado += 2500;
  else if (precio < 3000) precioAjustado += 3000;
  else if (precio < 4000) precioAjustado += 3500;
  else if (precio < 5000) precioAjustado += 4000;
  else if (precio < 6000) precioAjustado += 4500;
  else if (precio < 7000) precioAjustado += 5000;
  else if (precio < 8000) precioAjustado += 5000;
  else if (precio < 9000) precioAjustado += 5500;
  else if (precio < 10000) precioAjustado += 6000;
  else if (precio < 11000) precioAjustado += 6500;
  else if (precio < 12000) precioAjustado += 7000;
  else if (precio < 13000) precioAjustado += 7000;
  else if (precio < 14000) precioAjustado += 7500;
  else if (precio < 15000) precioAjustado += 8000;
  else if (precio < 16000) precioAjustado += 8000;
  else if (precio < 30000) precioAjustado += 11000;
  else if (precio < 40000) precioAjustado += 13000;
  else if (precio < 50000) precioAjustado += 18000;
  else if (precio < 60000) precioAjustado += 20000;
  else if (precio < 70000) precioAjustado += 22000;
  else if (precio < 80000) precioAjustado += 25000;
  else if (precio < 100000) precioAjustado += 30000;
  
  else if (precio >= 100001) precioAjustado += 35000;

  // Lógica especial para auriculares
  if (categoria.trim().toLowerCase() === 'auriculares' && redondearA500(precioAjustado) < 4000) {
    return 4000;
  }

  return redondearA500(precioAjustado);
};

export const formatearPrecio = (precio) => precio.toLocaleString('es-AR');
