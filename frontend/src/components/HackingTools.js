import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Target, 
  Zap, 
  Shield, 
  Coins, 
  Gauge,
  Eye,
  RotateCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HackingTools = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [enabledHacks, setEnabledHacks] = useState(new Set());
  const [hackSettings, setHackSettings] = useState({
    speedMultiplier: 2.0,
    aimSensitivity: 1.0,
    resourceType: 'coins'
  });

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await axios.get(`${API}/processes`);
      setProcesses(response.data);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Failed to fetch processes');
    }
  };

  const toggleHack = async (hackType) => {
    if (!selectedProcess) {
      toast.error('Please select a process first');
      return;
    }

    try {
      const isEnabled = enabledHacks.has(hackType);
      
      if (!isEnabled) {
        // Enable hack
        switch (hackType) {
          case 'unlimited-resources':
            await axios.post(`${API}/hacks/unlimited-resources`, {
              pid: parseInt(selectedProcess),
              resource_type: hackSettings.resourceType
            });
            break;
          case 'speed-boost':
            await axios.post(`${API}/hacks/speed-boost`, {
              pid: parseInt(selectedProcess),
              multiplier: hackSettings.speedMultiplier
            });
            break;
          case 'auto-aim':
            await axios.post(`${API}/hacks/auto-aim`, {
              pid: parseInt(selectedProcess),
              sensitivity: hackSettings.aimSensitivity
            });
            break;
          default:
            break;
        }
        
        setEnabledHacks(prev => new Set(prev).add(hackType));
        toast.success(`${hackType.replace('-', ' ')} enabled`);
      } else {
        // Disable hack (simulate)
        setEnabledHacks(prev => {
          const newSet = new Set(prev);
          newSet.delete(hackType);
          return newSet;
        });
        toast.success(`${hackType.replace('-', ' ')} disabled`);
      }
    } catch (error) {
      console.error('Error toggling hack:', error);
      toast.error(`Failed to toggle ${hackType}`);
    }
  };

  const HackCard = ({ hack }) => {
    const isEnabled = enabledHacks.has(hack.id);
    const IconComponent = hack.icon;
    
    return (
      <div className={`bg-gray-800 border rounded-xl p-6 hover:border-gray-600 transition-all ${
        isEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              isEnabled ? 'bg-green-500/20' : 'bg-gray-700'
            }`}>
              <IconComponent className={`w-6 h-6 ${
                isEnabled ? 'text-green-400' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{hack.name}</h3>
              <p className="text-sm text-gray-400">{hack.description}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isEnabled 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {isEnabled ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Hack-specific settings */}
        {hack.id === 'unlimited-resources' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Resource Type
            </label>
            <select
              value={hackSettings.resourceType}
              onChange={(e) => setHackSettings(prev => ({ ...prev, resourceType: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="coins">Coins</option>
              <option value="gems">Gems</option>
              <option value="health">Health</option>
              <option value="energy">Energy</option>
              <option value="xp">Experience</option>
            </select>
          </div>
        )}

        {hack.id === 'speed-boost' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Speed Multiplier: {hackSettings.speedMultiplier}x
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={hackSettings.speedMultiplier}
              onChange={(e) => setHackSettings(prev => ({ ...prev, speedMultiplier: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        )}

        {hack.id === 'auto-aim' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Sensitivity: {hackSettings.aimSensitivity}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={hackSettings.aimSensitivity}
              onChange={(e) => setHackSettings(prev => ({ ...prev, aimSensitivity: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => toggleHack(hack.id)}
            disabled={!selectedProcess}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white'
            }`}
          >
            {isEnabled ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>Disable</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Enable</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Risk Level: <span className={`font-medium ${
            hack.risk === 'low' ? 'text-green-400' :
            hack.risk === 'medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {hack.risk.toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  const hackTools = [
    {
      id: 'unlimited-resources',
      name: 'Unlimited Resources',
      description: 'Get unlimited coins, gems, and other in-game resources',
      icon: Coins,
      risk: 'medium'
    },
    {
      id: 'speed-boost',
      name: 'Speed Boost',
      description: 'Increase game speed for faster gameplay',
      icon: Gauge,
      risk: 'low'
    },
    {
      id: 'auto-aim',
      name: 'Auto Aim',
      description: 'Automatically target enemies with enhanced precision',
      icon: Target,
      risk: 'high'
    },
    {
      id: 'god-mode',
      name: 'God Mode',
      description: 'Invincibility and unlimited health',
      icon: Shield,
      risk: 'high'
    },
    {
      id: 'esp-wallhack',
      name: 'ESP/Wallhack',
      description: 'See enemies and items through walls',
      icon: Eye,
      risk: 'high'
    },
    {
      id: 'auto-farm',
      name: 'Auto Farm',
      description: 'Automatically collect resources and rewards',
      icon: RotateCw,
      risk: 'medium'
    }
  ];

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Hacking Tools</h1>
        <p className="text-gray-400">Advanced game modification tools for Kingshot and other games</p>
      </div>

      {/* Process Selection */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Target Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Target Process
            </label>
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select a game process</option>
              {processes.map((process) => (
                <option key={process.pid} value={process.pid}>
                  {process.name} (PID: {process.pid})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchProcesses}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Refresh Processes</span>
            </button>
          </div>
        </div>
        
        {selectedProcess && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-green-400">
                Target selected: {processes.find(p => p.pid.toString() === selectedProcess)?.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hacking Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {hackTools.map((hack) => (
          <HackCard key={hack.id} hack={hack} />
        ))}
      </div>

      {/* Active Hacks Status */}
      {enabledHacks.size > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Active Hacks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(enabledHacks).map((hackId) => {
              const hack = hackTools.find(h => h.id === hackId);
              return (
                <div key={hackId} className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 font-medium">{hack?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kingshot Specific Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Kingshot Specific Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Tower Defense Hacks</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Unlimited tower upgrades</li>
              <li>• Instant building speed</li>
              <li>• Maximum damage multiplier</li>
              <li>• Unlimited build range</li>
            </ul>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Resource Hacks</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Unlimited coins and gems</li>
              <li>• Free premium purchases</li>
              <li>• Unlock all characters</li>
              <li>• Maximum level progression</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safety Warnings */}
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">High Risk Warning</p>
              <p className="text-red-300 text-sm">
                Some hacks may be detected by anti-cheat systems. Use at your own risk and consider using on offline/single-player modes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium">Usage Guidelines</p>
              <p className="text-yellow-300 text-sm">
                These tools are intended for educational purposes and personal use only. Respect game terms of service and fair play policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackingTools;