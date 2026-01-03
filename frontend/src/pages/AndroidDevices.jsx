import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const AndroidDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
    
    // Set up polling for device status
    const interval = setInterval(fetchDevices, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/devices');
      setDevices(response.data.devices || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Fetch devices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCampaign = async (deviceId, campaignId) => {
    try {
      await api.post(`/devices/${deviceId}/assign-campaign`, { campaignId });
      fetchDevices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign campaign');
      console.error('Assign campaign error:', err);
    }
  };

  const handleUnregisterDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to unregister this device?')) {
      try {
        await api.delete(`/devices/${deviceId}`);
        fetchDevices();
      } catch (err) {
        setError('Failed to unregister device');
        console.error('Unregister device error:', err);
      }
    }
  };

  const getStatusColor = (status, isOnline) => {
    if (!isOnline) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'idle': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSeen = (lastSeen) => {
    const now = Date.now();
    const diff = now - lastSeen;
    
    if (diff < 30000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(lastSeen).toLocaleDateString();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Android Devices</h1>
          <p className="text-gray-600">Manage connected Android devices for IVR calls</p>
        </div>
        <div className="text-sm text-gray-500">
          Auto-refresh every 10 seconds
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📱</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devices</p>
              <p className="text-2xl font-semibold text-gray-900">{devices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Online</p>
              <p className="text-2xl font-semibold text-gray-900">
                {devices.filter(d => d.isOnline).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Busy</p>
              <p className="text-2xl font-semibold text-gray-900">
                {devices.filter(d => d.status === 'busy').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">📞</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {devices.reduce((sum, d) => sum + (d.callsHandled || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices connected</h3>
            <p className="text-gray-600 mb-4">
              Install and run the IVR Call Manager app on your Android devices to get started
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 text-left space-y-1">
                <li>1. Install the IVR Call Manager app</li>
                <li>2. Open the app and login with your credentials</li>
                <li>3. Grant necessary permissions (Phone, Microphone)</li>
                <li>4. The device will appear here automatically</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls Handled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{device.name}</div>
                        <div className="text-sm text-gray-500">
                          {device.model} • Android {device.androidVersion}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {device.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status, device.isOnline)}`}>
                        {device.isOnline ? device.status : 'offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.currentCampaign ? (
                        <span className="text-blue-600">Campaign #{device.currentCampaign}</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.callsHandled || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastSeen(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {device.isOnline && device.status !== 'busy' && (
                        <button
                          onClick={() => {
                            const campaignId = prompt('Enter Campaign ID to assign:');
                            if (campaignId) {
                              handleAssignCampaign(device.id, parseInt(campaignId));
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Assign Campaign
                        </button>
                      )}
                      
                      <button className="text-green-600 hover:text-green-900">
                        View Logs
                      </button>
                      
                      <button
                        onClick={() => handleUnregisterDevice(device.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Unregister
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Device Management Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">📱 Device Setup</h4>
            <ul className="space-y-1">
              <li>• Ensure stable internet connection</li>
              <li>• Grant all required permissions</li>
              <li>• Keep the app running in foreground</li>
              <li>• Disable battery optimization for the app</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚡ Performance Tips</h4>
            <ul className="space-y-1">
              <li>• Use devices with good call quality</li>
              <li>• Monitor device battery levels</li>
              <li>• Restart devices if they become unresponsive</li>
              <li>• Update the app regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AndroidDevices;