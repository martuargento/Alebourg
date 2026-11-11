const formatoPesos = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0,
})

export function formatearPrecio(valor) {
  return `$${formatoPesos.format(Number(valor) || 0)}`
}
