import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080';

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,TSLA,MSFT,GOOGL,AMZN&region=US&lang=en-US',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=META,NVDA,JPM,NFLX,AMD&region=US&lang=en-US',
];

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

useEffect(() => {
  fetchRssNews();
  const interval = setInterval(fetchRssNews, 120000);
  return () => clearInterval(interval);
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parseRss = (xmlString) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    const items = xml.querySelectorAll('item');
    return Array.from(items).map(item => ({
      id: item.querySelector('link')?.textContent || Math.random().toString(),
      headline: item.querySelector('title')?.textContent || '',
      url: item.querySelector('link')?.textContent || '',
      source: 'Yahoo Finance',
      publishedAt: item.querySelector('pubDate')?.textContent || '',
      summary: item.querySelector('description')?.textContent || '',
    }));
  };

  const fetchRssNews = async () => {
    try {
      const requests = RSS_FEEDS.map(feed =>
        axios.get(`${API}/api/rss/fetch?url=${encodeURIComponent(feed)}`)
      );
      const responses = await Promise.allSettled(requests);
      const allNews = responses
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => parseRss(r.value.data))
        .filter((article, index, self) =>
          index === self.findIndex(a => a.id === article.id)
        )
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNews(allNews);
      setLoading(false);
      setNews(allNews);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefresh < 1000) return;
    setLastRefresh(now);
    setLoading(true);
    fetchRssNews();
  };

  return (
    <div className="news-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '500' }}>Newsy światowe</h2>
        <button 
  onClick={handleRefresh}
  style={{
    background: 'rgba(76, 175, 125, 0.2)',
    border: '1px solid #4caf7d',
    color: '#4caf7d',
    padding: '0.5rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }}
>
  Odśwież
</button>
      </div>

      {loading && <div className="loading">Ładowanie newsów...</div>}

      {news.map(article => (
        <div className="news-card" key={article.id}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#787b86', fontSize: '0.8rem' }}>{article.source}</span>
            <span style={{ color: '#787b86', fontSize: '0.8rem' }}>
              {new Date(article.publishedAt).toLocaleDateString('pl-PL')}
            </span>
          </div>
          <a href={article.url} target="_blank" rel="noreferrer">
            {article.headline}
          </a>
          {article.summary && (
            <p style={{ color: '#787b86', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
              {article.summary}
            </p>
          )}
        </div>
      ))}

      {news.length === 0 && !loading && (
        <div className="loading">Brak newsów</div>
      )}
    </div>
  );
}

export default News;