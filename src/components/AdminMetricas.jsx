import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config';

const AdminMetricas = () => {
  const [stats, setStats] = useState(null);
  const [granularity, setGranularity] = useState('day');
  const [range, setRange] = useState('30d');

  const esAdmin = typeof window !== 'undefined' && localStorage.getItem('esAdmin') === 'true';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/stats?granularity=${granularity}&range=${range}`);
        const json = await res.json();
        setStats(json);
      } catch (e) {
        setStats({ ok: false, error: e.message });
      }
    };
    fetchStats();
  }, [granularity, range]);

  if (!esAdmin) {
    return <div className="container mt-4"><h5>Acceso restringido</h5></div>;
  }

  return (
    <div className="container mt-4">
      <h4 className="titulosprincipales">Métricas</h4>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select" style={{ maxWidth: 180 }} value={granularity} onChange={e => setGranularity(e.target.value)}>
          <option value="day">Por día</option>
          <option value="week">Por semana</option>
          <option value="month">Por mes</option>
          <option value="year">Por año</option>
        </select>
        <select className="form-select" style={{ maxWidth: 180 }} value={range} onChange={e => setRange(e.target.value)}>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="3m">Últimos 3 meses</option>
          <option value="12m">Últimos 12 meses</option>
          <option value="3y">Últimos 3 años</option>
        </select>
      </div>

      {stats?.ok ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card p-3">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Visitas totales</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats.total}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card p-3">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Visitantes únicos</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats.unique}</div>
              </div>
            </div>
          </div>

          <div className="card p-3">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Total</th>
                    <th>Únicos</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.series || []).map((r) => (
                    <tr key={r.period}>
                      <td>{r.period}</td>
                      <td>{r.total}</td>
                      <td>{r.unique}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-3">
          <div className="text-muted">No hay datos aún o ocurrió un error.</div>
          {stats?.error && <div className="text-danger mt-2" style={{ fontSize: '0.9rem' }}>{stats.error}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminMetricas;


