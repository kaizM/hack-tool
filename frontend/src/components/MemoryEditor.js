import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Edit3, 
  Save, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemoryEditor = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [dataType, setDataType] = useState('int');
  const [scanResults, setScanResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newValue, setNewValue] = useState('');

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

  const scanMemory = async () => {
    if (!selectedProcess || !searchValue) {
      toast.error('Please select a process and enter a search value');
      return;
    }

    try {
      setScanning(true);
      const response = await axios.post(`${API}/memory/scan`, {
        pid: parseInt(selectedProcess),
        value: dataType === 'int' ? parseInt(searchValue) : 
               dataType === 'float' ? parseFloat(searchValue) : searchValue,
        data_type: dataType
      });
      
      setScanResults(response.data.addresses);
      toast.success(`Found ${response.data.addresses.length} memory addresses`);
    } catch (error) {
      console.error('Error scanning memory:', error);
      toast.error('Memory scan failed');
    } finally {
      setScanning(false);
    }
  };

  const editMemory = async (address) => {
    if (!newValue) {
      toast.error('Please enter a new value');
      return;
    }

    try {
      const value = dataType === 'int' ? parseInt(newValue) : 
                    dataType === 'float' ? parseFloat(newValue) : newValue;
      
      await axios.post(`${API}/memory/edit`, {
        pid: parseInt(selectedProcess),
        address: address,
        new_value: value,
        data_type: dataType
      });

      // Update local state
      setScanResults(prev => prev.map(result => 
        result.address === address ? { ...result, value } : result
      ));

      setEditingAddress(null);
      setNewValue('');
      toast.success('Memory value updated successfully');
    } catch (error) {
      console.error('Error editing memory:', error);
      toast.error('Failed to edit memory');
    }
  };

  const AddressRow = ({ address }) => {
    const isEditing = editingAddress === address.address;
    
    return (
      <tr className="border-b border-gray-700 hover:bg-gray-800/50">
        <td className="px-6 py-4">
          <code className="text-green-400 font-mono text-sm bg-gray-800 px-2 py-1 rounded">
            {address.address}
          </code>
        </td>
        <td className="px-6 py-4">
          {isEditing ? (
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white w-full"
              placeholder="Enter new value"
            />
          ) : (
            <span className="text-white font-mono">{address.value}</span>
          )}
        </td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
            {address.data_type}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-400 text-sm">
          {address.description}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => editMemory(address.address)}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setNewValue('');
                  }}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  title="Cancel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingAddress(address.address);
                  setNewValue(address.value.toString());
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Memory Editor</h1>
        <p className="text-gray-400">Scan and modify game memory values in real-time</p>
      </div>

      {/* Search Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Memory Scanner</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Target Process
            </label>
            <select
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select a process</option>
              {processes.map((process) => (
                <option key={process.pid} value={process.pid}>
                  {process.name} (PID: {process.pid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Value
            </label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter value to search"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="int">Integer</option>
              <option value="float">Float</option>
              <option value="string">String</option>
              <option value="bytes">Bytes</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={scanMemory}
              disabled={scanning || !selectedProcess || !searchValue}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {scanning ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{scanning ? 'Scanning...' : 'Scan Memory'}</span>
            </button>
          </div>
        </div>

        {/* Scan Info */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2 text-blue-400">
            <Database className="w-4 h-4" />
            <span>Results: {scanResults.length}</span>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <Eye className="w-4 h-4" />
            <span>Process: {selectedProcess ? `PID ${selectedProcess}` : 'None'}</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {scanResults.length > 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Scan Results</h2>
            <p className="text-gray-400 text-sm">Found {scanResults.length} matching addresses</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scanResults.map((address) => (
                  <AddressRow key={address.address} address={address} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Scan Results</h3>
          <p className="text-gray-400 mb-6">
            Select a process and search for memory values to get started.
          </p>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-medium mb-2">Memory Editor Usage</h3>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>1. Select a connected game process from the dropdown</li>
              <li>2. Enter the value you want to find (e.g., current health, coins, etc.)</li>
              <li>3. Choose the appropriate data type for your search</li>
              <li>4. Click "Scan Memory" to find matching addresses</li>
              <li>5. Edit values by clicking the edit button next to each result</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryEditor;