import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import ProcessMonitor from './components/ProcessMonitor';
import MemoryEditor from './components/MemoryEditor';
import AutomationPanel from './components/AutomationPanel';
import HackingTools from './components/HackingTools';
import Navigation from './components/Navigation';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className={`App min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <BrowserRouter>
        <div className="flex">
          <Navigation theme={theme} />
          <main className="flex-1 ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/processes" element={<ProcessMonitor />} />
              <Route path="/memory" element={<MemoryEditor />} />
              <Route path="/automation" element={<AutomationPanel />} />
              <Route path="/hacks" element={<HackingTools />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;