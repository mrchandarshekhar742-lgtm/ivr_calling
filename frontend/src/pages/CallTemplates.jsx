import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  SpeakerWaveIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

const CallTemplates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, template: null });
  const queryClient = useQueryClient();

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'survey', label: 'Survey' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'notification', label: 'Notification' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'custom', label: 'Custom' }
  ];

  // Fetch templates
  const { data: templatesData, isLoading, error } = useQuery(
    ['templates', currentPage, searchTerm, selectedCategory],
    () => api.get('/api/templates', {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        category: selectedCategory || undefined
      }
    }).then(res => res.data.data),
    {
      keepPreviousData: true
    }
  );

  // Delete template mutation
  const deleteTemplateMutation = useMutation(
    (templateId) => api.delete(`/api/templates/${templateId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        toast.success('Template deleted successfully');
        setDeleteModal({ isOpen: false, template: null });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete template');
      }
    }
  );

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation(
    (templateId) => api.post(`/api/templates/${templateId}/duplicate`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        toast.success('Template duplicated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to duplicate template');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = (template) => {
    setDeleteModal({ isOpen: true, template });
  };

  const confirmDelete = () => {
    if (deleteModal.template) {
      deleteTemplateMutation.mutate(deleteModal.template.id);
    }
  };

  const handleDuplicate = (templateId) => {
    duplicateTemplateMutation.mutate(templateId);
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      survey: 'bg-blue-100 text-blue-800',
      reminder: 'bg-yellow-100 text-yellow-800',
      notification: 'bg-green-100 text-green-800',
      marketing: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.custom;
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading templates: {error.message}</p>
      </div>
    );
  }

  const { templates = [], pagination = {} } = templatesData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Templates</h1>
          <p className="text-gray-600">Manage reusable call templates for your campaigns</p>
        </div>
        <Link
          to="/templates/new"
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Template</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          {/* Category Filter */}
          <select
            className="form-select min-w-[200px]"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <SpeakerWaveIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search criteria'
              : 'Create your first call template to get started'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <Link to="/templates/new" className="btn-primary">
              Create Template
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicate template"
                      disabled={duplicateTemplateMutation.isLoading}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/templates/${template.id}/edit`}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                {/* Audio File */}
                {template.audioFile && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    <SpeakerWaveIcon className="h-4 w-4" />
                    <span>{template.audioFile.originalName}</span>
                    {template.audioFile.duration && (
                      <span className="text-gray-400">
                        ({Math.round(template.audioFile.duration)}s)
                      </span>
                    )}
                  </div>
                )}

                {/* DTMF Options */}
                {template.dtmfOptions && Object.keys(template.dtmfOptions).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">DTMF Options:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(template.dtmfOptions).map(key => (
                        <span key={key} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {key}: {template.dtmfOptions[key].action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Used {template.usageCount} times</span>
                  </div>
                  <span>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {currentPage} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, template: null })}
        title="Delete Template"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the template "{deleteModal.template?.name}"? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, template: null })}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteTemplateMutation.isLoading}
              className="btn-danger"
            >
              {deleteTemplateMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CallTemplates;