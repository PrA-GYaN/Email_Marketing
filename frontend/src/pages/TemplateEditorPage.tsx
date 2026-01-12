import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    htmlContent: '',
    thumbnail: '',
  });
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

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
        htmlContent: response.data.htmlContent,
        thumbnail: response.data.thumbnail || '',
      });
      setPreviewHtml(response.data.htmlContent);
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/templates');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'htmlContent') {
      setPreviewHtml(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && id) {
        await api.patch(`/templates/${id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/templates', formData);
        toast.success('Template created successfully');
      }
      navigate('/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.htmlContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + placeholder + after;
      
      setFormData((prev) => ({ ...prev, htmlContent: newText }));
      setPreviewHtml(newText);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const loadSampleTemplate = () => {
    const sample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">{{HEADER_TITLE}}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              {{CONTENT}}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280;">{{COMPANY_INFO}}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">{{UNSUBSCRIBE_LINK}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    setFormData((prev) => ({ ...prev, htmlContent: sample }));
    setPreviewHtml(sample);
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
          Design your email template with HTML and use placeholders for dynamic content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description of this template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com/thumbnail.png"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  HTML Content *
                </label>
                <button
                  type="button"
                  onClick={loadSampleTemplate}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Load Sample Template
                </button>
              </div>
              <textarea
                id="htmlContent"
                name="htmlContent"
                value={formData.htmlContent}
                onChange={handleChange}
                required
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                placeholder="Enter your HTML template code here..."
              />
            </div>

            {/* Placeholder Helpers */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Available Placeholders</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{HEADER_TITLE}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}HEADER_TITLE{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{CONTENT}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}CONTENT{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{COMPANY_INFO}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}COMPANY_INFO{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{UNSUBSCRIBE_LINK}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}UNSUBSCRIBE_LINK{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{OFFER_TITLE}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}OFFER_TITLE{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{OFFER_SUBTITLE}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}OFFER_SUBTITLE{'}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{ANNOUNCEMENT_TITLE}}')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {'{{'}ANNOUNCEMENT_TITLE{'}}'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Click to insert placeholders. These will be replaced with actual content when used in campaigns.
              </p>
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

        {/* Preview Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <iframe
              srcDoc={previewHtml}
              title="Template Preview"
              className="w-full"
              style={{ minHeight: '600px', height: 'calc(100vh - 300px)' }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
