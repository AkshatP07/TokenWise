import React from 'react';
import {Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transactions/:tokenAccount" element={<Transactions/>} />
      </Routes>
    </>
  );
}

export default App;
