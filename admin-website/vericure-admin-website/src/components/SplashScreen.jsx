import React from 'react';

export default function SplashScreen({ fadingOut }) {
  return (
    <div className={`app-splash${fadingOut ? ' app-splash-out' : ''}`}>
      <div className="app-splash-logo">VeriCure</div>
      <div className="app-splash-tagline">Admin Dashboard</div>
      <div className="app-splash-bar">
        <div className="app-splash-bar-fill" />
      </div>
    </div>
  );
}
