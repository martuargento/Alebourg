import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Image, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  crearProductoManual,
  eliminarProducto,
  guardarConfiguracionProductos,
  guardarEdicionProducto,
  marcarProductoRevisado,
  obtenerConfiguracionProductos,
  subirImagenProducto,
} from '../api/administracionProductos';
import { obtenerErrorApi } from '../api/products';
import { productQueryKey } from '../hooks/useProductos';

const MAX_IMAGENES = 12;
const MAX_TAMANO_IMAGEN = 4 * 1024 * 1024;

export default function AdminProductoEditor({ producto = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState(producto?.titulo || '');
  const [categoria, setCategoria] = useState(producto?.categoria || '');
  const [precioProveedor, setPrecioProveedor] = useState(producto?.precio || '');
  const [precioFinal, setPrecioFinal] = useState(producto?.precioFinal || '');
  const [fotos, setFotos] = useState(() => (
    (producto?.imagenes || []).map((url, indice) => ({ id: `existente-${indice}`, url }))
  ));
  const siguienteIdFoto = useRef(0);
  const [configuracion, setConfiguracion] = useState(null);
  const [masVendido, setMasVendido] = useState(false);
  const [oferta, setOferta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [revisionPendiente, setRevisionPendiente] = useState(Boolean(producto?.pendienteRevision));
  const esNuevo = !producto;

  useEffect(() => {
    let activo = true;
    obtenerConfiguracionProductos()
      .then((valor) => {
        if (!activo) return;
        setConfiguracion(valor);
        setMasVendido(valor.masVendidos.includes(producto?.id));
        setOferta(valor.ofertas.includes(producto?.id));
      })
      .catch((errorCarga) => {
        if (activo) setError(obtenerErrorApi(errorCarga, 'No se pudo cargar la configuración.'));
      });
    return () => { activo = false; };
  }, [producto?.id]);

  const previsualizaciones = useMemo(
    () => fotos.map((foto) => ({
      ...foto,
      previsualizacion: foto.archivo ? URL.createObjectURL(foto.archivo) : foto.url,
    })),
    [fotos],
  );
  useEffect(() => () => previsualizaciones.forEach(({ archivo, previsualizacion }) => {
    if (archivo) URL.revokeObjectURL(previsualizacion);
  }), [previsualizaciones]);

  function agregarArchivos(seleccionados) {
    if (fotos.length + seleccionados.length > MAX_IMAGENES) {
      setError(`Cada producto admite hasta ${MAX_IMAGENES} imágenes.`);
      return;
    }
    const validos = seleccionados.filter((archivo) => (
      ['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)
    ));
    if (validos.length !== seleccionados.length) {
      setError('Usá imágenes JPG, PNG o WebP.');
      return;
    }
    if (validos.some((archivo) => archivo.size > MAX_TAMANO_IMAGEN)) {
      setError('Cada imagen debe pesar 4 MB o menos.');
      return;
    }
    setError('');
    setFotos((actuales) => [
      ...actuales,
      ...validos.map((archivo) => ({
        id: `nuevo-${siguienteIdFoto.current++}`,
        archivo,
      })),
    ]);
  }

  function seleccionarArchivos(evento) {
    const seleccionados = Array.from(evento.target.files || []);
    evento.target.value = '';
    agregarArchivos(seleccionados);
  }

  function pegarImagenes(evento) {
    const pegadas = Array.from(evento.clipboardData?.items || [])
      .filter((elemento) => elemento.kind === 'file' && elemento.type.startsWith('image/'))
      .map((elemento) => elemento.getAsFile())
      .filter(Boolean);
    if (!pegadas.length) return;
    evento.preventDefault();
    agregarArchivos(pegadas);
  }

  function moverFoto(indice, desplazamiento) {
    setFotos((actuales) => {
      const destino = indice + desplazamiento;
      if (destino < 0 || destino >= actuales.length) return actuales;
      const reordenadas = [...actuales];
      [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]];
      return reordenadas;
    });
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (!titulo.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!configuracion) {
      setError('No se pudo cargar la configuración de destacados. Recargá e intentá de nuevo.');
      return;
    }
    setGuardando(true);
    try {
      const datos = {
        titulo: titulo.trim(),
        categoria: categoria.trim(),
        precioProveedor,
        precioFinal: precioFinal.trim() || null,
      };
      let id = producto?.id;
      if (!id) {
        const creado = await crearProductoManual({
          ...datos,
          precioFinal: precioFinal.trim() || precioProveedor || '0',
          imagenes: [],
        });
        id = creado.id;
      }

      await guardarEdicionProducto(id, datos);
      const galeria = [];
      for (const foto of fotos) {
        galeria.push(foto.archivo
          ? await subirImagenProducto(id, foto.archivo)
          : foto.url);
      }
      await guardarEdicionProducto(id, { imagenes: galeria });

      const siguiente = {
        ...configuracion,
        masVendidos: masVendido
          ? [...new Set([...configuracion.masVendidos, id])]
          : configuracion.masVendidos.filter((item) => item !== id),
        ofertas: oferta
          ? [...new Set([...configuracion.ofertas, id])]
          : configuracion.ofertas.filter((item) => item !== id),
        orden: configuracion.ordenPersonalizadoActivo
          ? [...new Set([...configuracion.orden, id])]
          : configuracion.orden,
      };
      await guardarConfiguracionProductos(siguiente);
      await queryClient.invalidateQueries({ queryKey: productQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['productos-destacados'] });
      if (esNuevo) navigate(`/producto/${id}`, { replace: true });
      else {
        const scrollGuardado = Number(sessionStorage.getItem('alebourg:product-list-scroll'));
        const scrollRestaurar = Number.isFinite(scrollGuardado) ? scrollGuardado : 0;
        const cantidadGuardada = Number(sessionStorage.getItem('alebourg:product-list-visible-count'));
        const cantidadRestaurar = Number.isSafeInteger(cantidadGuardada) && cantidadGuardada > 0
          ? cantidadGuardada
          : 20;
        sessionStorage.removeItem('alebourg:product-list-scroll');
        sessionStorage.removeItem('alebourg:product-list-visible-count');
        navigate(location.state?.from || '/', {
          replace: true,
          state: {
            restoreScrollY: scrollRestaurar,
            restoreProductosVisibles: cantidadRestaurar,
          },
        });
      }
    } catch (errorGuardar) {
      setError(obtenerErrorApi(errorGuardar, 'No se pudo guardar el producto.'));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarRevision() {
    try {
      await marcarProductoRevisado(producto.id);
      setRevisionPendiente(false);
      await queryClient.invalidateQueries({ queryKey: productQueryKey });
    } catch (errorRevision) {
      setError(obtenerErrorApi(errorRevision, 'No se pudo confirmar la revisión.'));
    }
  }

  async function confirmarEliminacion() {
    if (!window.confirm('Se eliminará el producto y sus personalizaciones actuales de la base de datos. Si vuelve a aparecer en una importación futura, se podrá cargar nuevamente. ¿Continuar?')) {
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await eliminarProducto(producto.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['productos-destacados'] }),
      ]);
      navigate('/', { replace: true });
    } catch (errorArchivo) {
      setError(obtenerErrorApi(errorArchivo, 'No se pudo eliminar el producto.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Form onSubmit={guardar} onPaste={pegarImagenes} className="container py-4" style={{ maxWidth: 760 }}>
      <h2 className="mb-4">{esNuevo ? 'Agregar producto manual' : 'Editar producto'}</h2>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {revisionPendiente && (
        <Alert variant="warning">
          <strong>Hay datos nuevos del catálogo para revisar.</strong>
          <div>Título: {producto?.datosImportados?.titulo || '—'}</div>
          <div>Costo: {producto?.datosImportados?.precio || '—'}</div>
          <div>Categoría: {producto?.datosImportados?.categoria || '—'}</div>
          <Button type="button" variant="outline-dark" size="sm" className="mt-2" onClick={confirmarRevision}>
            Marcar revisión como hecha
          </Button>
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Título</Form.Label>
        <Form.Control value={titulo} onChange={(evento) => setTitulo(evento.target.value)} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Categoría</Form.Label>
        <Form.Control value={categoria} onChange={(evento) => setCategoria(evento.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Costo del proveedor</Form.Label>
        <Form.Control type="text" inputMode="decimal" value={precioProveedor} onChange={(evento) => setPrecioProveedor(evento.target.value)} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Precio final o promocional (vacío usa los rangos configurados)</Form.Label>
        <Form.Control type="text" inputMode="decimal" value={precioFinal} onChange={(evento) => setPrecioFinal(evento.target.value)} />
        {oferta && (
          <Form.Text>Para mostrar un descuento, ingresá un precio final menor al precio normal.</Form.Text>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Fotos ({fotos.length}/{MAX_IMAGENES})</Form.Label>
        <Form.Control type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={seleccionarArchivos} />
        <Form.Text>
          También podés pegar una imagen del portapapeles con Ctrl+V. Usá las flechas para ordenar las fotos.
        </Form.Text>
        <div className="d-flex flex-wrap gap-2 mt-3">
          {previsualizaciones.map((foto, indice) => (
            <div key={foto.id} className="text-center">
              <Image
                src={foto.previsualizacion}
                alt={`Foto ${indice + 1}`}
                rounded
                style={{ width: 90, height: 90, objectFit: 'contain' }}
              />
              <div className="d-flex justify-content-center gap-1 mt-1">
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  aria-label={`Mover foto ${indice + 1} a la izquierda`}
                  disabled={indice === 0 || guardando}
                  onClick={() => moverFoto(indice, -1)}
                >
                  ←
                </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    aria-label={`Quitar foto ${indice + 1}`}
                    disabled={guardando}
                    onClick={() => setFotos((actuales) => actuales.filter((_, posicion) => posicion !== indice))}
                  >
                    ×
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    aria-label={`Mover foto ${indice + 1} a la derecha`}
                    disabled={indice === fotos.length - 1 || guardando}
                    onClick={() => moverFoto(indice, 1)}
                  >
                    →
                  </Button>
              </div>
            </div>
          ))}
        </div>
      </Form.Group>
      <Form.Check
        className="mb-3"
        type="switch"
        label="Mostrar en Más vendidos"
        checked={masVendido}
        onChange={(evento) => setMasVendido(evento.target.checked)}
      />
      <Form.Check
        className="mb-4"
        type="switch"
        label="Mostrar en Ofertas"
        checked={oferta}
        onChange={(evento) => setOferta(evento.target.checked)}
      />
      <Button type="submit" disabled={guardando || !configuracion}>
        {guardando ? <><Spinner size="sm" className="me-2" />Guardando...</> : 'Guardar cambios'}
      </Button>
      <Button type="button" variant="outline-secondary" className="ms-2" onClick={() => navigate(-1)}>
        Volver
      </Button>
      {!esNuevo && (
        <Button
          type="button"
          variant="outline-danger"
          className="ms-2"
          onClick={confirmarEliminacion}
          disabled={guardando}
        >
          Eliminar producto
        </Button>
      )}
    </Form>
  );
}
