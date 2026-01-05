import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneIcon,
  MegaphoneIcon,
  UsersIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Dashboard = () => {
  const [realTimeStats] = useState({
    activeCalls: 0,
    completedToday: 0,
    successRate: 0,
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => api.get('/api/analytics/dashboard'),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const stats = dashboardData?.data?.data || {};

  const statCards = [
    {
      name: 'Total Campaigns',
      value: stats.totalCampaigns || 0,
      icon: MegaphoneIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Contacts',
      value: stats.totalContacts || 0,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Active Calls',
      value: realTimeStats.activeCalls,
      icon: PhoneIcon,
      color: 'bg-yellow-500',
      change: 'Live',
      changeType: 'neutral'
    },
    {
      name: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+2%',
      changeType: 'positive'
    },
  ];

  const recentCampaigns = stats.recentCampaigns || [];
  const recentCalls = stats.recentCalls || [];

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your IVR campaigns.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/campaigns/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <MegaphoneIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Create Campaign
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Start a new IVR campaign with your contacts.
                </p>
              </div>
            </Link>

            <Link
              to="/contacts"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <UsersIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Manage Contacts
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, or import your contact lists.
                </p>
              </div>
            </Link>

            <Link
              to="/audio"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <PhoneIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Upload Audio
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Upload audio files for your IVR campaigns.
                </p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-yellow-500 rounded-lg border border-gray-200 hover:border-yellow-300 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  View Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Analyze your campaign performance and metrics.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent campaigns */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
              <Link to="/campaigns" className="text-sm text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No campaigns yet. <Link to="/campaigns/new" className="text-blue-600 hover:text-blue-500">Create your first campaign</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        campaign.status === 'running' ? 'bg-green-400' :
                        campaign.status === 'paused' ? 'bg-yellow-400' :
                        campaign.status === 'completed' ? 'bg-blue-400' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500">{campaign.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{campaign.contactCount || 0} contacts</p>
                      <p className="text-xs text-gray-500">{campaign.completedCalls || 0} completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent calls */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Calls</h3>
          </div>
          <div className="card-body">
            {recentCalls.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent calls
              </p>
            ) : (
              <div className="space-y-3">
                {recentCalls.slice(0, 5).map((call, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        call.status === 'completed' ? 'bg-green-100' :
                        call.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {call.status === 'completed' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : call.status === 'failed' ? (
                          <XCircleIcon className="w-4 h-4 text-red-600" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{call.phone}</p>
                        <p className="text-xs text-gray-500">{call.campaignName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{call.duration || '0s'}</p>
                      <p className="text-xs text-gray-500">{call.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;