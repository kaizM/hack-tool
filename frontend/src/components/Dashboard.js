import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Monitor, 
  Zap, 
  Target, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    connectedProcesses: 0,
    activeSessions: 0,
    automationRunning: false,
    systemStatus: 'online'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch API status
      const statusResponse = await axios.get(`${API}/status`);
      const sessionsResponse = await axios.get(`${API}/sessions`);
      
      setStats({
        connectedProcesses: statusResponse.data.connected_processes,
        activeSessions: sessionsResponse.data.length,
        automationRunning: statusResponse.data.automation_active,
        systemStatus: statusResponse.data.status
      });

      // Mock recent activity
      setRecentActivity([
        { id: 1, action: 'Connected to Kingshot process', time: '2 minutes ago', type: 'success' },
        { id: 2, action: 'Memory scan completed', time: '5 minutes ago', type: 'info' },
        { id: 3, action: 'Automation script started', time: '10 minutes ago', type: 'warning' },
        { id: 4, action: 'Unlimited resources enabled', time: '15 minutes ago', type: 'success' },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('500', '500/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getTypeColor = (type) => {
      switch (type) {
        case 'success': return 'text-green-400';
        case 'warning': return 'text-yellow-400';
        case 'error': return 'text-red-400';
        default: return 'text-blue-400';
      }
    };

    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${getTypeColor(activity.type).replace('text-', 'bg-')}`} />
        <div className="flex-1">
          <p className="text-white text-sm">{activity.action}</p>
          <p className="text-gray-400 text-xs">{activity.time}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Monitor and control your game hacking operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Connected Processes"
          value={stats.connectedProcesses}
          icon={Monitor}
          color="text-blue-500"
          subtitle="Active game connections"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Users}
          color="text-green-500"
          subtitle="Hacking sessions running"
        />
        <StatCard
          title="Automation"
          value={stats.automationRunning ? 'Running' : 'Stopped'}
          icon={Zap}
          color={stats.automationRunning ? 'text-yellow-500' : 'text-gray-500'}
          subtitle="Auto-scripts status"
        />
        <StatCard
          title="System Status"
          value={stats.systemStatus.toUpperCase()}
          icon={Activity}
          color="text-green-500"
          subtitle="All systems operational"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Monitor className="w-5 h-5" />
                <span>Scan for Games</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Target className="w-5 h-5" />
                <span>Launch Hacks</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <Zap className="w-5 h-5" />
                <span>Start Automation</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-medium">Important Notice</p>
            <p className="text-yellow-300 text-sm">
              Use these tools responsibly and only on games you own. Respect terms of service and fair play policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;