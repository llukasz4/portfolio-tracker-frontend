import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [stockId, setStockId] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [type, setType] = useState('ABOVE');

  useEffect(() => {
    fetchAlerts();
    fetchStocks();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API}/api/alerts`);
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStocks = async () => {
    try {
      const res = await axios.get(`${API}/api/stocks`);
      setStocks(res.data);
      if (res.data.length > 0) setStockId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const addAlert = async () => {
    if (!stockId || !targetPrice) return;
    try {
      await axios.post(`${API}/api/alerts`, {
        stock: { id: parseInt(stockId) },
        targetPrice: parseFloat(targetPrice),
        type
      });
      setTargetPrice('');
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAlert = async (id) => {
    await axios.delete(`${API}/api/alerts/${id}`);
    fetchAlerts();
  };

  return (
    <div className="alerts-page">
      <h2>Konfiguracja alertów</h2>

      <div className="alert-config-card">
        <h3>Dodaj nowy alert</h3>
        <div className="form-row">
          <select value={stockId} onChange={e => setStockId(e.target.value)}>
            {stocks.map(s => (
              <option key={s.id} value={s.id}>{s.ticker} — {s.companyName}</option>
            ))}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="ABOVE">📈 Powyżej</option>
            <option value="BELOW">📉 Poniżej</option>
          </select>
          <input
            placeholder="Cena docelowa $"
            type="number"
            value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addAlert}>Dodaj alert</button>
        </div>
      </div>

      <table className="alerts-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Spółka</th>
            <th>Warunek</th>
            <th>Cena docelowa</th>
            <th>Status</th>
            <th>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(alert => (
            <tr key={alert.id}>
              <td style={{ color: '#4caf7d', fontWeight: '600' }}>{alert.stock.ticker}</td>
              <td style={{ color: '#787b86' }}>{alert.stock.companyName}</td>
              <td>{alert.type === 'ABOVE' ? '📈 Powyżej' : '📉 Poniżej'}</td>
              <td style={{ color: '#d1d4dc' }}>${alert.targetPrice}</td>
              <td>
                {alert.triggered
                  ? <span style={{ color: '#f23645' }}>⚡ Wyzwolony</span>
                  : <span style={{ color: '#4caf7d' }}>✓ Aktywny</span>}
              </td>
              <td>
                <button className="btn btn-danger" onClick={() => deleteAlert(alert.id)}>Usuń</button>
              </td>
            </tr>
          ))}
          {alerts.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', color: '#787b86', padding: '2rem' }}>
                Brak skonfigurowanych alertów
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Alerts;