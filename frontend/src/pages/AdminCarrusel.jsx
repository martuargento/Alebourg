import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';
import {
  guardarConfiguracionCarrusel,
} from '../api/configuracion';
import { obtenerErrorApi } from '../api/products';
import {
  carouselConfigQueryKey,
  useCarruselConfig,
} from '../hooks/useConfiguracion';

const SEGUNDOS_MINIMOS = 2;
const SEGUNDOS_MAXIMOS = 60;
const DURACION_MINIMA_MS = 300;
const DURACION_MAXIMA_MS = 2500;

export default function AdminCarrusel() {
  const configuracionQuery = useCarruselConfig();
  const queryClient = useQueryClient();
  const [modo, setModo] = useState('synchronized');
  const [segundos, setSegundos] = useState('6');
  const [transicion, setTransicion] = useState('fade');
  const [duracionTransicion, setDuracionTransicion] = useState(1200);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!configuracionQuery.data) return;
    setModo(configuracionQuery.data.mode);
    setSegundos(String(configuracionQuery.data.intervalSeconds));
    setTransicion(configuracionQuery.data.transition);
    setDuracionTransicion(configuracionQuery.data.transitionDurationMs);
  }, [configuracionQuery.data]);

  async function guardar() {
    const intervalSeconds = Number(segundos);
    if (
      !Number.isInteger(intervalSeconds)
      || intervalSeconds < SEGUNDOS_MINIMOS
      || intervalSeconds > SEGUNDOS_MAXIMOS
      || !Number.isInteger(duracionTransicion)
      || duracionTransicion < DURACION_MINIMA_MS
      || duracionTransicion > DURACION_MAXIMA_MS
    ) {
      setErrorGuardar(
        `El intervalo debe estar entre ${SEGUNDOS_MINIMOS} y ${SEGUNDOS_MAXIMOS} segundos, y la transición entre ${DURACION_MINIMA_MS / 1000} y ${DURACION_MAXIMA_MS / 1000} segundos.`,
      );
      setGuardado(false);
      return;
    }

    setGuardando(true);
    setErrorGuardar('');
    setGuardado(false);
    try {
      const actualizada = await guardarConfiguracionCarrusel({
        mode: modo,
        intervalSeconds,
        transition: transicion,
        transitionDurationMs: duracionTransicion,
      });
      queryClient.setQueryData(carouselConfigQueryKey, actualizada);
      setGuardado(true);
    } catch (error) {
      setErrorGuardar(obtenerErrorApi(error, 'No se pudo guardar la configuración.'));
    } finally {
      setGuardando(false);
    }
  }

  if (configuracionQuery.isPending) {
    return <main className="container py-5 text-center" role="status">Cargando configuración de fotos...</main>;
  }

  if (configuracionQuery.error && !configuracionQuery.data) {
    return (
      <main className="container py-5" role="alert">
        <Alert variant="danger">
          {obtenerErrorApi(configuracionQuery.error, 'No se pudo cargar la configuración de fotos.')}
        </Alert>
      </main>
    );
  }

  return (
    <main className="container py-5" style={{ maxWidth: 760 }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="mb-2">Ritmo de fotos</h2>
          <p className="text-secondary mb-4">
            Elegí cada cuánto cambian las fotos en las tarjetas de la tienda.
            La configuración se comparte con la app.
          </p>
          {errorGuardar && <Alert variant="danger" role="alert">{errorGuardar}</Alert>}
          {guardado && <Alert variant="success" role="status">Configuración guardada.</Alert>}
          <Form.Group className="mb-4">
            <Form.Label htmlFor="carousel-mode">Modo de rotación</Form.Label>
            <Form.Select
              id="carousel-mode"
              value={modo}
              onChange={(evento) => {
                setModo(evento.target.value);
                setGuardado(false);
              }}
              disabled={guardando}
            >
              <option value="synchronized">Todos los productos al mismo ritmo</option>
              <option value="individual">Ritmo individual por producto</option>
            </Form.Select>
            <Form.Text>
              {modo === 'individual'
                ? 'Podés asignar un intervalo propio desde Editar producto. Los demás usan el intervalo global.'
                : 'Todas las tarjetas cambian de foto sincronizadas.'}
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label htmlFor="carousel-interval">Segundos entre cambios</Form.Label>
            <Form.Control
              id="carousel-interval"
              type="number"
              min={SEGUNDOS_MINIMOS}
              max={SEGUNDOS_MAXIMOS}
              step="1"
              value={segundos}
              onChange={(evento) => {
                setSegundos(evento.target.value);
                setGuardado(false);
              }}
              disabled={guardando}
            />
            <Form.Text>
              Usado por todos los productos en modo sincronizado y como valor general en modo individual.
              Elegí entre {SEGUNDOS_MINIMOS} y {SEGUNDOS_MAXIMOS} segundos.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label htmlFor="carousel-transition">Efecto de transición</Form.Label>
            <Form.Select
              id="carousel-transition"
              value={transicion}
              onChange={(evento) => {
                setTransicion(evento.target.value);
                setGuardado(false);
              }}
              disabled={guardando}
            >
              <option value="fade">Fundido suave (como en la app)</option>
              <option value="slide">Deslizamiento lateral</option>
              <option value="zoom">Zoom suave</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label htmlFor="carousel-transition-duration">
              Velocidad de transición: {(duracionTransicion / 1000).toFixed(1)} segundos
            </Form.Label>
            <Form.Range
              id="carousel-transition-duration"
              min={DURACION_MINIMA_MS}
              max={DURACION_MAXIMA_MS}
              step="100"
              value={duracionTransicion}
              onChange={(evento) => {
                setDuracionTransicion(Number(evento.target.value));
                setGuardado(false);
              }}
              disabled={guardando}
            />
            <div className="d-flex justify-content-between small text-secondary">
              <span>Más rápida</span>
              <span>Más lenta</span>
            </div>
            <Form.Text>
              La transición se limita si hace falta para terminar antes del próximo cambio de foto.
            </Form.Text>
          </Form.Group>
          <Button
            type="button"
            onClick={guardar}
            disabled={guardando || !configuracionQuery.data}
          >
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </Card.Body>
      </Card>
    </main>
  );
}
