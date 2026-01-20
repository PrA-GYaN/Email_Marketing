import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { EmailBuilder, getDefaultTemplate, resetDocument, useDocument, exportHtmlFromDocument } from '@/components/EmailBuilder';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const document = useDocument();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnail: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      loadTemplate(id);
    }
  }, [isEdit, id]);

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await api.get(`/templates/${templateId}`);
      setFormData({
        name: response.data.name,
        description: response.data.description || '',
        thumbnail: response.data.thumbnail || '',
      });
      
      // Try to parse design from stored data
      try {
        if (response.data.design) {
          const design = typeof response.data.design === 'string' 
            ? JSON.parse(response.data.design) 
            : response.data.design;
          resetDocument(design);
        }
      } catch (e) {
        console.log('No design JSON found, starting with default template');
      }
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/templates');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Export HTML from the current document
      const html = exportHtmlFromDocument(document, { rootBlockId: 'root' });
      
      const dataToSave = {
        ...formData,
        htmlContent: html,
        design: JSON.stringify(document),
      };

      if (isEdit && id) {
        await api.patch(`/templates/${id}`, dataToSave);
        toast.success('Template updated successfully');
      } else {
        await api.post('/templates', dataToSave);
        toast.success('Template created successfully');
      }
      navigate('/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const loadStarterTemplate = () => {
    const starterTemplate = getDefaultTemplate();
    resetDocument(starterTemplate);
    toast.success('Starter template loaded with placeholders');
  };

  const handleExport = (html: string, design: any) => {
    console.log('Template exported', { html, design });
  };

  return (
    <Layout>
      <div className="p-8">
        <button
          onClick={() => navigate('/templates')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Templates
        </button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Template' : 'Create Template'}
        </h1>
        <p className="mt-2 text-gray-600">
          Design your email template using the visual builder with placeholder blocks.
        </p>
      </div>

      <div className="px-8 pb-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Settings</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Newsletter Template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input
                  type="text"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/thumb.png"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 Template Design Guide</h3>
                <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                  <li>Use Preview tab to see your design, JSON Editor to modify structure, HTML Output to see generated code</li>
                  <li>The starter template includes <strong>placeholder blocks</strong>:</li>
                  <li className="ml-4"><code className="bg-blue-100 px-1 rounded">{'{{HEADER}}'}</code> - Logo/banner section</li>
                  <li className="ml-4"><code className="bg-blue-100 px-1 rounded">{'{{CONTENT}}'}</code> - Main email body</li>
                  <li className="ml-4"><code className="bg-blue-100 px-1 rounded">{'{{FOOTER}}'}</code> - Footer content</li>
                  <li className="ml-4"><code className="bg-blue-100 px-1 rounded">{'{{UNSUBSCRIBE_LINK}}'}</code> - Unsubscribe URL</li>
                  <li>These placeholders will be replaced with actual content when used in campaigns</li>
                </ul>
              </div>

              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={loadStarterTemplate}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  🔄 Reset to Starter Template
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mb-6">
          <EmailBuilder onExport={handleExport} />
        </div>
      </div>
    </Layout>
  );
}
