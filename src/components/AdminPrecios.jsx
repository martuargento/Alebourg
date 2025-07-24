import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

const obtenerRangosDesdeCodigo = (codigo) => {
  const regex = /if \(precio < (\d+)\) precioAjustado \+= (\d+);/g;
  let match;
  const rangos = [];
  while ((match = regex.exec(codigo)) !== null) {
    rangos.push({ limite: parseInt(match[1]), monto: parseInt(match[2]) });
  }
  // Extrae el último else if (precio >= ...)
  const ultimo = codigo.match(/else if \(precio >= (\d+)\) precioAjustado \+= (\d+);/);
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
    fetch('/src/utils/preciosUtils.js')
      .then(res => res.text())
      .then(codigo => {
        setCodigo(codigo);
        setRangos(obtenerRangosDesdeCodigo(codigo));
        setAjusteEspecial(obtenerAjusteEspecial(codigo));
      });
  }, [navigate]);

  const actualizarRango = (idx, campo, valor) => {
    setRangos(rangos => rangos.map((r, i) => i === idx ? { ...r, [campo]: valor } : r));
  };

  const sumarRestar = (idx, campo, delta) => {
    setRangos(rangos => rangos.map((r, i) => i === idx ? { ...r, [campo]: Math.max(0, r[campo] + delta) } : r));
  };

  const agregarRango = () => {
    // No permitir agregar un rango con el mismo límite que el mayorIgual
    const mayorIgual = rangos.find(r => r.mayorIgual);
    if (mayorIgual && rangos.some(r => !r.mayorIgual && r.limite === mayorIgual.limite)) {
      setToast({ mensaje: 'No puedes agregar un rango con el mismo límite que el último (mayor o igual).', tipo: 'danger' });
      return;
    }
    setRangos([...rangos, { limite: 0, monto: 0 }]);
  };

  const eliminarRango = (idx) => {
    const limiteAEliminar = rangos[idx].limite;
    const esMayorIgual = rangos[idx].mayorIgual;
    setRangos(rangos => rangos.filter((r, i) => {
      if (esMayorIgual) return !(r.mayorIgual && r.limite === limiteAEliminar);
      // Elimina todos los duplicados de ese límite excepto el primero
      if (r.limite !== limiteAEliminar) return true;
      // Mantener solo el primero encontrado
      return rangos.findIndex(rr => rr.limite === limiteAEliminar && !rr.mayorIgual) === i;
    }));
  };

  const guardarCambios = async () => {
    if (rangos.length < 2) {
      setToast({ mensaje: 'Debes tener al menos dos rangos.', tipo: 'danger' });
      return;
    }
    setGuardando(true);
    setToast(null);
    // Filtrar duplicados de límite (excepto el último mayorIgual)
    let rangosSinDuplicados = [];
    const limitesVistos = new Set();
    rangos.forEach((r, idx) => {
      if (r.mayorIgual) {
        rangosSinDuplicados.push(r);
      } else if (!limitesVistos.has(r.limite)) {
        rangosSinDuplicados.push(r);
        limitesVistos.add(r.limite);
      }
    });
    // Si hay un < X y un >= X, eliminar el < X y dejar solo el >= X
    const mayorIgual = rangosSinDuplicados.find(r => r.mayorIgual);
    if (mayorIgual) {
      rangosSinDuplicados = rangosSinDuplicados.filter(r => r.mayorIgual || r.limite !== mayorIgual.limite);
    }
    try {
      const res = await fetch('http://localhost:3001/api/precios-utils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangos: rangosSinDuplicados, ajusteEspecial })
      });
      if (res.ok) {
        setToast({ mensaje: '¡Guardado con éxito!', tipo: 'success' });
      } else {
        setToast({ mensaje: 'Error al guardar.', tipo: 'danger' });
      }
    } catch (e) {
      setToast({ mensaje: 'Error de conexión.', tipo: 'danger' });
    }
    setGuardando(false);
  };

  // En el render, filtrar los rangos para que si existe un mayorIgual, no se muestre ningún < X con el mismo límite
  const rangosParaMostrar = (() => {
    const mayorIgual = rangos.find(r => r.mayorIgual);
    if (!mayorIgual) return rangos;
    return rangos.filter(r => r.mayorIgual || r.limite !== mayorIgual.limite);
  })();

  return (
    <div className={`container py-5 d-flex flex-column align-items-center ${darkMode ? 'bg-dark' : ''}`} style={{ minHeight: '100vh', background: darkMode ? 'var(--background-color, #181a1b)' : '#f5f7fa' }}>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} dark={darkMode} />}
      <div style={{ maxWidth: 700, width: '100%' }}>
        <h2 className={`mb-2 text-center fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>Administración de Rangos de Precios</h2>
        <p className={`text-center mb-4 ${darkMode ? 'text-secondary' : 'text-muted'}`} style={{ fontSize: '1.05rem' }}>Editá los rangos y montos de ajuste de precios. Los cambios impactan en toda la web.</p>
        <div className="d-flex flex-column gap-3">
          {rangosParaMostrar.map((r, idx) => (
            <div key={idx} className={`rounded-4 px-3 py-2 d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 border`} style={{ background: darkMode ? '#262b32' : '#fff', borderColor: darkMode ? '#555' : '#e5e7eb', borderWidth: 1, borderRadius: 18, minHeight: 70, boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1 justify-content-center justify-content-md-start">
                <span className={`fw-bold ${darkMode ? 'text-white' : 'text-dark'}`}>{r.mayorIgual ? 'Si precio >=' : 'Si precio <'} </span>
                {r.mayorIgual ? (
                  <span className={`fw-bold px-2 ${darkMode ? 'text-info' : 'text-primary'}`} style={{ fontSize: 18 }}>{r.limite}</span>
                ) : (
                  <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                    <button type="button" className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} title="Restar 500" onClick={() => sumarRestar(idx, 'limite', -500)}><FaMinus /></button>
                    <input type="number" value={r.limite} min={0} step={500} className={`form-control text-center ${darkMode ? 'bg-dark text-white border-light' : ''}`} style={{ minWidth: 90, width: 90, height: 40, fontSize: 18, background: darkMode ? '#181a1b' : undefined }}
                      onChange={e => actualizarRango(idx, 'limite', parseInt(e.target.value)||0)} />
                    <button type="button" className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} title="Sumar 500" onClick={() => sumarRestar(idx, 'limite', 500)}><FaPlus /></button>
                  </div>
                )}
                <span className={`mx-2 ${darkMode ? 'text-white' : 'text-dark'}`}>sumar</span>
                <div className="input-group input-group-sm" style={{ width: 170, maxWidth: '100%' }}>
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`} title="Restar 500" onClick={() => sumarRestar(idx, 'monto', -500)}><FaMinus /></button>
                  <input type="number" value={r.monto} min={0} step={500} className={`form-control text-center ${darkMode ? 'bg-dark text-white border-info' : ''}`} style={{ minWidth: 90, width: 90, height: 40, fontSize: 18, background: darkMode ? '#181a1b' : undefined }}
                    onChange={e => actualizarRango(idx, 'monto', parseInt(e.target.value)||0)} />
                  <button type="button" className={`btn ${darkMode ? 'btn-outline-info' : 'btn-outline-primary'}`} title="Sumar 500" onClick={() => sumarRestar(idx, 'monto', 500)}><FaPlus /></button>
                </div>
              </div>
              <button type="button" className="btn btn-danger rounded-pill px-4 d-flex align-items-center gap-2 ms-md-2 mt-2 mt-md-0" style={{ minWidth: 110, height: 44, fontSize: 18, boxShadow: darkMode ? '0 2px 8px rgba(255,0,0,0.08)' : undefined }} onClick={() => eliminarRango(idx)} title="Eliminar este rango" aria-label="Eliminar rango"><FaTrash /> Eliminar</button>
            </div>
          ))}
          <button className="btn btn-success mt-2 rounded-pill px-4 align-self-center" style={{ minWidth: 180 }} onClick={agregarRango}>Agregar rango</button>
        </div>
        <div className="mt-4">
          <h5 className={`mb-2 ${darkMode ? 'text-light' : 'text-dark'}`} style={{ fontSize: '1.1rem' }}>Ajuste especial (opcional, para cables):</h5>
          <textarea className={`form-control ${darkMode ? 'bg-dark text-light border-secondary' : ''}`} rows={3} value={ajusteEspecial}
            onChange={e => setAjusteEspecial(e.target.value)} style={{ borderRadius: 12 }} />
        </div>
        <div className="d-flex flex-column align-items-center mt-4 gap-2">
          <button className="btn btn-primary rounded-pill px-5 py-2 fs-5" style={{ minWidth: 220 }} onClick={guardarCambios} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPrecios; 