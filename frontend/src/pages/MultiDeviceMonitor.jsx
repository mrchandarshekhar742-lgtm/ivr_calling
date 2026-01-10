import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';

const MultiDeviceMonitor = () => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns?status=running'),
    refetchInterval: autoRefresh ? 5000 : false
  });

  // Fetch live calls
  const { data: liveCallsData } = useQuery({
    queryKey: ['live-calls', selectedCampaign],
    queryFn: () => api.get(`/campaigns/live-calls${selectedCampaign ? `?campaignId=${selectedCampaign}` : ''}`),
    refetchInterval: autoRefresh ? 3000 : false
  });

  // Fetch device performance
  const { data: devicePerformanceData } = useQuery({
    queryKey: ['device-performance'],
    queryFn: () => api.get('/campaigns/device-performance'),
    refetchInterval: autoRefresh ? 10000 : false
  });

  // Fetch campaign status if selected
  const { data: campaignStatusData } = useQuery({
    queryKey: ['campaign-status', selectedCampaign],
    queryFn: () => selectedCampaign ? api.get(`/campaigns/${selectedCampaign}/status`) : null,
    enabled: !!selectedCampaign,
    refetchInterval: autoRefresh ? 5000 : false
  });

  const campaigns = campaignsData?.data?.campaigns || [];
  const liveCalls = liveCallsData?.data || {};
  const devicePerformance = devicePerformanceData?.data || {};
  const campaignStatus = campaignStatusData?.data || {};

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Multi-Device Call Monitor</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto Refresh
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* Campaign Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Campaign to Monitor
        </label>
        <select
          value={selectedCampaign || ''}
          onChange={(e) => setSelectedCampaign(e.target.value || null)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Campaigns</option>
          {campaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} ({campaign.status})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Calls</h3>
          <p className="text-3xl font-bold text-blue-600">{liveCalls.summary?.activeCalls || 0}</p>
          <p className="text-sm text-gray-600">Currently in progress</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Devices</h3>
          <p className="text-3xl font-bold text-green-600">{devicePerformance.summary?.onlineDevices || 0}</p>
          <p className="text-sm text-gray-600">Ready for calls</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{devicePerformance.summary?.avgSuccessRate || 0}%</p>
          <p className="text-sm text-gray-600">Average across devices</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Calls</h3>
          <p className="text-3xl font-bold text-orange-600">{devicePerformance.summary?.totalPendingCommands || 0}</p>
          <p className="text-sm text-gray-600">Queued for execution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Calls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Live Calls</h2>
          </div>
          <div className="p-6">
            {liveCalls.liveCalls?.length > 0 ? (
              <div className="space-y-4">
                {liveCalls.liveCalls.map(call => (
                  <div key={call.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{call.phoneNumber}</p>
                      <p className="text-sm text-gray-600">{call.deviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{formatDuration(call.duration)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active calls</p>
            )}
          </div>
        </div>

        {/* Device Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Device Performance</h2>
          </div>
          <div className="p-6">
            {devicePerformance.devices?.length > 0 ? (
              <div className="space-y-4">
                {devicePerformance.devices.map(device => (
                  <div key={device.deviceId} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{device.deviceName}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-medium">{device.performance.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Calls/Hour</p>
                        <p className="font-medium">{device.performance.callsPerHour}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pending</p>
                        <p className="font-medium">{device.pendingCommands}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No devices found</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Completed Calls */}
      {liveCalls.recentCompleted?.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Completed Calls</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DTMF Response
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {liveCalls.recentCompleted.map(call => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {call.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.deviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.dtmfResponse || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(call.completedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Status Details */}
      {selectedCampaign && campaignStatus.campaign && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Campaign: {campaignStatus.campaign.name}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{campaignStatus.stats?.totalCalls || 0}</p>
                <p className="text-sm text-gray-600">Total Calls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{campaignStatus.stats?.answered || 0}</p>
                <p className="text-sm text-gray-600">Answered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{campaignStatus.stats?.dtmfResponses || 0}</p>
                <p className="text-sm text-gray-600">DTMF Responses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{campaignStatus.stats?.inProgress || 0}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>

            {campaignStatus.deviceBreakdown?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaignStatus.deviceBreakdown.map(device => (
                    <div key={device.deviceId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{device.deviceName}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{device.totalCalls}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Answered:</span>
                          <span className="font-medium text-green-600">{device.answered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DTMF:</span>
                          <span className="font-medium text-purple-600">{device.dtmfResponses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Duration:</span>
                          <span className="font-medium">{formatDuration(device.avgDuration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiDeviceMonitor;