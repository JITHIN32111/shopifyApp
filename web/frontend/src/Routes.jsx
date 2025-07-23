import React from 'react';
import { Routes, Route } from 'react-router-dom';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div className='text-blue-600 bg-amber-400 h-32 w-full'>Hello user 👋</div>} />
      {/* Add other routes as needed */}
    </Routes>
  );
}
