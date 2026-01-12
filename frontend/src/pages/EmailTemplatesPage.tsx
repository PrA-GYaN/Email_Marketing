import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import {
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  Copy as DocumentDuplicateIcon,
  Star as StarIcon,
} from 'lucide-react';
import { Star as StarIconSolid } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
  };
}

interface BuiltInTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  htmlContent: string;
  isBuiltIn: boolean;
}

export default function EmailTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [builtInTemplates, setBuiltInTemplates] = useState<BuiltInTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-templates' | 'built-in'>('my-templates');

  useEffect(() => {
    loadTemplates();
    loadBuiltInTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuiltInTemplates = async () => {
    try {
      const response = await api.get('/templates/built-in');
      setBuiltInTemplates(response.data);
    } catch (error) {
      console.error('Failed to load built-in templates:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await api.delete(`/templates/${id}`);
      await loadTemplates();
      toast.success('Template deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/templates/${id}/duplicate`);
      await loadTemplates();
      toast.success('Template duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.post(`/templates/${id}/set-default`);
      await loadTemplates();
      toast.success('Template set as default');
    } catch (error) {
      toast.error('Failed to set default template');
    }
  };

  const handleUseBuiltIn = async (template: BuiltInTemplate) => {
    try {
      await api.post('/templates', {
        name: template.name,
        description: template.description,
        htmlContent: template.htmlContent,
        thumbnail: template.thumbnail,
        isDefault: false,
      });
      await loadTemplates();
      setActiveTab('my-templates');
      toast.success('Template added successfully');
    } catch (error) {
      toast.error('Failed to add template');
    }
  };

  const handlePreview = (template: Template | BuiltInTemplate) => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      // For built-in templates, we have the HTML content directly
      if ('isBuiltIn' in template && template.isBuiltIn) {
        previewWindow.document.write(template.htmlContent);
      } else {
        // For user templates, we need to fetch the full template
        api.get(`/templates/${template.id}`).then((response: any) => {
          previewWindow.document.write(response.data.htmlContent);
        });
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <button
            onClick={() => navigate('/templates/new')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('built-in')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'built-in'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Built-in Templates ({builtInTemplates.length})
            </button>
          </nav>
        </div>

        {activeTab === 'my-templates' ? (
          <div>
            {templates.length === 0 ? (
              <div className="card text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new template or using a built-in template.
                </p>
                <div className="mt-6 space-x-3">
                  <button
                    onClick={() => navigate('/templates/new')}
                    className="btn btn-primary"
                  >
                    Create Template
                  </button>
                  <button
                    onClick={() => setActiveTab('built-in')}
                    className="btn btn-secondary"
                  >
                    Browse Built-in Templates
                  </button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  {/* Template Thumbnail */}
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                    {template.isDefault && (
                      <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                        <StarIconSolid className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>
                        Used in {template._count?.campaigns || 0} campaign
                        {template._count?.campaigns !== 1 ? 's' : ''}
                      </span>
                      <span>
                        Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(template)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/templates/${template.id}/edit`)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template.id)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        {!template.isDefault && (
                          <button
                            onClick={() => handleSetDefault(template.id)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Set as Default"
                          >
                            <StarIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builtInTemplates.map((template) => (
              <div
                key={template.id}
                className="card hover:shadow-lg transition-shadow"
              >
              {/* Template Thumbnail */}
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between space-x-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleUseBuiltIn(template)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
