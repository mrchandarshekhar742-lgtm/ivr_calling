import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  SpeakerWaveIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const LiveCallMonitor = () => {
  // Temporarily disable live monitoring due to backend route issues
  // const [selectedCampaign, setSelectedCampaign] = useState('');
  // const [campaigns, setCampaigns] = useState([]);

  // Fetch campaigns for filter
  // useEffect(() => {
  //   const fetchCampaigns = async () => {
  //     try {
  //       const response = await api.get('/api/campaigns');
  //       setCampaigns(response.data.data?.campaigns || []);
  //     } catch (error) {
  //       console.error('Failed to fetch campaigns:', error);
  //     }
  //   };
  //   fetchCampaigns();
  // }, []);

  // Fetch live call data with real-time updates
  // const { data: liveData, isLoading } = useQuery(
  //   ['liveCalls', selectedCampaign],
  //   () => {
  //     const params = selectedCampaign ? { campaignId: selectedCampaign } : {};
  //     return api.get('/api/campaigns/live-calls', { params });
  //   },
  //   {
  //     refetchInterval: false, // Disable auto-refresh temporarily until route is fixed
  //     keepPreviousData: true,
  //     retry: false, // Don't retry on 404 errors
  //     enabled: false // Disable the query until route is working
  //   }
  // );

  // const liveCalls = liveData?.data?.data?.liveCalls || [];
  // const recentCompleted = liveData?.data?.data?.recentCompleted || [];
  // const summary = liveData?.data?.data?.summary || {};

  // const formatDuration = (seconds) => {
  //   if (!seconds) return '0s';
  //   const minutes = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  // };

  // const formatTime = (dateString) => {
  //   return new Date(dateString).toLocaleTimeString();
  // };

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case 'in_progress': return 'text-blue-600 bg-blue-100';
  //     case 'completed': return 'text-green-600 bg-green-100';
  //     case 'answered': return 'text-green-600 bg-green-100';
  //     case 'failed': return 'text-red-600 bg-red-100';
  //     case 'no_answer': return 'text-yellow-600 bg-yellow-100';
  //     default: return 'text-gray-600 bg-gray-100';
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Call Monitor</h1>
          <p className="text-gray-600">Real-time tracking of active calls and DTMF responses</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-yellow-600">
            <SignalIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Under Maintenance</span>
          </div>
        </div>
      </div>

      {/* Temporary Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Live Monitor Temporarily Unavailable
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                The live call monitoring feature is currently being updated. Please use the Call Logs page 
                to view completed calls and DTMF responses. This feature will be available shortly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect to Call Logs */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <PhoneIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">View Call Activity</h3>
        <p className="text-gray-600 mb-4">
          You can still track all your call activities, DTMF responses, and campaign performance 
          in the Call Logs section.
        </p>
        <a
          href="/call-logs"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go to Call Logs
        </a>
      </div>
    </div>
  );
};

export default LiveCallMonitor;