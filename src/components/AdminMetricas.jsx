import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config';

const AdminMetricas = () => {
  const [stats, setStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [insights, setInsights] = useState(null);
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

  useEffect(() => {
    const fetchEventStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/event-stats?granularity=${granularity}&range=${range}`);
        const json = await res.json();
        setEventStats(json);
      } catch (e) {
        setEventStats({ ok: false, error: e.message });
      }
    };
    fetchEventStats();
  }, [granularity, range]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/insights?range=${range}`);
        const json = await res.json();
        setInsights(json);
      } catch (e) {
        setInsights({ ok: false, error: e.message });
      }
    };
    fetchInsights();
  }, [range]);

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

      {/* Panel de eventos */}
      <h5 className="mt-4 mb-2">Eventos (carrito)</h5>
      {eventStats?.ok ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card p-3">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Add to cart</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{eventStats.totals?.add_to_cart || 0}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card p-3">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>View cart</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{eventStats.totals?.view_cart || 0}</div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card p-3">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Conversión (view/add)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{Math.round((eventStats.totals?.conversion || 0) * 100)}%</div>
              </div>
            </div>
          </div>

          <div className="card p-3 mb-3">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Add to cart</th>
                    <th>View cart</th>
                    <th>Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {(eventStats.series || []).map((r) => (
                    <tr key={r.period}>
                      <td>{r.period}</td>
                      <td>{r.add_to_cart}</td>
                      <td>{r.view_cart}</td>
                      <td>{Math.round((r.conversion || 0) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {Array.isArray(eventStats.topProducts) && eventStats.topProducts.length > 0 && (
            <div className="card p-3">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Add to cart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventStats.topProducts.map(p => (
                      <tr key={p.productId}>
                        <td>
                          {p.title ? (
                            <a href={`/producto/${p.productId}`} target="_blank" rel="noreferrer">{p.title}</a>
                          ) : p.productId}
                        </td>
                        <td>{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-3">
          <div className="text-muted">Sin datos de eventos aún.</div>
          {eventStats?.error && <div className="text-danger mt-2" style={{ fontSize: '0.9rem' }}>{eventStats.error}</div>}
        </div>
      )}

      {/* Insights de tráfico */}
      <h5 className="mt-4 mb-2">Tráfico</h5>
      {insights?.ok ? (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="card p-3 h-100">
              <div className="mb-2 fw-semibold">Páginas más vistas</div>
              <ul className="list-unstyled mb-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {insights.topPaths.map(i => (
                  <li key={i.value} className="d-flex justify-content-between border-bottom py-1">
                    <span className="text-truncate" style={{ maxWidth: '75%' }}>{i.value}</span>
                    <span className="fw-semibold">{i.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card p-3 h-100">
              <div className="mb-2 fw-semibold">Referers</div>
              <ul className="list-unstyled mb-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {insights.topReferers.map(i => (
                  <li key={i.value} className="d-flex justify-content-between border-bottom py-1">
                    <span className="text-truncate" style={{ maxWidth: '75%' }}>{i.value}</span>
                    <span className="fw-semibold">{i.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card p-3 h-100">
              <div className="mb-2 fw-semibold">Países</div>
              <ul className="list-unstyled mb-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {insights.topCountries.map(i => (
                  <li key={i.value} className="d-flex justify-content-between border-bottom py-1">
                    <span className="text-truncate" style={{ maxWidth: '75%' }}>{i.value}</span>
                    <span className="fw-semibold">{i.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-3">
          <div className="text-muted">Sin insights aún.</div>
          {insights?.error && <div className="text-danger mt-2" style={{ fontSize: '0.9rem' }}>{insights.error}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminMetricas;


