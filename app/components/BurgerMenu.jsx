import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function BurgerMenu({ tab, setTab, theme, setTheme, lang, setLang, t }) {
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || !burgerOpen) return;
    const handleClick = (e) => {
      const menu = document.querySelector('.burger-menu');
      const btn = document.querySelector('.burger-btn');
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setBurgerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isClient, burgerOpen]);

  if (!isClient) return null;
  const burgerRoot = document.getElementById('burger-root');
  if (!burgerRoot) return null;

  return createPortal(
    <>
      <button className="burger-btn" aria-label="Меню" onClick={e => { e.stopPropagation(); if (!burgerOpen) setBurgerOpen(true); }}>
        <span style={{fontSize: '2rem', lineHeight: 1}}>&#9776;</span>
      </button>
      {burgerOpen && <div className="burger-overlay" onClick={e => { e.stopPropagation(); setBurgerOpen(false); }}></div>}
      {burgerOpen && (
        <nav className="burger-menu" role="dialog" aria-modal="true" aria-label="Меню" onClick={e => e.stopPropagation()}>
          <button className="burger-menu-close" aria-label="Закрыть меню" onClick={() => setBurgerOpen(false)}>&times;</button>
          <div className="burger-menu-title">FREEZBY</div>
          <button
            className={tab === 'search' ? 'burger-menu-btn active' : 'burger-menu-btn'}
            onClick={() => { setTab('search'); setBurgerOpen(false); }}
          >{t.searchButton}</button>
          <button
            className={tab === 'player' ? 'burger-menu-btn active' : 'burger-menu-btn'}
            onClick={() => { setTab('player'); setBurgerOpen(false); }}
          >{t.openPlaylist}</button>
          <button
            className="burger-menu-btn"
            onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
          >{theme === 'dark' ? t.lightTheme : t.darkTheme}</button>
          <button
            className="burger-menu-btn"
            onClick={() => { setLang(lang === 'ru' ? 'en' : 'ru'); }}
          >{t.switchLang}</button>
        </nav>
      )}
    </>,
    burgerRoot
  );
} 