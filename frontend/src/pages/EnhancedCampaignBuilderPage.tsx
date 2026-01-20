import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TestTube, Eye, X } from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';

export const EnhancedCampaignBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'header' | 'body' | 'footer'>('body');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    senderName: '',
    senderEmail: '',
    templateId: '',
    tagIds: [] as string[],
    emailContent: {
      header: '<div style="text-align: center; padding: 20px; background-color: #f8f9fa;"><h2>Your Company Name</h2></div>',
      body: '<h1>Welcome!</h1><p>Your email content here...</p>',
      footer: '<div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px;"><p>© 2026 Your Company. All rights reserved.</p><p><a href="{{UNSUBSCRIBE_LINK}}">Unsubscribe</a></p></div>',
    },
  });

  useEffect(() => {
    loadTags();
    loadTemplates();
    if (id) loadCampaign();
  }, [id]);

  useEffect(() => {
    if (formData.tagIds.length > 0) {
      calculateRecipients();
    } else {
      setRecipientCount(0);
    }
  }, [formData.tagIds]);

  // Load template details when templateId changes
  useEffect(() => {
    if (formData.templateId) {
      loadTemplateDetails(formData.templateId);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId]);

  const loadTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (error) {
      toast.error('Failed to load tags');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const response = await api.get(`/templates/${templateId}`);
      const template = response.data;
      setSelectedTemplate(template);
      
      // Note: Template should only have {{HEADER}}, {{CONTENT}}, and {{FOOTER}} placeholders
      // User content from editors will automatically replace these sections
    } catch (error) {
      console.error('Failed to load template details:', error);
    }
  };



  const loadCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      const campaign = response.data;
      
      // Handle both old formats and new structured format
      let emailContent = {
        header: '<div style="text-align: center; padding: 20px; background-color: #f8f9fa;"><h2>Your Company Name</h2></div>',
        body: '<h1>Welcome!</h1><p>Your email content here...</p>',
        footer: '<div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px;"><p>© 2026 Your Company. All rights reserved.</p><p><a href="{{UNSUBSCRIBE_LINK}}">Unsubscribe</a></p></div>',
      };

      if (campaign.emailContent) {
        if (typeof campaign.emailContent === 'string') {
          // Old single HTML string format - put it in body
          emailContent.body = campaign.emailContent;
        } else if (campaign.emailContent.header || campaign.emailContent.body || campaign.emailContent.footer) {
          // New structured format
          emailContent = {
            header: campaign.emailContent.header || emailContent.header,
            body: campaign.emailContent.body || emailContent.body,
            footer: campaign.emailContent.footer || emailContent.footer,
          };
        } else if (campaign.emailContent.blocks) {
          // Old block format - convert to HTML in body
          emailContent.body = convertBlocksToHTML(campaign.emailContent.blocks);
        }
      }
      
      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        senderName: campaign.senderName,
        senderEmail: campaign.senderEmail,
        templateId: campaign.templateId || '',
        tagIds: campaign.tags.map((t: any) => t.tagId),
        emailContent,
      });
    } catch (error) {
      toast.error('Failed to load campaign');
    }
  };

  const convertBlocksToHTML = (blocks: any[]) => {
    return blocks.map((block: any) => {
      switch (block.type) {
        case 'heading':
          return `<h1>${block.data.text}</h1>`;
        case 'text':
          return `<p>${block.data.text}</p>`;
        case 'button':
          return `<p><a href="${block.data.url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">${block.data.text}</a></p>`;
        case 'image':
          return `<p><img src="${block.data.url}" alt="${block.data.alt || ''}" style="max-width: 100%; height: auto;" /></p>`;
        default:
          return '';
      }
    }).join('');
  };

  const calculateRecipients = async () => {
    try {
      const response = await api.get('/tags/contacts-by-tags', {
        params: { tagIds: formData.tagIds.join(',') },
      });
      setRecipientCount(response.data.length);
    } catch (error) {
      setRecipientCount(0);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (id) {
        await api.patch(`/campaigns/${id}`, formData);
        toast.success('Campaign updated');
      } else {
        const response = await api.post('/campaigns', formData);
        toast.success('Campaign created');
        navigate(`/campaigns/${response.data.id}/edit`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    const email = prompt('Enter test email address:');
    if (!email) return;

    try {
      await api.post(`/campaigns/${id}/send-test`, { testEmail: email });
      toast.success('Test email sent!');
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  const handlePreview = async () => {
    if (!id) {
      toast.error('Please save the campaign first to preview');
      return;
    }

    try {
      const response = await api.get(`/campaigns/${id}/preview`);
      setPreviewHtml(response.data.html);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to load preview');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{id ? 'Edit Campaign' : 'New Campaign'}</h1>
          <div className="flex space-x-3">
            {id && (
              <>
                <button onClick={handlePreview} className="btn btn-secondary flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Preview</span>
                </button>
                <button onClick={handleSendTest} className="btn btn-secondary flex items-center space-x-2">
                  <TestTube className="h-5 w-5" />
                  <span>Send Test</span>
                </button>
              </>
            )}
            <button onClick={handleSave} disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sender Name</label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sender Email</label>
                  <input
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Template (Optional)</label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="input"
                  >
                    <option value="">No Template (Use custom Header/Body/Footer)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isDefault ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Templates wrap your content with consistent branding. Leave empty to use custom sections below.
                  </p>
                  {selectedTemplate && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="text-green-800 font-medium">✓ Template selected: {selectedTemplate.name}</p>
                      <p className="text-green-700 mt-1">
                        Placeholders like <code className="bg-green-100 px-1 rounded">{'{{CONTENT}}'}</code> will be shown in the editor sections below.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Audience Tags (OR logic)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                            } else {
                              setFormData({
                                ...formData,
                                tagIds: formData.tagIds.filter((tid) => tid !== tag.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>
                          {tag.name} ({tag.contactCount})
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {formData.tagIds.length > 0 && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-900">
                        Recipients: {recipientCount} contacts
                      </p>
                      <p className="text-xs text-primary-700 mt-1">
                        Contacts with ANY of the selected tags (OR logic)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Builder */}
          <div className="lg:col-span-2">
            {selectedTemplate && (
              <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h3 className="text-sm font-semibold text-primary-900 mb-2">📧 Template Active: {selectedTemplate.name}</h3>
                <p className="text-xs text-primary-700">
                  Your content from Header, Body, and Footer tabs will automatically be inserted into the template structure.
                  The template provides the styling and layout, while you provide the content.
                </p>
              </div>
            )}
            
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Email Content</h2>
              
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('header')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'header'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Header
                  </button>
                  <button
                    onClick={() => setActiveTab('body')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'body'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Body
                  </button>
                  <button
                    onClick={() => setActiveTab('footer')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'footer'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Footer
                  </button>
                </nav>
              </div>

              {/* Tab Content - Render all editors but show only active one */}
              {/* Header Tab */}
              <div style={{ display: activeTab === 'header' ? 'block' : 'none' }}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Design your email header section. Typically includes your logo, company name, or banner.
                  </p>
                  {selectedTemplate && (
                    <p className="text-xs text-primary-600 font-medium mt-1">
                      ✓ This content will be inserted into your template's header area
                    </p>
                  )}
                </div>
                
                <RichTextEditor
                  key="header-editor"
                  value={formData.emailContent.header}
                  onChange={(content) => setFormData({ 
                    ...formData, 
                    emailContent: { ...formData.emailContent, header: content }
                  })}
                  height={400}
                />
              </div>

              {/* Body Tab */}
              <div style={{ display: activeTab === 'body' ? 'block' : 'none' }}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Create your main email content. You can use merge tags like {'{FirstName}'}, {'{LastName}'}, {'{Email}'} for personalization.
                  </p>
                  {selectedTemplate && (
                    <p className="text-xs text-primary-600 font-medium mt-1">
                      ✓ This content will be inserted into your template's main content area
                    </p>
                  )}
                </div>
                
                <RichTextEditor
                  key="body-editor"
                  value={formData.emailContent.body}
                  onChange={(content) => setFormData({ 
                    ...formData, 
                    emailContent: { ...formData.emailContent, body: content }
                  })}
                  height={500}
                />
              </div>

              {/* Footer Tab */}
              <div style={{ display: activeTab === 'footer' ? 'block' : 'none' }}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Design your email footer. Include company info, address, and contact details. The unsubscribe link is automatically added.
                  </p>
                  {selectedTemplate && (
                    <p className="text-xs text-primary-600 font-medium mt-1">
                      ✓ This content will be inserted into your template's footer area
                    </p>
                  )}
                </div>
                
                <RichTextEditor
                  key="footer-editor"
                  value={formData.emailContent.footer}
                  onChange={(content) => setFormData({ 
                    ...formData, 
                    emailContent: { ...formData.emailContent, footer: content }
                  })}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Campaign Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="email-preview"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                💡 This is how your email will appear to recipients
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-secondary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
