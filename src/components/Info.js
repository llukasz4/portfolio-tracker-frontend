import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080';

function Scanner({ stocks }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (stocks && stocks.length > 0) {
    fetchFundamentals();
  }
}, [stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFundamentals = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        stocks.map(async (stock) => {
          const [metricsRes, profileRes] = await Promise.allSettled([
            axios.get(`${API}/api/fundamentals/${stock.ticker}`),
            axios.get(`${API}/api/fundamentals/profile/${stock.ticker}`)
          ]);

          const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value.data.metric : {};
          const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : {};

          return {
            ticker: stock.ticker,
            name: stock.companyName,
            price: stock.currentPrice,
            marketCap: metrics.marketCapitalization,
            avgVolume: metrics['3MonthAverageTradingVolume'],
            eps: metrics.epsAnnual,
            pe: metrics.peExclExtraTTM,
            evEbitda: metrics.evEbitdaTTM,
            peg: metrics.pegTTM,
            debt: metrics['longTermDebt/equityAnnual'],
            revenueGrowth: metrics.revenueGrowthTTMYoy,
            evSales: metrics.evRevenueTTM,
            industry: profile.finnhubIndustry || '—',
            float: profile.shareOutstanding,
          };
        })
      );

      setData(results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fmt = (val, decimals = 2) => val != null ? Number(val).toFixed(decimals) : '—';
  const fmtB = (val) => val != null ? `$${(val / 1000).toFixed(1)}B` : '—';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(15,20,30,0.95)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2e39', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#d1d4dc', fontWeight: '600', fontSize: '0.9rem' }}>📋 Info</span>
        <button
          onClick={fetchFundamentals}
          style={{ background: 'rgba(76,175,125,0.2)', border: '1px solid #4caf7d', color: '#4caf7d', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Odśwież
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#787b86', textAlign: 'center', padding: '2rem' }}>Ładowanie danych...</div>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#1e222d', position: 'sticky', top: 0 }}>
                {['Ticker', 'Cena', 'Market Cap', 'Avg Vol (M)', 'Industry', 'EPS', 'P/E', 'EV/EBITDA', 'PEG', 'Dług/Ekwity', 'Rev Growth %', 'EV/Sales'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', color: '#787b86', fontWeight: '500', textAlign: 'left', borderBottom: '1px solid #2a2e39', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.ticker} style={{ borderBottom: '1px solid #1e222d' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e222d'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.5rem 0.75rem', color: '#4caf7d', fontWeight: '600' }}>{row.ticker}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>${fmt(row.price)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmtB(row.marketCap)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.avgVolume, 1)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc', whiteSpace: 'nowrap' }}>{row.industry}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.eps)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.pe)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.evEbitda)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.peg)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: row.debt > 2 ? '#f23645' : '#d1d4dc' }}>{fmt(row.debt)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: row.revenueGrowth > 0 ? '#4caf7d' : '#f23645' }}>{fmt(row.revenueGrowth)}%</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#d1d4dc' }}>{fmt(row.evSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Scanner;