import React, { useState, useEffect } from 'react';
import axios from 'axios';
import closeIcon from '../Close.png';
import stockIcon from '../stock.png';




const API = 'https://portfolio-tracker-production-36ce.up.railway.app';
const FINNHUB_KEY = process.env.REACT_APP_FINNHUB_KEY;
console.log('Klucz:', FINNHUB_KEY);

window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('ResizeObserver')) {
    e.stopImmediatePropagation();
  }
});

function PortfolioLeft({ onSelectStock, selectedStock, bgIndex, panelColor, onAlert, onStocksLoaded }) {
  
  const [stocks, setStocks] = useState([]);
  const [positions, setPositions] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [newsPopup, setNewsPopup] = useState(null);
  const [newsMap, setNewsMap] = useState({});
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [localSelected, setLocalSelected] = useState(null);

useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []); // eslint-disable-line react-hooks/exhaustive-deps



  const fetchData = async () => {
    try {
      const [posRes, valueRes, pnlRes, alertRes] = await Promise.all([
        axios.get(`${API}/api/portfolio/positions`),
        axios.get(`${API}/api/portfolio/value`),
        axios.get(`${API}/api/portfolio/pnl`),
        axios.get(`${API}/api/alerts`)
      ]);
      setPositions(posRes.data);
      setTotalValue(valueRes.data);
      setTotalPnL(pnlRes.data);

      const triggered = alertRes.data.filter(a => a.triggered);
      setTriggeredAlerts(triggered);
      triggered.forEach(alert => onAlert(alert.type));

      const stockList = posRes.data.map(p => p.stock);
      setStocks(stockList);
      if (JSON.stringify(stockList.map(s => s.id)) !== JSON.stringify(stocks.map(s => s.id))) {
      onStocksLoaded(stockList);
}

      for (const stock of stockList) {
        fetchNewsForStock(stock.ticker);
      }

     
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNewsForStock = async (ticker) => {
    try {
      const res = await axios.get(`${API}/api/news/${ticker}`);
      setNewsMap(prev => ({ ...prev, [ticker]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const searchStock = async (query) => {
    setTicker(query);
    if (query.length < 1) { setSearchResults([]); return; }
    try {
      const res = await axios.get(
        `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_KEY}`
      );
      setSearchResults(res.data.result?.slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectStock = (result) => {
    setTicker(result.symbol);
    setCompanyName(result.description);
    setSearchResults([]);
  };

  const addPosition = async () => {
    if (!ticker) return;
    try {
      await axios.post(`${API}/api/stocks`, {
        ticker: ticker.toUpperCase(),
        companyName
      });
      const stockRes = await axios.get(`${API}/api/stocks`);
      const stock = stockRes.data.find(s => s.ticker === ticker.toUpperCase());

      const finalQuantity = quantity ? parseFloat(quantity) : 1;
      const finalPrice = avgBuyPrice ? parseFloat(avgBuyPrice) : (stock.currentPrice || 1);

      await axios.post(`${API}/api/portfolio/positions`, {
        stock: { id: stock.id },
        quantity: finalQuantity,
        avgBuyPrice: finalPrice
      });
      setTicker(''); setCompanyName(''); setQuantity(''); setAvgBuyPrice('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = (ticker) => {
    const news = newsMap[ticker] || [];
    return news.filter(n => !n.read).length;
  };

  const openNewsPopup = (e, stock) => {
    e.stopPropagation();
    setNewsPopup(newsPopup === stock.ticker ? null : stock.ticker);
  };

  const markAsRead = async (newsId, ticker) => {
    await axios.patch(`${API}/api/news/${newsId}/read`);
    setNewsMap(prev => ({
      ...prev,
      [ticker]: prev[ticker].map(n => n.id === newsId ? { ...n, read: true } : n)
    }));
  };

  const deletePosition = async (positionId) => {
    await axios.delete(`${API}/api/portfolio/positions/${positionId}`);
    fetchData();
  };

  const getPosition = (stockId) => positions.find(p => p.stock.id === stockId);

  return (
    <div className="left-panel" style={{ height: '100%', backgroundSize: '100% 100%'}}>
      <div className="summary-bar">
        <div className="summary-item">
          <h4>Wartość portfela</h4>
          <div className="val">${totalValue.toFixed(2)}</div>
        </div>
        <div className="summary-item">
          <h4>Zysk / Strata</h4>
          <div className={`val ${totalPnL >= 0 ? 'change-positive' : 'change-negative'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}$
          </div>
        </div>
      </div>

      {triggeredAlerts.length > 0 && (
        <div className="alert-banner">
          ⚡ {triggeredAlerts.map(a =>
            `${a.stock.ticker} przekroczył $${a.targetPrice}`
          ).join(', ')}
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1, backgroundColor: 'transparent' }}>
        <table className="stock-table">
          <thead>
            <tr>
              <th>Spółka</th>
              <th>Cena</th>
              <th>Zmiana</th>
              <th>News</th>
              <th>Usuń</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              const pos = getPosition(stock.id);
              const pnlPct = pos && pos.avgBuyPrice && stock.currentPrice
                ? ((stock.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice * 100).toFixed(2)
                : null;

              return (
                <tr
  key={stock.id}
  onClick={() => setLocalSelected(stock)}
  className={localSelected?.id === stock.id ? 'selected' : ''}
>
                  <td>
                    <div className="ticker-name">{stock.ticker}</div>
                    <div className="company-name">{stock.companyName}</div>
                  </td>
                  <td className="price">${stock.currentPrice ?? '—'}</td>
                  <td className={pnlPct >= 0 ? 'change-positive' : 'change-negative'}>
                    {pnlPct ? `${pnlPct >= 0 ? '+' : ''}${pnlPct}%` : '—'}
                  </td>
                  <td>
                    <button className="news-icon-btn" onClick={(e) => openNewsPopup(e, stock)}>
  <img src={require('../Newss.png')} alt="news" style={{ width: '50px', height: '30px', objectFit: 'contain' }} />
                      {unreadCount(stock.ticker) > 0 && (
                        <span className="news-badge">{unreadCount(stock.ticker)}</span>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => { e.stopPropagation(); deletePosition(getPosition(stock.id)?.id); }}
                    >
                      <img src={closeIcon} alt="close" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                    </button>
                  </td>
                  <td>
  <button
  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
  onClick={() => onSelectStock(stock)}
>
  <img src={stockIcon} alt="wykres" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
</button>
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="add-stock-form">
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Szukaj spółki (np. AAPL)"
            value={ticker}
            onChange={e => searchStock(e.target.value)}
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'auto',
              bottom: '100%',
              left: 0,
              right: 0,
              background: '#1e222d',
              border: '1px solid #363a45',
              borderRadius: '4px',
              zIndex: 100,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.map(r => (
                <div
                  key={r.symbol}
                  onClick={() => selectStock(r)}
                  style={{
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #2a2e39',
                    fontSize: '0.85rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#4caf7d', fontWeight: '600' }}>{r.symbol}</span>
                  <span style={{ color: '#787b86', marginLeft: '0.5rem' }}>{r.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="form-row-compact" style={{ marginTop: '0.5rem' }}>
          <input
            placeholder="Ilość (opcjonalnie)"
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
          <input
            placeholder="Cena zakupu $ (opcjonalnie)"
            type="number"
            value={avgBuyPrice}
            onChange={e => setAvgBuyPrice(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addPosition}>+</button>
        </div>
      </div>

      {newsPopup && (
        <div className="news-popup">
          <div className="news-popup-header">
            <h4>Newsy — {newsPopup}</h4>
          <button
  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
  onClick={() => setNewsPopup(null)}
>
  <img src={closeIcon} alt="close" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
</button>
          </div>
          {(newsMap[newsPopup] || []).map(article => (
            <div
              key={article.id}
              className={`news-item ${article.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(article.id, newsPopup)}
            >
              <a href={article.url} target="_blank" rel="noreferrer" className="news-headline">
                {article.headline}
              </a>
              <div className="news-meta">
                {article.source} · {new Date(article.publishedAt).toLocaleDateString('pl-PL')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PortfolioLeft;
// force rebuild