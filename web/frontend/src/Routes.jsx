import React from 'react';
import { Routes, Route } from 'react-router-dom';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div>Hello Shopify 👋</div>} />
      {/* Add other routes as needed */}
    </Routes>
  );
}
