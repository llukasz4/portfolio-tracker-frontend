import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';

const API = 'http://localhost:8080';

function PortfolioRight({ selectedStock }) {
  const [currentInterval, setCurrentInterval] = useState('D');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const intervalRef = useRef(null);

  const getTradingViewSymbol = (ticker) => {
    if (ticker.endsWith('.PL') || ticker.endsWith('.WA')) {
      return 'GPW:' + ticker.replace('.PL', '').replace('.WA', '');
    }
    return ticker;
  };

  const isSecondInterval = (interval) => interval === '1s' || interval === '10s';

  useEffect(() => {
    if (!selectedStock) return;

    if (isSecondInterval(currentInterval)) {
      initSecondChart();
      const seconds = currentInterval === '1s' ? 1 : 10;
      loadSecondData(selectedStock.ticker, seconds);
      intervalRef.current = setInterval(() => {
        loadSecondData(selectedStock.ticker, seconds);
      }, seconds * 1000);
    } else {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [selectedStock, currentInterval]);

  const initSecondChart = () => {
    if (chartRef.current) chartRef.current.remove();
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      rightPriceScale: { borderColor: '#2a2e39' },
      timeScale: { borderColor: '#2a2e39', timeVisible: true },
    });

    const lineSeries = chart.addLineSeries({
      color: '#4caf7d',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;
  };

  const loadSecondData = async (ticker, seconds) => {
  try {
    const res = await axios.get(`${API}/api/ticks/${ticker}?seconds=${seconds * 60}`);
    if (res.data.length > 0 && seriesRef.current) {
      seriesRef.current.setData(res.data.map(d => ({
        time: d.time,
        value: parseFloat(d.value)
      })));
    } else {
      if (chartRef.current) chartRef.current.remove();
      chartRef.current = null;
    }
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="right-panel" style={{ height: '100%' }}>
      <div className="chart-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="chart-ticker">{selectedStock?.ticker ?? '—'}</span>
          <span className="chart-price">${selectedStock?.currentPrice ?? '—'}</span>
        </div>
        <div className="interval-buttons">
          {['1s', '10s', '1', '5', '10', '15', '60', 'D', 'W'].map(i => (
            <button
              key={i}
              className={`interval-btn ${currentInterval === i ? 'active' : ''}`}
              onClick={() => setCurrentInterval(i)}
            >
              {i === '1s' ? '1S' : i === '10s' ? '10S' : i === '1' ? '1M' : i === '5' ? '5M' : i === '10' ? '10M' : i === '15' ? '15M' : i === '60' ? '1H' : i === 'D' ? '1D' : '1W'}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-container" ref={chartContainerRef}>
        {!isSecondInterval(currentInterval) && selectedStock ? (
          <iframe
            key={`${selectedStock.ticker}-${currentInterval}`}
            src={`https://s.tradingview.com/widgetembed/?frametools=1&symbol=${getTradingViewSymbol(selectedStock.ticker)}&interval=${currentInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=1e222d&theme=dark&style=1&timezone=Europe%2FWarsaw&withdateranges=1&showpopupbutton=1`}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            title="TradingView Chart"
            allowFullScreen
          />
        ) : !isSecondInterval(currentInterval) ? (
          <div className="loading">Wybierz spółkę z listy</div>
        ) : null}
        {isSecondInterval(currentInterval) && !chartRef.current && (
          <div className="loading">Brak danych — giełda zamknięta lub brak tick data</div>
        )}
      </div>
    </div>
  );
}

export default PortfolioRight;