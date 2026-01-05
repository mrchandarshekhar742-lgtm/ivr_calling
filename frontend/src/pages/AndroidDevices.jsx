import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { testApiBaseUrl, testDevicesEndpoint } from '../utils/testApi';

const AndroidDevices = () => {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    deviceName: '',
    androidVersion: ''
  });

  const queryClient = useQueryClient();

  // Debug: Test API configuration
  useEffect(() => {
    console.log('=== API DEBUG INFO ===');
    testApiBaseUrl();
  }, []);

  // Fetch devices
  const { data: devicesData, isLoading, error } = useQuery(
    'devices',
    () => api.get('/devices'),
    { retry: 1 }
  );

  // Register device mutation
  const registerDeviceMutation = useMutation(
    (deviceData) => api.post('/devices/register', deviceData),
    {
      onSuccess: () => {
        toast.success('Device registered successfully!');
        queryClient.invalidateQueries('devices');
        setShowAddDevice(false);
        setDeviceForm({ deviceId: '', deviceName: '', androidVersion: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to register device');
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

  const devices = devicesData?.data?.devices || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <button
          onClick={() => setShowAddDevice(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3"
        >
          Add Device
        </button>
        <button
          onClick={() => testDevicesEndpoint()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Test API
        </button>
      </div>

      {/* Connection Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📱 How to Connect Your Android Device:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Install the IVR Call Manager app on your Android device</li>
          <li>Open the app and go to Settings</li>
          <li>Enter Server URL: <code className="bg-blue-100 px-1 rounded">https://ivr.wxon.in</code></li>
          <li>Click "Register Device" and copy the Device ID</li>
          <li>Add the device here using the Device ID</li>
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
                  placeholder="Enter device ID from app"
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
                    Android Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        device.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.status === 'active' ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.androidVersion || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(device.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Test Connection
                      </button>
                      <button className="text-red-600 hover:text-red-900">
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