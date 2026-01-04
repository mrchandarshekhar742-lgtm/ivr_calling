import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  const getStartDate = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }, [timeRange]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, campaignResponse, callResponse] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/analytics/campaigns'),
        api.get('/api/analytics/calls', {
          params: {
            groupBy: timeRange === '24h' ? 'hour' : 'day',
            startDate: getStartDate()
          }
        })
      ]);

      setAnalytics({
        dashboard: dashboardResponse.data.data || {},
        campaigns: campaignResponse.data.data || [],
        calls: callResponse.data.data || {}
      });
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, getStartDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);



  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { dashboard, campaigns, calls } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Campaign and call performance insights</p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {dashboard && dashboard.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.overview?.totalCampaigns || 0}</p>
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
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.overview?.successRate || 0}%</p>
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
                <p className="text-2xl font-semibold text-gray-900">{dashboard.overview?.totalCallLogs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboard.overview?.totalContacts || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Statistics Chart */}
      {calls && calls.callStats && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Call Statistics</h3>
          <div className="space-y-4">
            {Array.isArray(calls.callStats) && calls.callStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{stat.period}</p>
                  <p className="text-xs text-gray-500">
                    {stat.totalCalls} total calls • Avg: {formatDuration(stat.avgDuration)}
                  </p>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600">✓ {stat.completedCalls}</span>
                  <span className="text-red-600">✗ {stat.failedCalls}</span>
                  <span className="text-yellow-600">⏳ {stat.noAnswerCalls}</span>
                  <span className="text-gray-600">📞 {stat.busyCalls}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Performance */}
      {campaigns && campaigns.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(campaigns) && campaigns.slice(0, 10).map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.totalCalls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        parseFloat(campaign.successRate) >= 80 ? 'text-green-600' :
                        parseFloat(campaign.successRate) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {campaign.successRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(campaign.avgDuration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DTMF Response Analysis */}
      {calls && calls.dtmfStats && calls.dtmfStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">DTMF Response Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {calls.dtmfStats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stat.response}</div>
                <div className="text-sm text-gray-600">{stat.count} responses</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Performance */}
      {calls && calls.deviceStats && calls.deviceStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Performance</h3>
          <div className="space-y-3">
            {calls.deviceStats.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Device {device.deviceId}</p>
                  <p className="text-xs text-gray-500">{device.totalCalls} calls handled</p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">
                    Success: {device.successRate}%
                  </span>
                  <span className="text-blue-600">
                    Avg: {formatDuration(device.avgDuration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;