import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'broadcast',
    audioFileId: '',
    settings: {
      maxRetries: 3,
      retryDelay: 300,
      callTimeout: 30,
      dtmfTimeout: 10
    }
  });

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      const response = await api.get('/api/audio');
      console.log('Audio files response:', response.data);
      
      // Handle different response structures
      const audioFiles = response.data.data?.audioFiles || response.data.audioFiles || response.data || [];
      setAudioFiles(audioFiles);
      
      if (audioFiles.length === 0) {
        console.warn('No audio files found. Please upload some audio files first.');
      }
    } catch (err) {
      console.error('Fetch audio files error:', err);
      setAudioFiles([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/campaigns', formData);
      console.log('Campaign created:', response.data);
      
      // Handle different response structures
      const campaignData = response.data.data || response.data;
      const campaignId = campaignData?.id;
      
      if (campaignId) {
        navigate(`/campaigns/${campaignId}`);
      } else {
        // If no ID, just go to campaigns list
        navigate('/campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign');
      console.error('Create campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-gray-600">Set up a new IVR campaign</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter campaign name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter campaign description"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="broadcast">Broadcast</option>
              <option value="survey">Survey</option>
              <option value="notification">Notification</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>

          <div>
            <label htmlFor="audioFileId" className="block text-sm font-medium text-gray-700 mb-1">
              Audio File *
            </label>
            <select
              id="audioFileId"
              name="audioFileId"
              value={formData.audioFileId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an audio file</option>
              {audioFiles.map(file => (
                <option key={file.id} value={file.id}>
                  {file.name} ({file.duration ? `${file.duration}s` : 'Unknown duration'})
                </option>
              ))}
            </select>
            {audioFiles.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No audio files available. Please upload an audio file first.
              </p>
            )}
          </div>
        </div>

        {/* Campaign Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Campaign Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                id="maxRetries"
                name="maxRetries"
                value={formData.settings.maxRetries}
                onChange={handleSettingsChange}
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Number of retry attempts for failed calls</p>
            </div>

            <div>
              <label htmlFor="retryDelay" className="block text-sm font-medium text-gray-700 mb-1">
                Retry Delay (seconds)
              </label>
              <input
                type="number"
                id="retryDelay"
                name="retryDelay"
                value={formData.settings.retryDelay}
                onChange={handleSettingsChange}
                min="60"
                max="3600"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Delay between retry attempts</p>
            </div>

            <div>
              <label htmlFor="callTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                Call Timeout (seconds)
              </label>
              <input
                type="number"
                id="callTimeout"
                name="callTimeout"
                value={formData.settings.callTimeout}
                onChange={handleSettingsChange}
                min="10"
                max="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum call duration</p>
            </div>

            <div>
              <label htmlFor="dtmfTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                DTMF Timeout (seconds)
              </label>
              <input
                type="number"
                id="dtmfTimeout"
                name="dtmfTimeout"
                value={formData.settings.dtmfTimeout}
                onChange={handleSettingsChange}
                min="5"
                max="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Time to wait for DTMF input</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.audioFileId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;