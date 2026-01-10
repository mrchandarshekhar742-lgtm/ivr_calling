import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';

const AndroidDevices = () => {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      console.log('🔍 Fetching devices...');
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      try {
        const response = await api.get('/api/devices');
        console.log('✅ Devices API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Devices API error:', error);
        console.error('❌ Error response:', error.response?.data);
        throw error;
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  // Fetch device stats
  const { data: statsData } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      console.log('📊 Fetching device stats...');
      try {
        const response = await api.get('/api/devices/stats/summary');
        console.log('✅ Stats API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Stats API error:', error);
        throw error;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  const devices = devicesData?.data?.devices || [];
  const stats = statsData?.data || {};

  // Debug information
  const debugInfo = {
    isLoading,
    error: error?.message,
    errorStatus: error?.response?.status,
    devicesDataExists: !!devicesData,
    devicesCount: devices.length,
    token: !!localStorage.getItem('token'),
    apiBaseURL: api.defaults.baseURL
  };

  console.log('🐛 Debug Info:', debugInfo);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load devices</h3>
        <p className="text-gray-600 mb-4">There was an error loading your Android devices.</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Try Again
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
        <button
          onClick={() => {
            refetch();
            // Also invalidate CreateCampaign devices query
            queryClient.invalidateQueries(['devices']);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Debug Panel - Temporary for troubleshooting */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-yellow-700">
          <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Token: {debugInfo.token ? 'Present' : 'Missing'}</div>
          <div>Error: {debugInfo.error || 'None'}</div>
          <div>Status: {debugInfo.errorStatus || 'OK'}</div>
          <div>Data: {debugInfo.devicesDataExists ? 'Present' : 'Missing'}</div>
          <div>Count: {debugInfo.devicesCount}</div>
        </div>
        <div className="mt-2 text-xs text-yellow-600">
          API: {debugInfo.apiBaseURL}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devices</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDevices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Online</p>
              <p className="text-2xl font-semibold text-green-600">{stats.onlineDevices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Busy</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.busyDevices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Offline</p>
              <p className="text-2xl font-semibold text-red-600">{stats.offlineDevices || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Connected Devices</h2>
        </div>
        
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No devices connected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Install the IVR Manager app on your Android device and connect to get started.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/ivr-manager-latest.apk';
                  link.download = 'ivr-manager-latest.apk';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('APK download started');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download APK
              </button>
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
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
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
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{device.deviceName}</div>
                          <div className="text-sm text-gray-500">{device.deviceId}</div>
                          <div className="text-xs text-gray-400">
                            {device.deviceModel} • Android {device.androidVersion}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastSeen(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <div>Calls: {device.stats?.totalCalls || 0}</div>
                        <div>Success: {device.stats?.successfulCalls || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={async () => {
                          try {
                            console.log(`Testing device: ${device.deviceId}`);
                            const response = await api.post(`/api/devices/${device.deviceId}/test`);
                            console.log('Test response:', response.data);
                            toast.success(`Test signal sent to ${device.deviceName}`);
                          } catch (error) {
                            console.error('Test error:', error);
                            const errorMessage = error.response?.data?.message || error.message || 'Test failed';
                            toast.error(`Test failed: ${errorMessage}`);
                          }
                        }}
                      >
                        Test
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to remove this device?')) {
                            try {
                              await api.delete(`/api/devices/${device.deviceId}`);
                              toast.success('Device removed');
                              refetch();
                            } catch (error) {
                              console.error('Remove error:', error);
                              toast.error(`Failed to remove device: ${error.response?.data?.message || error.message}`);
                            }
                          }
                        }}
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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How to connect your Android device</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Download and install the IVR Manager APK on your Android device</li>
                <li>Open the app and login with your account credentials</li>
                <li>Tap "Connect to Server" to register your device</li>
                <li>Your device will appear in this list as "Online" when connected</li>
                <li>You can now use this device for IVR calling campaigns</li>
              </ol>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/ivr-manager-latest.apk';
                  link.download = 'ivr-manager-latest.apk';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('APK download started');
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download IVR Manager APK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AndroidDevices;