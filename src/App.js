import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import PortfolioLeft from './components/PortfolioLeft';
import PortfolioRight from './components/PortfolioRight';
import News from './components/News';
import Alerts from './components/Alerts';
import './App.css';
import bullGif from './bull.gif';
import bearGif from './bear.gif';
import alarmSound from './alarm.mp3';
import bg2 from './ayyo.png';
import bg3 from './tlo2.png';
import Scanner from './components/Info';

import bg6 from './tlo6.jpg';
import bg7 from './tlo8.jpg';
import bg8 from './tlo12.jpg';
import bg9 from './tlo11.jpg';



function App() {
  const [bullAlert, setBullAlert] = useState(false);
  const [bearAlert, setBearAlert] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [charts, setCharts] = useState([]);

const triggerAlert = (type) => {
  const audio = new Audio(alarmSound);
  audio.play();
  if (type === 'ABOVE') {
    setBullAlert(true);
    setTimeout(() => setBullAlert(false), 5000);
  } else {
    setBearAlert(true);
    setTimeout(() => setBearAlert(false), 5000);
  }
};
 const openChart = (stock) => {
  setSelectedStock(stock);
  setCharts(prev => [...prev, {
    id: Date.now(),
    stock,
    x: 200 + Math.random() * 200,
    y: 50 + Math.random() * 150,
    width: 800,
    height: 600
  }]);

};

const closeChart = (stockId) => {
  setCharts(prev => prev.filter(c => c.id !== stockId));
};

const updateChart = (stockId, data) => {
  setCharts(prev => prev.map(c => c.id === stockId ? { ...c, ...data } : c));
};

const [leftPanel, setLeftPanel] = useState({ x: 40, y: 40, width: 420, height: 600 });
const backgrounds = [bg2, bg3, bg6, bg7, bg8, bg9];
const [bgIndex, setBgIndex] = useState(3);
const panelColors = [
  'rgba(70, 90, 120, 0.88)',   // tlo2
  'rgba(80, 60, 40, 0.88)',    // ayyo
  'rgba(40, 70, 50, 0.88)',    // tlo3
  'rgba(60, 40, 80, 0.88)',    // tlo4
  'rgba(80, 50, 30, 0.88)',    // tlo6
  'rgba(30, 40, 80, 0.88)',    // tlo8
  'rgba(80, 30, 30, 0.88)',    // tlo12
];
const [scannerOpen, setScannerOpen] = useState(false);
const [scannerPanel, setScannerPanel] = useState({ x: 200, y: 50, width: 1100, height: 500 });
const [portfolioStocks, setPortfolioStocks] = useState([]);

const prevBg = () => setBgIndex(prev => (prev - 1 + backgrounds.length) % backgrounds.length);
const nextBg = () => setBgIndex(prev => (prev + 1) % backgrounds.length);
  return (
    <Router>
      <div className="app" style={{ backgroundImage: `url(${backgrounds[bgIndex]})`, backgroundSize: '100% 100%' }}>
        <nav className="navbar" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
          <h1 className="logo">📈 Portfolio Tracker</h1>
         <div className="nav-links">

  <button onClick={prevBg} style={{ background: 'none', border: 'none', color: '#f0d080', cursor: 'pointer', fontSize: '1.2rem' }}>◀</button>

  <button onClick={nextBg} style={{ background: 'none', border: 'none', color: '#f0d080', cursor: 'pointer', fontSize: '1.2rem' }}>▶</button>
   <button
  onClick={() => setScannerOpen(!scannerOpen)}
  style={{ background: 'none', border: '1px solid #4caf7d', color: '#4caf7d', cursor: 'pointer', fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '4px' }}
>
  📋 Info
</button>
  <Link to="/">Portfolio</Link>

  <Link to="/news">Newsy</Link>

  <Link to="/alerts">Alerty</Link>

</div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div style={{ position: 'relative', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
             <Rnd
  position={{ x: leftPanel.x, y: leftPanel.y }}
  size={{ width: leftPanel.width, height: leftPanel.height }}
  onDragStop={(e, d) => setLeftPanel(prev => ({ ...prev, x: d.x, y: d.y }))}
  onResizeStop={(e, dir, ref, delta, pos) => setLeftPanel({
    width: ref.offsetWidth,
    height: ref.offsetHeight,
    x: pos.x,
    y: pos.y
  })}
  bounds="parent"
  style={{ zIndex: 10 }}
>
  <PortfolioLeft
  onSelectStock={openChart}
  selectedStock={selectedStock}
  bgIndex={bgIndex}
  panelColor={panelColors[bgIndex]}
  onAlert={triggerAlert}
  onStocksLoaded={setPortfolioStocks}
/></Rnd>

              {charts.map((chart, index) => (
            <Rnd
  key={chart.id}
  position={{ x: chart.x, y: chart.y }}
  size={{ width: chart.width, height: chart.height }}
  onDragStop={(e, d) => updateChart(chart.id, { x: d.x, y: d.y })}
  onResizeStop={(e, dir, ref, delta, pos) => updateChart(chart.id, {
    width: ref.offsetWidth,
    height: ref.offsetHeight,
    x: pos.x,
    y: pos.y
  })}
  bounds="parent"
  style={{ zIndex: 10 + index }}
>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <button
                      onClick={() => closeChart(chart.id)}
style={{
  position: 'absolute',
  top: '4px',
  right: '8px',
  zIndex: 100,
  background: 'rgba(219, 93, 79, 0.8)',
  border: 'none',
  color: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  padding: 0
}}
                    >
                      ✕
                    </button>
                    <PortfolioRight selectedStock={chart.stock} />
                  </div>
                </Rnd>
              ))}
              {scannerOpen && (
                <Rnd
                  position={{ x: scannerPanel.x, y: scannerPanel.y }}
                  size={{ width: scannerPanel.width, height: scannerPanel.height }}
                  onDragStop={(e, d) => setScannerPanel(prev => ({ ...prev, x: d.x, y: d.y }))}
                  onResizeStop={(e, dir, ref, delta, pos) => setScannerPanel({
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                    x: pos.x,
                    y: pos.y
                  })}
                  bounds="parent"
                  style={{ zIndex: 20 }}
                >
                  <Scanner stocks={portfolioStocks} />
                </Rnd>
              )}
            </div>
          } />
         <Route path="/news" element={<News />} />
      <Route path="/alerts" element={<Alerts />} />
      </Routes>
      {bullAlert && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <img src={bullGif} alt="bull" style={{ width: '300px', height: '300px', borderRadius: '20px' }} />
        </div>
      )}
      {bearAlert && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '65%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <img src={bearGif} alt="bear" style={{ width: '300px', height: '300px', borderRadius: '20px' }} />
        </div>
      )}
      </div>
    </Router>
  );
}

export default App;