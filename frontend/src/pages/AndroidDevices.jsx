import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';

const AndroidDevices = () => {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    deviceName: '',
    androidVersion: '',
    deviceModel: '',
    appVersion: ''
  });

  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devicesData, isLoading, error, refetch } = useQuery(
    ['devices'],
    () => api.get('/api/devices'),
    { 
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error) => {
        console.error('Error fetching devices:', error);
        toast.error('Failed to load devices');
      }
    }
  );

  // Register device mutation
  const registerDeviceMutation = useMutation(
    (deviceData) => api.post('/api/devices/register', deviceData),
    {
      onSuccess: (response) => {
        toast.success('Device registered successfully!');
        queryClient.invalidateQueries('devices');
        setShowAddDevice(false);
        setDeviceForm({ deviceId: '', deviceName: '', androidVersion: '', deviceModel: '', appVersion: '' });
        
        // Show token modal with device info
        setSelectedDevice(response.data.data);
        setShowTokenModal(true);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to register device');
      }
    }
  );

  // Remove device mutation
  const removeDeviceMutation = useMutation(
    (deviceId) => api.delete(`/api/devices/${deviceId}`),
    {
      onSuccess: () => {
        toast.success('Device removed successfully!');
        queryClient.invalidateQueries('devices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove device');
      }
    }
  );

  // Test device mutation
  const testDeviceMutation = useMutation(
    (deviceId) => api.post(`/api/devices/${deviceId}/test`),
    {
      onSuccess: (response) => {
        toast.success(response.data.message || 'Device test successful!');
        queryClient.invalidateQueries('devices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Device test failed');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deviceForm.deviceId || !deviceForm.deviceName) {
      toast.error('Device ID and Name are required');
      return;
    }
    registerDeviceMutation.mutate(deviceForm);
  };

  const handleRemoveDevice = (deviceId, deviceName) => {
    if (window.confirm(`Are you sure you want to remove "${deviceName}"?`)) {
      removeDeviceMutation.mutate(deviceId);
    }
  };

  const handleTestDevice = (deviceId) => {
    testDeviceMutation.mutate(deviceId);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const devices = devicesData?.data?.devices || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-500 text-xl mb-4">❌ Error loading devices</div>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Android Devices</h1>
          <p className="text-gray-600">Manage your connected Android devices for IVR calling</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => refetch()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowAddDevice(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Device
          </button>
        </div>
      </div>

      {/* Connection Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📱 How to Connect Your Android Device:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Install the IVR Call Manager app on your Android device</li>
          <li>Open the app and go to Settings</li>
          <li>Enter Server URL: <code className="bg-blue-100 px-1 rounded">https://ivr.wxon.in</code></li>
          <li>Register the device here to get your device token</li>
          <li>Enter the token in the app to connect</li>
        </ol>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Android Device</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device ID *
                </label>
                <input
                  type="text"
                  value={deviceForm.deviceId}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter unique device ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={deviceForm.deviceName}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Samsung Galaxy S21"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Model
                </label>
                <input
                  type="text"
                  value={deviceForm.deviceModel}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceModel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SM-G991B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Android Version
                </label>
                <input
                  type="text"
                  value={deviceForm.androidVersion}
                  onChange={(e) => setDeviceForm({ ...deviceForm, androidVersion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Android 12"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={registerDeviceMutation.isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {registerDeviceMutation.isLoading ? 'Adding...' : 'Add Device'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDevice(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">🎉 Device Registered Successfully!</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Token (Copy this to your Android app):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedDevice.token}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedDevice.token)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">📋 Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-green-800 text-sm">
                  <li>Copy the token above</li>
                  <li>Open IVR Call Manager app on your Android device</li>
                  <li>Go to Settings → Server Configuration</li>
                  <li>Paste the token in the "Device Token" field</li>
                  <li>Click "Connect to Server"</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Device Information:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {selectedDevice.deviceName}</p>
                  <p><strong>ID:</strong> {selectedDevice.deviceId}</p>
                  <p><strong>Server URL:</strong> {selectedDevice.instructions?.serverUrl}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowTokenModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices List */}
      <div className="bg-white rounded-lg shadow">
        {devices.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices connected</h3>
            <p className="text-gray-600 mb-4">
              Connect your Android device to start making IVR calls
            </p>
            <button
              onClick={() => setShowAddDevice(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Device
            </button>
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
                    Token
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
                  <tr key={device.deviceId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.deviceName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {device.deviceId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {device.deviceModel} • {device.androidVersion}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        device.status === 'online'
                          ? 'bg-green-100 text-green-800' 
                          : device.status === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.status === 'online' ? '🟢 Online' : 
                         device.status === 'busy' ? '🟡 Busy' : 
                         device.status === 'active' ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {device.tokenPreview || 'No token'}
                        </code>
                        {device.tokenPreview && (
                          <button
                            onClick={() => {
                              setSelectedDevice(device);
                              setShowTokenModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View Full
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleTestDevice(device.deviceId)}
                        disabled={testDeviceMutation.isLoading}
                        className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                      >
                        Test
                      </button>
                      <button 
                        onClick={() => handleRemoveDevice(device.deviceId, device.deviceName)}
                        disabled={removeDeviceMutation.isLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* App Download Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📲 Download IVR Call Manager App</h3>
        <p className="text-gray-600 mb-4">
          Install the companion Android app to enable IVR calling functionality on your device.
        </p>
        <div className="flex space-x-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            📱 Download APK
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            📋 Installation Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidDevices;