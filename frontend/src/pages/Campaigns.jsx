import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/campaigns');
      setCampaigns(response.data.data?.campaigns || []);
    } catch (err) {
      setError('Failed to fetch campaigns');
      console.error('Fetch campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId, action) => {
    try {
      await api.post(`/api/campaigns/${campaignId}/${action}`);
      fetchCampaigns(); // Refresh the list
    } catch (err) {
      setError(`Failed to ${action} campaign`);
      console.error(`${action} campaign error:`, err);
    }
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await api.delete(`/api/campaigns/${campaignId}`);
        fetchCampaigns(); // Refresh the list
      } catch (err) {
        setError('Failed to delete campaign');
        console.error('Delete campaign error:', err);
      }
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage your IVR campaigns</p>
        </div>
        <Link
          to="/campaigns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        {['all', 'draft', 'active', 'paused', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📞</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't created any campaigns yet."
                : `No campaigns with status "${filter}".`
              }
            </p>
            <Link
              to="/campaigns/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <Link 
                            to={`/campaigns/${campaign.id}`}
                            className="hover:text-blue-600"
                          >
                            {campaign.name}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {campaign.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.stats?.totalContacts || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'start')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Start
                        </button>
                      )}
                      
                      {campaign.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'pause')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'stop')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Stop
                          </button>
                        </>
                      )}
                      
                      {campaign.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'resume')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Resume
                        </button>
                      )}
                      
                      {['draft', 'completed'].includes(campaign.status) && (
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;