import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CreateTimer from './pages/CreateTimer';
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CreateTimer/>} />
      {/* Add other routes as needed */}
    </Routes>
  );
}
