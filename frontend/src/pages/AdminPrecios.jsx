import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { guardarReglasPrecios } from '../api/configuracion';
import { obtenerErrorApi } from '../api/products';
import { usePreciosConfig, priceConfigQueryKey } from '../hooks/useConfiguracion';

const AdminPrecios = () => {
  const [rangos, setRangos] = useState([]);
  const [ajusteEspecial, setAjusteEspecial] = useState(null);
  const [minimoAuriculares, setMinimoAuriculares] = useState('');
  const [errorGuardar, setErrorGuardar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark',
  );
  const configuracionQuery = usePreciosConfig();
  const queryClient = useQueryClient();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!configuracionQuery.data) return;
    setRangos(configuracionQuery.data.rangos);
    setAjusteEspecial(configuracionQuery.data.ajusteEspecial);
    setMinimoAuriculares(String(configuracionQuery.data.minimoAuriculares));
  }, [configuracionQuery.data]);

  const actualizarRango = (indice, campo, valor) => {
    setRangos((actuales) => actuales.map((rango, posicion) => (
      posicion === indice ? { ...rango, [campo]: valor } : rango
    )));
  };

  const ajustarRango = (indice, campo, diferencia) => {
    setRangos((actuales) => actuales.map((rango, posicion) => (
      posicion === indice
        ? { ...rango, [campo]: Math.max(0, Number(rango[campo] || 0) + diferencia) }
        : rango
    )));
  };

  const agregarRango = () => {
    if (rangos.length < 2) {
      setRangos([
        { limite: '', monto: '' },
        { limite: '', monto: '', mayorIgual: true },
      ]);
      return;
    }

    const ultimo = rangos[rangos.length - 1];
    const anterior = rangos[rangos.length - 2];
    if (!ultimo || ultimo.limite === '' || !Number.isFinite(Number(ultimo.limite))) {
      setErrorGuardar('No se pudo agregar el rango. Revisá los límites actuales.');
      return;
    }

    const limiteActual = Number(ultimo.limite);
    const nuevosRangos = rangos.slice(0, -1);
    if (anterior && limiteActual > Number(anterior.limite)) {
      nuevosRangos.push({ limite: limiteActual, monto: 0 });
    }
    nuevosRangos.push(
      { ...ultimo, limite: limiteActual + 500, mayorIgual: false },
      { ...ultimo, limite: limiteActual + 500, mayorIgual: true },
    );
    setRangos(nuevosRangos);
  };

  const eliminarRango = (indice) => {
    setRangos((actuales) => actuales.filter((_, posicion) => posicion !== indice));
  };

  const guardarCambios = async () => {
    if (rangos.length < 2 || !rangos.at(-1).mayorIgual) {
      setErrorGuardar('Debe haber al menos un rango abierto (mayor o igual) al final.');
      return;
    }

    setGuardando(true);
    setErrorGuardar('');
    try {
      const configuracion = await guardarReglasPrecios({
        rangos,
        ajusteEspecial,
        minimoAuriculares,
      });
      queryClient.setQueryData(priceConfigQueryKey, configuracion);
    } catch (error) {
      setErrorGuardar(obtenerErrorApi(error, 'No se pudieron guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  };

  if (configuracionQuery.isPending) {
    return <div className="container py-5 text-center" role="status">Cargando configuración...</div>;
  }

  return (
    <div
      className={`container py-5 d-flex flex-column align-items-center ${darkMode ? 'bg-dark' : ''}`}
      style={{
        minHeight: '100vh',
        background: darkMode ? 'var(--background-color, #181a1b)' : '#f5f7fa',
      }}
    >
      <div style={{ maxWidth: 700, width: '100%' }}>
        {configuracionQuery.error && (
          <div className="alert alert-danger" role="alert">
            {obtenerErrorApi(configuracionQuery.error, 'No se pudieron cargar las reglas de precios.')}
          </div>
        )}
        {errorGuardar && <div className="alert alert-danger" role="alert">{errorGuardar}</div>}
        <h2 className={`mb-2 text-center fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>
          Administración de Rangos de Precios
        </h2>
        <p
          className={`text-center mb-4 ${darkMode ? 'text-secondary' : 'text-muted'}`}
          style={{ fontSize: '1.05rem' }}
        >
          Editá los rangos y montos de ajuste de precios. Los cambios impactan en toda la web.
        </p>

        <div className="d-flex flex-column gap-3">
          {rangos.map((rango, indice) => (
            <div
              key={indice}
              className={`rounded-4 px-3 py-2 d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 border${rango.mayorIgual ? ' border-info' : ''}`}
              style={{
                background: rango.mayorIgual
                  ? (darkMode ? '#1e293b' : '#e0f2fe')
                  : (darkMode ? '#262b32' : '#fff'),
                borderColor: rango.mayorIgual ? '#0ea5e9' : (darkMode ? '#555' : '#e5e7eb'),
                borderWidth: 2,
                borderRadius: 18,
                minHeight: 70,
                boxShadow: darkMode
                  ? '0 2px 12px rgba(0,0,0,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.07)',
                marginTop: rango.mayorIgual ? 32 : 0,
              }}
            >
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1 justify-content-center justify-content-md-start">
                <span className={`fw-bold ${darkMode ? 'text-white' : 'text-dark'}`}>
                  {rango.mayorIgual ? 'Si precio >=' : 'Si precio <'}
                </span>
                <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                  <button
                    type="button"
                    className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                    title="Restar 500"
                    onClick={() => ajustarRango(indice, 'limite', -500)}
                    disabled={rango.mayorIgual}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    value={rango.limite}
                    min={0}
                    step={500}
                    className={`form-control text-center ${darkMode ? 'bg-dark text-white border-light' : ''}`}
                    style={{ minWidth: 90, width: 90, height: 40, fontSize: 18 }}
                    onChange={(event) => actualizarRango(indice, 'limite', event.target.value)}
                    disabled={rango.mayorIgual}
                  />
                  <button
                    type="button"
                    className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                    title="Sumar 500"
                    onClick={() => ajustarRango(indice, 'limite', 500)}
                    disabled={rango.mayorIgual}
                  >
                    <FaPlus />
                  </button>
                </div>
                <span className={`mx-2 ${darkMode ? 'text-white' : 'text-dark'}`}>sumar</span>
                <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                  <button
                    type="button"
                    className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`}
                    title="Restar 500"
                    onClick={() => ajustarRango(indice, 'monto', -500)}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    value={rango.monto}
                    min={0}
                    step={500}
                    className={`form-control text-center ${darkMode ? 'bg-dark text-white border-info' : ''}`}
                    style={{ minWidth: 90, width: 90, height: 40, fontSize: 18 }}
                    onChange={(event) => actualizarRango(indice, 'monto', event.target.value)}
                  />
                  <button
                    type="button"
                    className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`}
                    title="Sumar 500"
                    onClick={() => ajustarRango(indice, 'monto', 500)}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              {!rango.mayorIgual && (
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 d-flex align-items-center gap-2 ms-md-2 mt-2 mt-md-0"
                  onClick={() => eliminarRango(indice)}
                  title="Eliminar este rango"
                  aria-label="Eliminar rango"
                >
                  <FaTrash /> Eliminar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-success mt-2 rounded-pill px-4 align-self-center"
            style={{ minWidth: 180 }}
            onClick={agregarRango}
          >
            Agregar rango
          </button>
        </div>

        <div className="mt-4">
          <h5 className={`mb-2 ${darkMode ? 'text-light' : 'text-dark'}`} style={{ fontSize: '1.1rem' }}>
            Ajuste especial (opcional, por prefijo):
          </h5>
          <label className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={Boolean(ajusteEspecial)}
              onChange={(event) => setAjusteEspecial(
                event.target.checked
                  ? { prefijoTitulo: '', limite: '', monto: '' }
                  : null,
              )}
            />
            <span className="form-check-label">
              Aplicar ajuste especial a productos cuyo título comienza con el prefijo indicado
            </span>
          </label>
          {ajusteEspecial && (
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label" htmlFor="special-price-prefix">Prefijo del título</label>
                <input
                  id="special-price-prefix"
                  type="text"
                  className="form-control"
                  value={ajusteEspecial.prefijoTitulo}
                  onChange={(event) => setAjusteEspecial((actual) => ({
                    ...actual,
                    prefijoTitulo: event.target.value,
                  }))}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="special-price-limit">Si el precio es menor a</label>
                <input
                  id="special-price-limit"
                  type="number"
                  className="form-control"
                  min={0}
                  value={ajusteEspecial.limite}
                  onChange={(event) => setAjusteEspecial((actual) => ({
                    ...actual,
                    limite: event.target.value,
                  }))}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="special-price-adjustment">Sumar</label>
                <input
                  id="special-price-adjustment"
                  type="number"
                  className="form-control"
                  min={0}
                  value={ajusteEspecial.monto}
                  onChange={(event) => setAjusteEspecial((actual) => ({
                    ...actual,
                    monto: event.target.value,
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className={`form-label ${darkMode ? 'text-light' : 'text-dark'}`} htmlFor="minimum-headphones-price">
            Precio mínimo para auriculares
          </label>
          <input
            id="minimum-headphones-price"
            type="number"
            className="form-control"
            min={0}
            value={minimoAuriculares}
            onChange={(event) => setMinimoAuriculares(event.target.value)}
          />
        </div>

        <div className="d-flex flex-column align-items-center mt-4 gap-2">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-5 py-2 fs-5"
            style={{ minWidth: 220 }}
            onClick={guardarCambios}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPrecios;
