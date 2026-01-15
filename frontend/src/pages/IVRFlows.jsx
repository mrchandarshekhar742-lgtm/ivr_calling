import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit, Trash2, Copy, Phone, GitBranch } from 'lucide-react';
import api from '../utils/api';

const IVRFlows = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultLanguage: 'en',
    maxRetries: 3,
    timeout: 10
  });

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ivr-flows');
      setFlows(response.data.data || []);
    } catch (error) {
      console.error('Error fetching IVR flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ivr-flows', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        defaultLanguage: 'en',
        maxRetries: 3,
        timeout: 10
      });
      fetchFlows();
    } catch (error) {
      console.error('Error creating IVR flow:', error);
      alert('Failed to create IVR flow');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this IVR flow?')) return;
    
    try {
      await api.delete(`/ivr-flows/${id}`);
      fetchFlows();
    } catch (error) {
      console.error('Error deleting IVR flow:', error);
      alert('Failed to delete IVR flow');
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await api.put(`/ivr-flows/${flow.id}`, {
        isActive: !flow.isActive
      });
      fetchFlows();
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive IVR Flows</h1>
          <p className="text-gray-600 mt-1">
            Create interactive voice menus with button press detection
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create IVR Flow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Flows</p>
              <p className="text-2xl font-bold text-gray-900">{flows.length}</p>
            </div>
            <GitBranch className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Flows</p>
              <p className="text-2xl font-bold text-green-600">
                {flows.filter(f => f.isActive).length}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {flows.reduce((sum, f) => sum + (f.stats?.totalCalls || 0), 0)}
              </p>
            </div>
            <Phone className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(flows.reduce((sum, f) => sum + (f.stats?.averageDuration || 0), 0) / (flows.length || 1))}s
              </p>
            </div>
            <GitBranch className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* IVR Flows List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {flows.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IVR Flows Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first interactive IVR flow to handle button presses
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create First Flow
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nodes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{flow.name}</div>
                        <div className="text-sm text-gray-500">{flow.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {flow.nodes?.length || 0} nodes
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.defaultLanguage?.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(flow)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          flow.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {flow.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flow.stats?.totalCalls || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.location.href = `/ivr-flows/${flow.id}/builder`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Flow"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(flow.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Flow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New IVR Flow</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flow Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customer Support Menu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe the purpose of this IVR flow"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (sec)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.timeout}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IVRFlows;
