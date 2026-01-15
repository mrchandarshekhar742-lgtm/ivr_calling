import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowRight, Phone, Music, MessageSquare } from 'lucide-react';
import api from '../utils/api';

const IVRFlowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flow, setFlow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [nodeForm, setNodeForm] = useState({
    nodeKey: '',
    nodeName: '',
    audioFileId: '',
    promptText: '',
    nodeType: 'menu',
    timeout: 10,
    retryCount: 3,
    actions: {}
  });

  useEffect(() => {
    fetchFlowData();
    fetchAudioFiles();
  }, [id]);

  const fetchFlowData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ivr-flows/${id}`);
      setFlow(response.data.data);
      setNodes(response.data.data.nodes || []);
    } catch (error) {
      console.error('Error fetching flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudioFiles = async () => {
    try {
      const response = await api.get('/audio');
      setAudioFiles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching audio files:', error);
    }
  };

  const handleAddNode = () => {
    setEditingNode(null);
    setNodeForm({
      nodeKey: '',
      nodeName: '',
      audioFileId: '',
      promptText: '',
      nodeType: 'menu',
      timeout: 10,
      retryCount: 3,
      actions: {}
    });
    setShowNodeModal(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    setNodeForm({
      nodeKey: node.nodeKey,
      nodeName: node.nodeName,
      audioFileId: node.audioFileId || '',
      promptText: node.promptText || '',
      nodeType: node.nodeType,
      timeout: node.timeout,
      retryCount: node.retryCount,
      actions: node.actions || {}
    });
    setShowNodeModal(true);
  };

  const handleSaveNode = async (e) => {
    e.preventDefault();
    try {
      if (editingNode) {
        // Update existing node
        await api.put(`/ivr-flows/${id}/nodes/${editingNode.id}`, nodeForm);
      } else {
        // Create new node
        await api.post(`/ivr-flows/${id}/nodes`, nodeForm);
      }
      setShowNodeModal(false);
      fetchFlowData();
    } catch (error) {
      console.error('Error saving node:', error);
      alert('Failed to save node');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Delete this node?')) return;
    try {
      await api.delete(`/ivr-flows/${id}/nodes/${nodeId}`);
      fetchFlowData();
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const handleAddAction = () => {
    const key = prompt('Enter DTMF key (0-9, *, #):');
    if (!key || key.length !== 1) return;

    const actionType = prompt('Action type (goto/end/transfer):');
    if (!actionType) return;

    let action = { type: actionType };

    if (actionType === 'goto') {
      const target = prompt('Target node key:');
      if (target) action.target = target;
    } else if (actionType === 'transfer') {
      const number = prompt('Transfer to phone number:');
      if (number) action.number = number;
    }

    setNodeForm({
      ...nodeForm,
      actions: {
        ...nodeForm.actions,
        [key]: action
      }
    });
  };

  const handleRemoveAction = (key) => {
    const newActions = { ...nodeForm.actions };
    delete newActions[key];
    setNodeForm({ ...nodeForm, actions: newActions });
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
          <button
            onClick={() => navigate('/ivr-flows')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to IVR Flows
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{flow?.name}</h1>
          <p className="text-gray-600">{flow?.description}</p>
        </div>
        <button
          onClick={handleAddNode}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Node
        </button>
      </div>

      {/* Flow Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">IVR Flow Structure</h2>
        
        {nodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No nodes yet. Add your first node to start building the IVR flow.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map((node, index) => (
              <div key={node.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {node.nodeType === 'menu' && <Phone className="w-5 h-5 text-blue-600" />}
                      {node.nodeType === 'message' && <MessageSquare className="w-5 h-5 text-green-600" />}
                      {node.nodeType === 'input' && <Music className="w-5 h-5 text-purple-600" />}
                      <h3 className="font-semibold text-gray-900">{node.nodeName}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {node.nodeKey}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        node.nodeType === 'menu' ? 'bg-blue-100 text-blue-800' :
                        node.nodeType === 'message' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {node.nodeType}
                      </span>
                    </div>
                    
                    {node.promptText && (
                      <p className="text-sm text-gray-600 mb-2">{node.promptText}</p>
                    )}
                    
                    {node.audioFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Music className="w-4 h-4" />
                        <span>{node.audioFile.filename}</span>
                      </div>
                    )}
                    
                    {/* DTMF Actions */}
                    {node.actions && Object.keys(node.actions).length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-700">DTMF Actions:</p>
                        {Object.entries(node.actions).map(([key, action]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded font-mono">{key}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {action.type === 'goto' && `Go to: ${action.target}`}
                              {action.type === 'end' && 'End call'}
                              {action.type === 'transfer' && `Transfer to: ${action.number}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditNode(node)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-bold mb-4">
              {editingNode ? 'Edit Node' : 'Add New Node'}
            </h2>
            <form onSubmit={handleSaveNode} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Key * (unique identifier)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingNode}
                    value={nodeForm.nodeKey}
                    onChange={(e) => setNodeForm({ ...nodeForm, nodeKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., main_menu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Type
                  </label>
                  <select
                    value={nodeForm.nodeType}
                    onChange={(e) => setNodeForm({ ...nodeForm, nodeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="menu">Menu (with options)</option>
                    <option value="message">Message (play only)</option>
                    <option value="input">Input (collect DTMF)</option>
                    <option value="transfer">Transfer</option>
                    <option value="end">End Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Name *
                </label>
                <input
                  type="text"
                  required
                  value={nodeForm.nodeName}
                  onChange={(e) => setNodeForm({ ...nodeForm, nodeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Menu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audio File
                </label>
                <select
                  value={nodeForm.audioFileId}
                  onChange={(e) => setNodeForm({ ...nodeForm, audioFileId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select audio file...</option>
                  {audioFiles.map((audio) => (
                    <option key={audio.id} value={audio.id}>
                      {audio.filename} ({audio.duration}s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt Text (for reference)
                </label>
                <textarea
                  value={nodeForm.promptText}
                  onChange={(e) => setNodeForm({ ...nodeForm, promptText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="e.g., Press 1 for Sales, Press 2 for Support"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={nodeForm.timeout}
                    onChange={(e) => setNodeForm({ ...nodeForm, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={nodeForm.retryCount}
                    onChange={(e) => setNodeForm({ ...nodeForm, retryCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* DTMF Actions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    DTMF Actions
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Action
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.entries(nodeForm.actions).map(([key, action]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="px-2 py-1 bg-white rounded font-mono text-sm">{key}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm flex-1">
                        {action.type === 'goto' && `Go to: ${action.target}`}
                        {action.type === 'end' && 'End call'}
                        {action.type === 'transfer' && `Transfer: ${action.number}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNodeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingNode ? 'Update Node' : 'Add Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IVRFlowBuilder;
