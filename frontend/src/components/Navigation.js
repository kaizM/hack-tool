import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Monitor, 
  Settings, 
  Zap, 
  Target, 
  Activity,
  Shield,
  Terminal
} from 'lucide-react';

const Navigation = ({ theme }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, name: 'Dashboard' },
    { path: '/processes', icon: Monitor, name: 'Processes' },
    { path: '/memory', icon: Terminal, name: 'Memory Editor' },
    { path: '/automation', icon: Zap, name: 'Automation' },
    { path: '/hacks', icon: Target, name: 'Hacking Tools' },
  ];

  return (
    <nav className={`fixed left-0 top-0 h-full w-64 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border-r z-50`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="w-8 h-8 text-red-500" />
          <h1 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            GameHacker Pro
          </h1>
        </div>
        
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className={`text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span>System Online</span>
          </div>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;