import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Play, 
  Square, 
  Plus, 
  Edit3, 
  Trash2,
  Zap,
  Clock,
  MousePointer,
  Keyboard,
  RotateCw,
  Save,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AutomationPanel = () => {
  const [scripts, setScripts] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [scriptForm, setScriptForm] = useState({
    name: '',
    description: '',
    actions: []
  });

  useEffect(() => {
    fetchScripts();
    checkAutomationStatus();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await axios.get(`${API}/automation/scripts`);
      setScripts(response.data);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to fetch automation scripts');
    }
  };

  const checkAutomationStatus = async () => {
    try {
      const response = await axios.get(`${API}/status`);
      setIsRunning(response.data.automation_active);
    } catch (error) {
      console.error('Error checking automation status:', error);
    }
  };

  const startAutomation = async (script) => {
    try {
      await axios.post(`${API}/automation/start`, script);
      setIsRunning(true);
      toast.success(`Started automation: ${script.name}`);
    } catch (error) {
      console.error('Error starting automation:', error);
      toast.error('Failed to start automation');
    }
  };

  const stopAutomation = async () => {
    try {
      await axios.post(`${API}/automation/stop`);
      setIsRunning(false);
      toast.success('Automation stopped');
    } catch (error) {
      console.error('Error stopping automation:', error);
      toast.error('Failed to stop automation');
    }
  };

  const saveScript = async () => {
    if (!scriptForm.name || scriptForm.actions.length === 0) {
      toast.error('Please enter a script name and add at least one action');
      return;
    }

    try {
      const script = {
        ...scriptForm,
        id: editingScript?.id || Date.now().toString()
      };
      
      // In a real implementation, you'd save to the backend
      if (editingScript) {
        setScripts(prev => prev.map(s => s.id === editingScript.id ? script : s));
        toast.success('Script updated successfully');
      } else {
        setScripts(prev => [...prev, script]);
        toast.success('Script created successfully');
      }
      
      resetScriptForm();
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Failed to save script');
    }
  };

  const resetScriptForm = () => {
    setScriptForm({ name: '', description: '', actions: [] });
    setEditingScript(null);
    setShowScriptEditor(false);
  };

  const addAction = (type) => {
    const action = { type, id: Date.now() };
    
    switch (type) {
      case 'click':
        action.x = 100;
        action.y = 100;
        break;
      case 'key':
        action.key = 'space';
        break;
      case 'wait':
        action.duration = 1;
        break;
      case 'type':
        action.text = '';
        break;
      default:
        break;
    }
    
    setScriptForm(prev => ({
      ...prev,
      actions: [...prev.actions, action]
    }));
  };

  const updateAction = (actionId, field, value) => {
    setScriptForm(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, [field]: value } : action
      )
    }));
  };

  const removeAction = (actionId) => {
    setScriptForm(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  const ActionEditor = ({ action }) => {
    const getActionIcon = (type) => {
      switch (type) {
        case 'click': return MousePointer;
        case 'key': return Keyboard;
        case 'wait': return Clock;
        case 'type': return Edit3;
        default: return Zap;
      }
    };

    const Icon = getActionIcon(action.type);

    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white capitalize">{action.type}</span>
          </div>
          <button
            onClick={() => removeAction(action.id)}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {action.type === 'click' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">X Position</label>
                <input
                  type="number"
                  value={action.x}
                  onChange={(e) => updateAction(action.id, 'x', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Y Position</label>
                <input
                  type="number"
                  value={action.y}
                  onChange={(e) => updateAction(action.id, 'y', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </>
          )}

          {action.type === 'key' && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Key</label>
              <select
                value={action.key}
                onChange={(e) => updateAction(action.id, 'key', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value="space">Space</option>
                <option value="enter">Enter</option>
                <option value="tab">Tab</option>
                <option value="esc">Escape</option>
                <option value="f1">F1</option>
                <option value="f2">F2</option>
                <option value="w">W</option>
                <option value="a">A</option>
                <option value="s">S</option>
                <option value="d">D</option>
              </select>
            </div>
          )}

          {action.type === 'wait' && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={action.duration}
                onChange={(e) => updateAction(action.id, 'duration', parseFloat(e.target.value))}
                step="0.1"
                min="0.1"
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
            </div>
          )}

          {action.type === 'type' && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Text to Type</label>
              <input
                type="text"
                value={action.text}
                onChange={(e) => updateAction(action.id, 'text', e.target.value)}
                placeholder="Enter text to type"
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const ScriptCard = ({ script }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white mb-1">{script.name}</h3>
          <p className="text-sm text-gray-400">{script.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingScript(script);
              setScriptForm(script);
              setShowScriptEditor(true);
            }}
            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScripts(prev => prev.filter(s => s.id !== script.id));
              toast.success('Script deleted');
            }}
            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {script.actions.length} actions
        </div>
        <button
          onClick={() => startAutomation(script)}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Run</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Automation Panel</h1>
          <p className="text-gray-400">Create and manage automated gameplay scripts</p>
        </div>
        <div className="flex items-center space-x-4">
          {isRunning && (
            <button
              onClick={stopAutomation}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Square className="w-5 h-5" />
              <span>Stop Automation</span>
            </button>
          )}
          <button
            onClick={() => setShowScriptEditor(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Script</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              isRunning ? 'text-green-400' : 'text-gray-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
              }`} />
              <span className="font-medium">
                {isRunning ? 'Automation Running' : 'Automation Stopped'}
              </span>
            </div>
            <div className="text-gray-400">
              {scripts.length} scripts available
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RotateCw className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Auto-refresh: Off</span>
          </div>
        </div>
      </div>

      {/* Script Editor Modal */}
      {showScriptEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingScript ? 'Edit Script' : 'Create New Script'}
              </h2>
              <button
                onClick={resetScriptForm}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Script Details */}
              <div>
                <h3 className="font-semibold text-white mb-4">Script Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Script Name
                    </label>
                    <input
                      type="text"
                      value={scriptForm.name}
                      onChange={(e) => setScriptForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter script name"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Description
                    </label>
                    <textarea
                      value={scriptForm.description}
                      onChange={(e) => setScriptForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this script does"
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Add Actions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addAction('click')}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <MousePointer className="w-4 h-4" />
                        <span>Click</span>
                      </button>
                      <button
                        onClick={() => addAction('key')}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Keyboard className="w-4 h-4" />
                        <span>Key Press</span>
                      </button>
                      <button
                        onClick={() => addAction('wait')}
                        className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Wait</span>
                      </button>
                      <button
                        onClick={() => addAction('type')}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Type Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions List */}
              <div>
                <h3 className="font-semibold text-white mb-4">Actions ({scriptForm.actions.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scriptForm.actions.map((action, index) => (
                    <div key={action.id} className="relative">
                      <div className="absolute -left-3 top-2 bg-blue-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <ActionEditor action={action} />
                    </div>
                  ))}
                  
                  {scriptForm.actions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No actions added yet</p>
                      <p className="text-sm">Use the buttons above to add actions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={resetScriptForm}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveScript}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Script</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scripts Grid */}
      {scripts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map((script) => (
            <ScriptCard key={script.id} script={script} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Automation Scripts</h3>
          <p className="text-gray-400 mb-6">
            Create your first automation script to get started with automated gameplay.
          </p>
          <button
            onClick={() => setShowScriptEditor(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create Script
          </button>
        </div>
      )}

      {/* Safety Warning */}
      <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-medium">Automation Safety</p>
            <p className="text-yellow-300 text-sm">
              Automation scripts can perform actions continuously. Make sure to monitor their execution and stop them if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationPanel;