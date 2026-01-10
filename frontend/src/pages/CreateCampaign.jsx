import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactNumbers, setContactNumbers] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'bulk',
    audioFileId: '',
    settings: {
      maxRetries: 3,
      retryDelay: 300,
      callTimeout: 30,
      dtmfTimeout: 10
    }
  });

  // Fetch audio files
  const { data: audioData, isLoading: audioLoading } = useQuery({
    queryKey: ['audio-files'],
    queryFn: () => api.get('/api/audio'),
    retry: 2
  });

  // Fetch online devices (EXACTLY same as AndroidDevices page)
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'], // Same key as AndroidDevices page
    queryFn: async () => {
      console.log('🔍 CreateCampaign: Fetching devices...');
      const token = localStorage.getItem('token');
      console.log('🔑 CreateCampaign: Token exists:', !!token);
      
      try {
        const response = await api.get('/api/devices');
        console.log('✅ CreateCampaign: Devices API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ CreateCampaign: Devices API error:', error);
        console.error('❌ CreateCampaign: Error response:', error.response?.data);
        throw error;
      }
    },
    refetchInterval: 5000, // Same as AndroidDevices - refresh every 5 seconds
    retry: (failureCount, error) => {
      // Don't retry auth errors - same logic as AndroidDevices
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    }
  });

  // Fetch existing contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.get('/api/contacts'),
    retry: 2
  });

  const audioFiles = audioData?.data?.audioFiles || audioData?.data || [];
  const devices = devicesData?.data?.devices || [];
  
  // Direct online devices filtering - no complex state management
  const onlineDevices = devices.filter(device => device.status === 'online');
  const contacts = contactsData?.data?.contacts || contactsData?.data || [];

  // Enhanced debug logging
  console.log('🔍 CreateCampaign Debug Info:', {
    devicesDataRaw: devicesData,
    devicesDataPath: devicesData?.data,
    totalDevices: devices.length,
    onlineDevices: onlineDevices.length,
    allDeviceStatuses: devices.map(d => ({ 
      id: d.deviceId, 
      name: d.deviceName, 
      status: d.status,
      lastSeen: d.lastSeen 
    })),
    onlineDevicesList: onlineDevices.map(d => ({ 
      id: d.deviceId, 
      name: d.deviceName, 
      status: d.status 
    }))
  });

  // Ensure arrays are always arrays
  const safeAudioFiles = Array.isArray(audioFiles) ? audioFiles : [];
  const safeOnlineDevices = Array.isArray(onlineDevices) ? onlineDevices : [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  // Show loading spinner while data is loading
  if (audioLoading || devicesLoading || contactsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading campaign data...</p>
        </div>
      </div>
    );
  }

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

  const handleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  const handleSelectAllDevices = () => {
    if (selectedDevices.length === safeOnlineDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(safeOnlineDevices.map(device => device.deviceId));
    }
  };

  const parseContactNumbers = (text) => {
    // Extract phone numbers from text (supports various formats)
    const phoneRegex = /(\+?[\d\s\-()]{10,15})/g;
    const numbers = text.match(phoneRegex) || [];
    return numbers.map(num => num.replace(/[\s\-()]/g, '').trim()).filter(num => num.length >= 10);
  };

  const handleAddFromContacts = () => {
    const existingNumbers = parseContactNumbers(contactNumbers);
    const contactPhones = safeContacts.map(contact => contact.phone);
    const allNumbers = [...existingNumbers, ...contactPhones];
    const uniqueNumbers = [...new Set(allNumbers)];
    setContactNumbers(uniqueNumbers.join('\n'));
    toast.success(`Added ${contactPhones.length} contacts`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      const numbers = parseContactNumbers(contactNumbers);
      if (numbers.length === 0) {
        throw new Error('Please add at least one phone number');
      }

      if (selectedDevices.length === 0) {
        throw new Error('Please select at least one device');
      }

      // Create campaign
      const campaignData = {
        ...formData,
        contactNumbers: numbers,
        selectedDevices: selectedDevices,
        totalContacts: numbers.length,
        devicesUsed: selectedDevices.length
      };

      const response = await api.post('/api/campaigns', campaignData);
      console.log('Campaign created:', response.data);
      
      // Handle different response structures
      const createdCampaign = response.data.data || response.data;
      const campaignId = createdCampaign?.id;
      
      toast.success(`Campaign created with ${numbers.length} contacts across ${selectedDevices.length} devices`);
      
      if (campaignId) {
        navigate(`/campaigns/${campaignId}`);
      } else {
        navigate('/campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create campaign');
      console.error('Create campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600">Set up a new IVR campaign</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Force refresh devices data
              queryClient.invalidateQueries(['devices']);
              queryClient.refetchQueries(['devices']);
              console.log('🔄 Force refreshing devices data...');
            }}
            className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Force Refresh Devices
          </button>
          <button
            onClick={() => {
              // Refetch all data
              queryClient.invalidateQueries(['devices']);
              queryClient.invalidateQueries(['audio-files']);
              queryClient.invalidateQueries(['contacts']);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh All Data
          </button>
        </div>
      </div>

      {/* Enhanced Debug Panel - Temporary for troubleshooting */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Device Debug Information</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-yellow-700">
          <div>Total Devices: {devices.length}</div>
          <div>Online Devices: {safeOnlineDevices.length}</div>
          <div>Loading: {devicesLoading ? 'Yes' : 'No'}</div>
          <div>Data Exists: {!!devicesData ? 'Yes' : 'No'}</div>
          <div>API Response: {devicesData ? 'Success' : 'Failed'}</div>
          <div>Query Key: ['devices']</div>
        </div>
        {devices.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-yellow-800">All Device Status:</p>
            <div className="text-xs text-yellow-600 max-h-32 overflow-y-auto">
              {devices.map(device => (
                <div key={device.deviceId} className="flex justify-between">
                  <span>{device.deviceName}:</span>
                  <span className={`font-mono ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {safeOnlineDevices.length === 0 && devices.length > 0 && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
            <p className="text-xs font-medium text-red-800">⚠️ NO ONLINE DEVICES FOUND!</p>
            <p className="text-xs text-red-600">All devices are offline. Check device connectivity.</p>
          </div>
        )}
        <div className="mt-2 text-xs text-yellow-600">
          <p>API Endpoint: /api/devices</p>
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Contact Numbers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Contact Numbers</h3>
            {safeContacts.length > 0 && (
              <button
                type="button"
                onClick={handleAddFromContacts}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200"
              >
                Add All Contacts ({safeContacts.length})
              </button>
            )}
          </div>
          
          <div>
            <label htmlFor="contactNumbers" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Numbers *
            </label>
            <textarea
              id="contactNumbers"
              value={contactNumbers}
              onChange={(e) => setContactNumbers(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone numbers (one per line):
+91-9876543210
9876543211
+1-555-123-4567
etc..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Supports various formats: +91-9876543210, 9876543211, +1 (555) 123-4567
              </p>
              <p className="text-sm font-medium text-blue-600">
                {parseContactNumbers(contactNumbers).length} valid numbers
              </p>
            </div>
          </div>
        </div>

        {/* Device Selection */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Select Devices</h3>
            {safeOnlineDevices.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllDevices}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200"
              >
                {selectedDevices.length === safeOnlineDevices.length ? 'Deselect All' : 'Select All'} ({safeOnlineDevices.length})
              </button>
            )}
          </div>
          
          {safeOnlineDevices.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No Online Devices</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please connect at least one Android device to create campaigns.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeOnlineDevices.map(device => {
                const isSelected = selectedDevices.includes(device.deviceId);
                return (
                  <div
                    key={device.deviceId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleDeviceSelection(device.deviceId)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDeviceSelection(device.deviceId)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()} // Prevent double toggle
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{device.deviceName}</h4>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Online
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{device.deviceId}</p>
                        <div className="text-xs text-gray-400 mt-1 flex justify-between">
                          <span>Calls: {device.stats?.totalCalls || 0}</span>
                          <span>Success: {device.stats?.successfulCalls || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {selectedDevices.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📱 Selected {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''} for calling
              </p>
              {parseContactNumbers(contactNumbers).length > 0 && selectedDevices.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  ~{Math.ceil(parseContactNumbers(contactNumbers).length / selectedDevices.length)} calls per device
                </p>
              )}
            </div>
          )}
        </div>

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
              <option value="bulk">Bulk Campaign</option>
              <option value="scheduled">Scheduled Campaign</option>
              <option value="triggered">Triggered Campaign</option>
              <option value="broadcast">Broadcast Campaign</option>
              <option value="survey">Survey Campaign</option>
              <option value="notification">Notification Campaign</option>
              <option value="reminder">Reminder Campaign</option>
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
              {safeAudioFiles.map(file => (
                <option key={file.id} value={file.id}>
                  {file.name} ({file.duration ? `${file.duration}s` : 'Unknown duration'})
                </option>
              ))}
            </select>
            {safeAudioFiles.length === 0 && (
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
            disabled={loading || !formData.name || !formData.audioFileId || parseContactNumbers(contactNumbers).length === 0 || selectedDevices.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" /> : `Create Campaign (${parseContactNumbers(contactNumbers).length} numbers, ${selectedDevices.length} devices)`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;