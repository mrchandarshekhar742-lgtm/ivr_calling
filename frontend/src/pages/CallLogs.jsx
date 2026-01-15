import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const CallLogs = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    campaignId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [campaigns, setCampaigns] = useState([]);

  // Fetch campaigns for filter dropdown
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get('/api/campaigns');
        setCampaigns(response.data.data?.campaigns || []);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
        setCampaigns([]); // Ensure campaigns is always an array
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch call logs
  const { data: callLogsData, isLoading, refetch } = useQuery(
    ['callLogs', page, filters],
    () => {
      // Filter out empty string parameters
      const cleanParams = {
        page,
        limit: 20,
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.campaignId && { campaignId: filters.campaignId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search })
      };
      
      return api.get('/api/call-logs', { params: cleanParams });
    },
    {
      keepPreviousData: true,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  const callLogs = callLogsData?.data?.data || [];
  const pagination = callLogsData?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const exportCallLogs = async () => {
    try {
      // Filter out empty string parameters for export
      const cleanParams = {
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.campaignId && { campaignId: filters.campaignId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search })
      };
      
      const response = await api.get('/api/call-logs/export/csv', {
        params: cleanParams,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `call-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Call logs exported successfully');
    } catch (error) {
      toast.error('Failed to export call logs');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'no-answer':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'busy':
        return <PhoneIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      'no-answer': 'bg-yellow-100 text-yellow-800',
      busy: 'bg-orange-100 text-orange-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || badges.pending;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading && !callLogs.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600">Track and analyze all your call activities</p>
        </div>
        <button
          onClick={exportCallLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search phone numbers..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="no-answer">No Answer</option>
            <option value="busy">Busy</option>
          </select>

          {/* Campaign Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.campaignId}
            onChange={(e) => handleFilterChange('campaignId', e.target.value)}
          >
            <option value="">All Campaigns</option>
            {Array.isArray(campaigns) && campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />

          {/* End Date */}
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* Enhanced Call Logs Table with DTMF and Audio Tracking */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {callLogs.length === 0 ? (
          <div className="text-center py-12">
            <PhoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
            <p className="text-gray-600">Call logs will appear here once you start campaigns</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {callLogs.filter(log => log.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed Calls</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {callLogs.filter(log => log.dtmfResponse && log.dtmfResponse !== 'No Response').length}
                  </div>
                  <div className="text-sm text-gray-600">DTMF Responses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {callLogs.filter(log => log.audioDelivered === true).length}
                  </div>
                  <div className="text-sm text-gray-600">Audio Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(callLogs.filter(log => log.dtmfResponse && log.dtmfResponse !== 'No Response').length / Math.max(callLogs.length, 1) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Response Rate</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DTMF Response
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Called At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {callLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.contact?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{log.phoneNumber}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(log.status)}`}>
                              {log.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.campaign?.name || 'Unknown Campaign'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.campaign?.type || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDuration(log.duration)}</span>
                          {log.answered && (
                            <span className="text-xs text-green-600">✓ Answered</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.dtmfResponse && log.dtmfResponse !== 'No Response' ? (
                          <div className="flex flex-col">
                            <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-800 border-2 border-blue-300">
                              Key: {log.dtmfResponse}
                            </span>
                            <span className="text-xs text-green-600 mt-1">✓ Response Recorded</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">No Response</span>
                            <span className="text-xs text-gray-400">No button pressed</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.audioDelivered ? (
                          <div className="flex flex-col">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ Delivered
                            </span>
                            <span className="text-xs text-gray-500">Audio played to target</span>
                          </div>
                        ) : log.campaign?.audioFileId ? (
                          <div className="flex flex-col">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              ⚠ Failed
                            </span>
                            <span className="text-xs text-gray-500">Audio not delivered</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">No Audio</span>
                            <span className="text-xs text-gray-400">Campaign has no audio</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{formatDate(log.calledAt)}</span>
                          {log.notes && (
                            <span className="text-xs text-gray-500 mt-1">{log.notes}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.deviceId || 'N/A'}</span>
                          {log.device?.deviceName && (
                            <span className="text-xs text-gray-400">{log.device.deviceName}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * 20, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                        disabled={page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallLogs;