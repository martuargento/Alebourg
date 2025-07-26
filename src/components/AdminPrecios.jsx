import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { BACKEND_URL } from '../config';

const obtenerRangosDesdeCodigo = (codigo) => {
  // Detecta cualquier tipo de if/else if con precio < ...
  const regex = /(?:if|else\s*if)\s*\(\s*precio\s*<\s*(\d+)\s*\)\s*precioAjustado\s*\+=\s*(\d+);/g;
  let match;
  const rangos = [];
  while ((match = regex.exec(codigo)) !== null) {
    rangos.push({ limite: parseInt(match[1]), monto: parseInt(match[2]) });
  }
  // Extrae el último else if (precio >= ...)
  const ultimo = codigo.match(/else\s*if\s*\(\s*precio\s*>=\s*(\d+)\s*\)\s*precioAjustado\s*\+=\s*(\d+);/);
  if (ultimo) {
    rangos.push({ limite: parseInt(ultimo[1]), monto: parseInt(ultimo[2]), mayorIgual: true });
  }
  return rangos;
};

const obtenerAjusteEspecial = (codigo) => {
  const match = codigo.match(/if \(titulo.toLowerCase\(\)\.startsWith\('cable'\) && precio < (\d+)\) {\s*precioAjustado \+= (\d+);/);
  if (match) {
    return `if (titulo.toLowerCase().startsWith('cable') && precio < ${match[1]}) {\n    precioAjustado += ${match[2]};\n    return redondearA500(precioAjustado);\n  }`;
  }
  return '';
};

const Toast = ({ mensaje, tipo, onClose, dark }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
    <div className={`toast show align-items-center text-white ${tipo === 'success' ? 'bg-success' : 'bg-danger'}${dark ? ' border border-light' : ''}`} role="alert" aria-live="assertive" aria-atomic="true">
      <div className="d-flex">
        <div className="toast-body">{mensaje}</div>
        <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={onClose}></button>
      </div>
    </div>
  </div>
);

const AdminPrecios = () => {
  const [rangos, setRangos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [ajusteEspecial, setAjusteEspecial] = useState('');
  const [toast, setToast] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Protección extra: no mostrar nada si no es admin
  if (typeof window !== 'undefined' && localStorage.getItem('esAdmin') !== 'true') {
    return null;
  }

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    setDarkMode(theme === 'dark');
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setDarkMode(t === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('esAdmin') !== 'true') {
      navigate('/');
      return;
    }
    const fetchCodigo = () => {
      fetch(`${BACKEND_URL}/api/precios-utils?raw=1`)
        .then(res => res.text())
        .then(codigo => {
          setCodigo(codigo);
          setRangos(obtenerRangosDesdeCodigo(codigo));
          setAjusteEspecial(obtenerAjusteEspecial(codigo));
        });
    };
    fetchCodigo();
  }, [navigate]);

  const actualizarRango = (idx, campo, valor) => {
    setRangos(rangos => rangos.map((r, i) => i === idx ? { ...r, [campo]: valor } : r));
  };

  const sumarRestar = (idx, campo, delta) => {
    setRangos(rangos => rangos.map((r, i) => i === idx ? { ...r, [campo]: Math.max(0, r[campo] + delta) } : r));
  };

  const agregarRango = () => {
    setRangos([...rangos, { limite: 0, monto: 0 }]);
  };

  const eliminarRango = (idx) => {
    setRangos(rangos => rangos.filter((_, i) => i !== idx));
  };

  const guardarCambios = async () => {
    if (rangos.length < 2 || !rangos[rangos.length-1].mayorIgual) {
      setToast({ mensaje: 'Debe haber al menos un rango abierto (mayor o igual) al final.', tipo: 'danger' });
      return;
    }
    setGuardando(true);
    setToast(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/precios-utils`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangos, ajusteEspecial })
      });
      if (res.ok) {
        setToast({ mensaje: '¡Guardado con éxito!', tipo: 'success' });
        // Recargar rangos después de guardar
        fetch(`${BACKEND_URL}/api/precios-utils?raw=1`)
          .then(res => res.text())
          .then(codigo => {
            setCodigo(codigo);
            setRangos(obtenerRangosDesdeCodigo(codigo));
            setAjusteEspecial(obtenerAjusteEspecial(codigo));
          });
      } else {
        setToast({ mensaje: 'Error al guardar.', tipo: 'danger' });
      }
    } catch (e) {
      setToast({ mensaje: 'Error de conexión.', tipo: 'danger' });
    }
    setGuardando(false);
  };

  // --- DESCUENTOS ---
  const [descuentos, setDescuentos] = useState([]);
  const [editandoDescuento, setEditandoDescuento] = useState(null);
  const [nuevoDescuento, setNuevoDescuento] = useState({ tipo: 'cantidad', minCantidad: 2, descuento: 0, esPorcentaje: true, productoId: '' });
  const [guardandoDescuentos, setGuardandoDescuentos] = useState(false);

  // Cargar reglas de descuento al montar
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/descuentos`)
      .then(res => res.json())
      .then(setDescuentos)
      .catch(() => setDescuentos([]));
  }, []);

  const guardarDescuentos = async (reglas) => {
    setGuardandoDescuentos(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/descuentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reglas)
      });
      if (res.ok) {
        setDescuentos(reglas);
        setToast({ mensaje: 'Descuentos guardados', tipo: 'success' });
      } else {
        setToast({ mensaje: 'Error al guardar descuentos', tipo: 'danger' });
      }
    } catch (e) {
      setToast({ mensaje: 'Error de conexión al guardar descuentos', tipo: 'danger' });
    }
    setGuardandoDescuentos(false);
  };

  const handleAgregarDescuento = () => {
    let regla = { ...nuevoDescuento };
    if (regla.tipo === 'producto') regla.productoId = parseInt(regla.productoId);
    setDescuentos([...descuentos, regla]);
    setNuevoDescuento({ tipo: 'cantidad', minCantidad: 2, descuento: 0, esPorcentaje: true, productoId: '' });
  };

  const handleEliminarDescuento = (idx) => {
    setDescuentos(descuentos.filter((_, i) => i !== idx));
  };

  const handleEditarDescuento = (idx) => {
    setEditandoDescuento(idx);
    setNuevoDescuento({ ...descuentos[idx] });
  };

  const handleGuardarEdicion = () => {
    let regla = { ...nuevoDescuento };
    if (regla.tipo === 'producto') regla.productoId = parseInt(regla.productoId);
    setDescuentos(descuentos.map((r, i) => i === editandoDescuento ? regla : r));
    setEditandoDescuento(null);
    setNuevoDescuento({ tipo: 'cantidad', minCantidad: 2, descuento: 0, esPorcentaje: true, productoId: '' });
  };

  // --- DESCUENTOS POR RANGO DE PRECIO ---
  const [rangoMinCantidad, setRangoMinCantidad] = useState(3);
  const [rangosPrecio, setRangosPrecio] = useState([
    { min: 0, max: 10000, descuento: 20, esPorcentaje: true },
    { min: 10001, max: 30000, descuento: 10, esPorcentaje: true },
    { min: 30001, max: null, descuento: 5, esPorcentaje: true }
  ]);

  // Sincronizar con descuentos.json si existe una regla de tipo rango_precio
  useEffect(() => {
    const reglaRango = descuentos.find(r => r.tipo === 'rango_precio');
    if (reglaRango) {
      setRangoMinCantidad(reglaRango.minCantidad);
      setRangosPrecio(reglaRango.rangos);
    }
  }, [descuentos]);

  const handleAgregarRango = () => {
    setRangosPrecio([...rangosPrecio, { min: 0, max: null, descuento: 0, esPorcentaje: true }]);
  };
  const handleEliminarRango = (idx) => {
    setRangosPrecio(rangosPrecio.filter((_, i) => i !== idx));
  };
  const handleGuardarRangos = () => {
    const nuevaRegla = {
      tipo: 'rango_precio',
      minCantidad: rangoMinCantidad,
      rangos: rangosPrecio.map(r => ({ ...r, min: Number(r.min), max: r.max === '' ? null : (r.max !== null ? Number(r.max) : null), descuento: Number(r.descuento), esPorcentaje: !!r.esPorcentaje }))
    };
    guardarDescuentos([nuevaRegla]);
  };

  // --- DESCUENTOS POR RANGO DE PRECIO MULTIPLES ---
  const [reglasRango, setReglasRango] = useState([]);
  useEffect(() => {
    setReglasRango(descuentos.filter(r => r.tipo === 'rango_precio'));
  }, [descuentos]);

  const handleAgregarReglaRango = () => {
    setReglasRango([...reglasRango, {
      tipo: 'rango_precio',
      minCantidad: 2,
      rangos: [
        { min: 0, max: 10000, descuento: 10, esPorcentaje: true },
        { min: 10001, max: null, descuento: 5, esPorcentaje: true }
      ]
    }]);
  };
  const handleEliminarReglaRango = (idx) => {
    setReglasRango(reglasRango.filter((_, i) => i !== idx));
  };
  const handleGuardarTodasReglasRango = () => {
    guardarDescuentos([...descuentos.filter(r => r.tipo !== 'rango_precio'), ...reglasRango]);
  };

  // --- DESCUENTOS POR GANANCIA ACUMULADA ---
  const [reglasGanancia, setReglasGanancia] = useState([]);
  useEffect(() => {
    setReglasGanancia(descuentos.filter(r => r.tipo === 'ganancia'));
  }, [descuentos]);

  const handleAgregarReglaGanancia = () => {
    setReglasGanancia([...reglasGanancia, {
      tipo: 'ganancia',
      minCantidad: 2,
      porcentaje: 10
    }]);
  };
  const handleEliminarReglaGanancia = (idx) => {
    setReglasGanancia(reglasGanancia.filter((_, i) => i !== idx));
  };
  const handleGuardarTodasReglasGanancia = () => {
    guardarDescuentos([
      ...descuentos.filter(r => r.tipo !== 'ganancia'),
      ...reglasGanancia,
      ...descuentos.filter(r => r.tipo === 'rango_precio') // mantener reglas de rango
    ]);
  };

  return (
    <div className={`container py-5 d-flex flex-column align-items-center ${darkMode ? 'bg-dark' : ''}`} style={{ minHeight: '100vh', background: darkMode ? 'var(--background-color, #181a1b)' : '#f5f7fa' }}>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} dark={darkMode} />}
      <div style={{ maxWidth: 700, width: '100%' }}>
        <h2 className={`mb-2 text-center fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>Administración de Rangos de Precios</h2>
        <p className={`text-center mb-4 ${darkMode ? 'text-secondary' : 'text-muted'}`} style={{ fontSize: '1.05rem' }}>Editá los rangos y montos de ajuste de precios. Los cambios impactan en toda la web.</p>
        <div className="d-flex flex-column gap-3">
          {rangos.map((r, idx) => (
            <div key={idx} className={`rounded-4 px-3 py-2 d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 border${r.mayorIgual ? ' border-info' : ''}`} style={{ background: r.mayorIgual ? (darkMode ? '#1e293b' : '#e0f2fe') : (darkMode ? '#262b32' : '#fff'), borderColor: r.mayorIgual ? '#0ea5e9' : (darkMode ? '#555' : '#e5e7eb'), borderWidth: 2, borderRadius: 18, minHeight: 70, boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.07)', marginTop: r.mayorIgual ? 32 : 0 }}>
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1 justify-content-center justify-content-md-start">
                <span className={`fw-bold ${darkMode ? 'text-white' : 'text-dark'}`}>{r.mayorIgual ? 'Si precio >=' : 'Si precio <'} </span>
                <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} title="Restar 500" onClick={() => !r.mayorIgual && sumarRestar(idx, 'limite', -500)} disabled={!!r.mayorIgual}><FaMinus /></button>
                  <input type="number" value={r.limite} min={0} step={500} className={`form-control text-center ${darkMode ? 'bg-dark text-white border-light' : ''}`} style={{ minWidth: 90, width: 90, height: 40, fontSize: 18, background: darkMode ? '#181a1b' : undefined }}
                    onChange={e => !r.mayorIgual && actualizarRango(idx, 'limite', parseInt(e.target.value)||0)} disabled={!!r.mayorIgual} />
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} title="Sumar 500" onClick={() => !r.mayorIgual && sumarRestar(idx, 'limite', 500)} disabled={!!r.mayorIgual}><FaPlus /></button>
                </div>
                {r.mayorIgual && null}
                <span className={`mx-2 ${darkMode ? 'text-white' : 'text-dark'}`}>sumar</span>
                <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`} title="Restar 500" onClick={() => sumarRestar(idx, 'monto', -500)}><FaMinus /></button>
                  <input type="number" value={r.monto} min={0} step={500} className={`form-control text-center ${darkMode ? 'bg-dark text-white border-info' : ''}`} style={{ minWidth: 90, width: 90, height: 40, fontSize: 18, background: darkMode ? '#181a1b' : undefined }}
                    onChange={e => actualizarRango(idx, 'monto', parseInt(e.target.value)||0)} />
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`} title="Sumar 500" onClick={() => sumarRestar(idx, 'monto', 500)}><FaPlus /></button>
                </div>
              </div>
              {!r.mayorIgual && <button type="button" className="btn btn-danger rounded-pill px-4 d-flex align-items-center gap-2 ms-md-2 mt-2 mt-md-0" style={{ minWidth: 110, height: 44, fontSize: 18, boxShadow: darkMode ? '0 2px 8px rgba(255,0,0,0.08)' : undefined }} onClick={() => eliminarRango(idx)} title="Eliminar este rango" aria-label="Eliminar rango"><FaTrash /> Eliminar</button>}
            </div>
          ))}
          <button className="btn btn-success mt-2 rounded-pill px-4 align-self-center" style={{ minWidth: 180 }} onClick={agregarRango}>Agregar rango</button>
        </div>
        <div className="mt-4">
          <h5 className={`mb-2 ${darkMode ? 'text-light' : 'text-dark'}`} style={{ fontSize: '1.1rem' }}>Ajuste especial (opcional, para cables):</h5>
          <textarea className={`form-control ${darkMode ? 'bg-dark text-light border-secondary' : ''}`} rows={3} value={ajusteEspecial}
            onChange={e => setAjusteEspecial(e.target.value)} style={{ borderRadius: 12 }} />
        </div>
        {/* SECCIÓN DESCUENTOS */}
        <div className="mt-5 mb-4 p-4 rounded-4" style={{ background: darkMode ? '#23272f' : '#f8fafc', border: '2px solid #0ea5e9' }}>
          <h4 className={`mb-3 fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>Descuentos configurables</h4>
          <div className="mb-3">
            <label className="form-label">Tipo de descuento:</label>
            <select className="form-select" value={nuevoDescuento.tipo} onChange={e => setNuevoDescuento(nd => ({ ...nd, tipo: e.target.value }))}>
              <option value="cantidad">Por cantidad total</option>
              <option value="producto">Por producto específico</option>
            </select>
          </div>
          {nuevoDescuento.tipo === 'producto' && (
            <div className="mb-3">
              <label className="form-label">ID del producto:</label>
              <input type="number" className="form-control" value={nuevoDescuento.productoId} onChange={e => setNuevoDescuento(nd => ({ ...nd, productoId: e.target.value }))} />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Cantidad mínima:</label>
            <input type="number" className="form-control" value={nuevoDescuento.minCantidad} min={1} onChange={e => setNuevoDescuento(nd => ({ ...nd, minCantidad: parseInt(e.target.value) }))} />
          </div>
          <div className="mb-3">
            <label className="form-label">Descuento:</label>
            <input type="number" className="form-control" value={nuevoDescuento.descuento} min={0} onChange={e => setNuevoDescuento(nd => ({ ...nd, descuento: parseFloat(e.target.value) }))} />
          </div>
          <div className="mb-3">
            <label className="form-label">Tipo de descuento:</label>
            <select className="form-select" value={nuevoDescuento.esPorcentaje ? 'porcentaje' : 'fijo'} onChange={e => setNuevoDescuento(nd => ({ ...nd, esPorcentaje: e.target.value === 'porcentaje' }))}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Monto fijo ($)</option>
            </select>
          </div>
          <div className="mb-3 d-flex gap-2">
            {editandoDescuento === null ? (
              <button className="btn btn-success" onClick={handleAgregarDescuento}>Agregar descuento</button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleGuardarEdicion}>Guardar edición</button>
                <button className="btn btn-secondary" onClick={() => { setEditandoDescuento(null); setNuevoDescuento({ tipo: 'cantidad', minCantidad: 2, descuento: 0, esPorcentaje: true, productoId: '' }); }}>Cancelar</button>
              </>
            )}
            <button className="btn btn-info ms-auto" disabled={guardandoDescuentos} onClick={() => guardarDescuentos(descuentos)}>
              {guardandoDescuentos ? 'Guardando...' : 'Guardar todos los descuentos'}
            </button>
          </div>
          <hr />
          <h5 className="mb-3">Reglas configuradas:</h5>
          <ul className="list-group">
            {descuentos.length === 0 && <li className="list-group-item">No hay reglas de descuento configuradas.</li>}
            {descuentos.map((r, idx) => (
              <li key={idx} className="list-group-item d-flex align-items-center gap-2">
                <span className="badge bg-primary">{r.tipo === 'cantidad' ? 'Por cantidad' : 'Por producto'}</span>
                {r.tipo === 'producto' && <span>ID: {r.productoId}</span>}
                <span>Cant. mínima: {r.minCantidad}</span>
                <span>Descuento: {r.descuento} {r.esPorcentaje ? '%' : '$'}</span>
                <button className="btn btn-sm btn-outline-primary ms-auto" onClick={() => handleEditarDescuento(idx)}>Editar</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarDescuento(idx)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
        {/* FIN SECCIÓN DESCUENTOS */}
        {/* SECCIÓN DESCUENTOS POR RANGO DE PRECIO MULTIPLES */}
        <div className="mt-5 mb-4 p-4 rounded-4" style={{ background: darkMode ? '#23272f' : '#f8fafc', border: '2px solid #0ea5e9' }}>
          <h4 className={`mb-3 fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>Descuentos por rango de precio (escalonados por cantidad)</h4>
          {reglasRango.map((regla, idx) => (
            <div key={idx} className="mb-4 p-3 border rounded-3" style={{ borderColor: '#0ea5e9' }}>
              <div className="d-flex align-items-center mb-2 gap-2">
                <label className="form-label mb-0">Cantidad mínima de productos:</label>
                <input type="number" className="form-control" style={{ width: 90 }} value={regla.minCantidad} min={1} onChange={e => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, minCantidad: Number(e.target.value) } : rr))} />
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => handleEliminarReglaRango(idx)}>Eliminar tabla</button>
              </div>
              <h6 className="mb-2">Rangos de precio y descuento:</h6>
              <ul className="list-group mb-2">
                {regla.rangos.map((r, ridx) => (
                  <li key={ridx} className="list-group-item d-flex align-items-center gap-2">
                    <span>Desde $</span>
                    <input type="number" className="form-control" style={{ width: 90 }} value={r.min} min={0} onChange={e => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: rr.rangos.map((rrr, j) => j === ridx ? { ...rrr, min: Number(e.target.value) } : rrr) } : rr))} />
                    <span>hasta</span>
                    <input type="number" className="form-control" style={{ width: 90 }} value={r.max === null ? '' : r.max} min={0} onChange={e => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: rr.rangos.map((rrr, j) => j === ridx ? { ...rrr, max: e.target.value === '' ? null : Number(e.target.value) } : rrr) } : rr))} placeholder="Sin límite" />
                    <span>descuento:</span>
                    <input type="number" className="form-control" style={{ width: 70 }} value={r.descuento} min={0} onChange={e => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: rr.rangos.map((rrr, j) => j === ridx ? { ...rrr, descuento: Number(e.target.value) } : rrr) } : rr))} />
                    <select className="form-select" style={{ width: 130 }} value={r.esPorcentaje ? 'porcentaje' : (r.sobreGanancia ? 'ganancia' : 'fijo')} onChange={e => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: rr.rangos.map((rrr, j) => j === ridx ? { ...rrr, esPorcentaje: e.target.value === 'porcentaje', sobreGanancia: e.target.value === 'ganancia' } : rrr) } : rr))}>
                      <option value="porcentaje">% (Porcentaje)</option>
                      <option value="fijo">$ fijo</option>
                      <option value="ganancia">% sobre ganancia</option>
                    </select>
                    <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: rr.rangos.filter((_, j) => j !== ridx) } : rr))}>Eliminar rango</button>
                  </li>
                ))}
              </ul>
              <button className="btn btn-success mb-2" onClick={() => setReglasRango(reglasRango.map((rr, i) => i === idx ? { ...rr, rangos: [...rr.rangos, { min: 0, max: null, descuento: 0, esPorcentaje: true }] } : rr))}>Agregar rango</button>
            </div>
          ))}
          <button className="btn btn-primary mb-3" onClick={handleAgregarReglaRango}>Agregar tabla de descuentos por cantidad</button>
          <button className="btn btn-info ms-2" onClick={handleGuardarTodasReglasRango}>Guardar todos los descuentos por rango</button>
        </div>
        {/* FIN SECCIÓN DESCUENTOS POR RANGO DE PRECIO MULTIPLES */}
        {/* SECCIÓN DESCUENTOS POR GANANCIA ACUMULADA */}
        <div className="mt-5 mb-4 p-4 rounded-4" style={{ background: darkMode ? '#23272f' : '#f8fafc', border: '2px solid #0ea5e9' }}>
          <h4 className={`mb-3 fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>Descuentos por porcentaje sobre la ganancia acumulada</h4>
          {reglasGanancia.map((regla, idx) => (
            <div key={idx} className="mb-3 p-3 border rounded-3" style={{ borderColor: '#0ea5e9' }}>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0">Cantidad mínima de productos:</label>
                <input type="number" className="form-control" style={{ width: 90 }} value={regla.minCantidad} min={1} onChange={e => setReglasGanancia(reglasGanancia.map((rr, i) => i === idx ? { ...rr, minCantidad: Number(e.target.value) } : rr))} />
                <label className="form-label mb-0 ms-3">% de descuento sobre la ganancia:</label>
                <input type="number" className="form-control" style={{ width: 90 }} value={regla.porcentaje} min={1} max={100} onChange={e => setReglasGanancia(reglasGanancia.map((rr, i) => i === idx ? { ...rr, porcentaje: Number(e.target.value) } : rr))} />
                <span>%</span>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => handleEliminarReglaGanancia(idx)}>Eliminar</button>
              </div>
            </div>
          ))}
          <button className="btn btn-primary mb-3" onClick={handleAgregarReglaGanancia}>Agregar descuento por ganancia</button>
          <button className="btn btn-info ms-2" onClick={handleGuardarTodasReglasGanancia}>Guardar descuentos por ganancia</button>
        </div>
        {/* FIN SECCIÓN DESCUENTOS POR GANANCIA ACUMULADA */}
        <div className="d-flex flex-column align-items-center mt-4 gap-2">
          <button className="btn btn-primary rounded-pill px-5 py-2 fs-5" style={{ minWidth: 220 }} onClick={guardarCambios} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPrecios; 