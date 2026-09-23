import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';

/*
 * Wraps routed page content so each navigation gets a short,
 * subtle fade + translate. Keying the div on pathname forces
 * React to remount it, which replays the CSS animation.
 */
export default function PageTransition() {
  const location = useLocation();

  return (
    <div className="page-transition" key={location.pathname}>
      <Outlet />
    </div>
  );
}
