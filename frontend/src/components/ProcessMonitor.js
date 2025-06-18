import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Monitor, 
  Play, 
  Square, 
  RefreshCw, 
  Cpu, 
  HardDrive,
  Activity,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProcessMonitor = () => {
  const [processes, setProcesses] = useState([]);
  const [connectedProcesses, setConnectedProcesses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setScanning(true);
      const response = await axios.get(`${API}/processes`);
      setProcesses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Failed to fetch game processes');
      setLoading(false);
    } finally {
      setScanning(false);
    }
  };

  const connectToProcess = async (pid) => {
    try {
      await axios.post(`${API}/processes/${pid}/connect`);
      setConnectedProcesses(prev => new Set(prev).add(pid));
      toast.success(`Connected to process ${pid}`);
    } catch (error) {
      console.error('Error connecting to process:', error);
      toast.error(`Failed to connect to process ${pid}`);
    }
  };

  const formatMemory = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ProcessCard = ({ process }) => {
    const isConnected = connectedProcesses.has(process.pid);
    
    return (
      <div className={`bg-gray-800 border rounded-xl p-6 hover:border-gray-600 transition-all ${
        isConnected ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isConnected ? 'bg-green-500/20' : 'bg-gray-700'
            }`}>
              <Monitor className={`w-5 h-5 ${
                isConnected ? 'text-green-400' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{process.name}</h3>
              <p className="text-sm text-gray-400">PID: {process.pid}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {isConnected ? 'Connected' : 'Detected'}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Executable Path:</span>
            <span className="text-gray-300 truncate ml-2" title={process.exe_path}>
              {process.exe_path}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status:</span>
            <span className="text-gray-300">{process.status}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {!isConnected ? (
            <button
              onClick={() => connectToProcess(process.pid)}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Connect</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              <Activity className="w-4 h-4" />
              <span>Connected</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Process Monitor</h1>
          <p className="text-gray-400">Detect and connect to running game processes</p>
        </div>
        <button
          onClick={fetchProcesses}
          disabled={scanning}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Scan for Games'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{processes.length}</p>
              <p className="text-sm text-gray-400">Games Detected</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{connectedProcesses.size}</p>
              <p className="text-sm text-gray-400">Connected</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Cpu className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {processes.filter(p => p.name.toLowerCase().includes('kingshot')).length}
              </p>
              <p className="text-sm text-gray-400">Kingshot Instances</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <HardDrive className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {processes.filter(p => p.status === 'detected').length}
              </p>
              <p className="text-sm text-gray-400">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Grid */}
      {processes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processes.map((process) => (
            <ProcessCard key={process.pid} process={process} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Game Processes Found</h3>
          <p className="text-gray-400 mb-6">
            Launch a game and click "Scan for Games" to detect running processes.
          </p>
          <button
            onClick={fetchProcesses}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Scan for Games
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessMonitor;