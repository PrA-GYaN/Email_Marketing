import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, TestTube, Image as ImageIcon, 
  Type, Link, FileText, Code, Minus
} from 'lucide-react';

export const EnhancedCampaignBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'header' | 'body' | 'footer'>('header');
  const [mergeTags, setMergeTags] = useState<any>(null);
  const [showMergeTags, setShowMergeTags] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    senderName: '',
    senderEmail: '',
    templateId: '',
    tagIds: [] as string[],
    emailContent: {
      header: {
        logo: '',
        title: '',
        navigation: [] as Array<{ text: string; url: string }>,
      },
      body: {
        blocks: [
          { type: 'heading', data: { text: 'Welcome!', level: 1 } },
          { type: 'text', data: { text: 'Your email content here...' } },
        ],
      },
      footer: {
        companyInfo: '',
        socialLinks: [] as Array<{ platform: string; url: string }>,
      },
    },
  });

  useEffect(() => {
    loadTags();
    loadTemplates();
    loadMergeTags();
    if (id) loadCampaign();
  }, [id]);

  useEffect(() => {
    if (formData.tagIds.length > 0) {
      calculateRecipients();
    } else {
      setRecipientCount(0);
    }
  }, [formData.tagIds]);

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

  const loadCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      const campaign = response.data;
      
      // Handle both old and new format
      const emailContent = campaign.emailContent.blocks 
        ? {
            header: { logo: '', title: '', navigation: [] },
            body: { blocks: campaign.emailContent.blocks },
            footer: { companyInfo: '', socialLinks: [] },
          }
        : campaign.emailContent;

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

  const loadMergeTags = async () => {
    try {
      const response = await api.get('/campaigns/merge-tags');
      setMergeTags(response.data);
    } catch (error) {
      console.error('Failed to load merge tags:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.senderName || !formData.senderEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.tagIds.length === 0) {
      toast.error('Please select at least one audience tag');
      return;
    }

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

  // Header functions
  const updateHeader = (field: string, value: any) => {
    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        header: { ...formData.emailContent.header, [field]: value },
      },
    });
  };

  const addNavLink = () => {
    const navigation = [...formData.emailContent.header.navigation, { text: 'Link', url: 'https://' }];
    updateHeader('navigation', navigation);
  };

  const updateNavLink = (index: number, field: string, value: string) => {
    const navigation = [...formData.emailContent.header.navigation];
    navigation[index] = { ...navigation[index], [field]: value };
    updateHeader('navigation', navigation);
  };

  const removeNavLink = (index: number) => {
    const navigation = formData.emailContent.header.navigation.filter((_, i) => i !== index);
    updateHeader('navigation', navigation);
  };

  // Body functions
  const addBlock = (type: string) => {
    const newBlock: any = { type, data: {} };
    
    switch (type) {
      case 'heading':
        newBlock.data = { text: 'Heading', level: 2 };
        break;
      case 'text':
        newBlock.data = { text: 'Paragraph text' };
        break;
      case 'richText':
        newBlock.data = { html: '<p>Rich text content</p>' };
        break;
      case 'button':
        newBlock.data = { text: 'Click Here', url: 'https://example.com', backgroundColor: '#4F46E5', textColor: '#ffffff' };
        break;
      case 'image':
        newBlock.data = { url: 'https://via.placeholder.com/600x300', alt: 'Image' };
        break;
      case 'divider':
        newBlock.data = {};
        break;
      case 'spacer':
        newBlock.data = { height: 20 };
        break;
      case 'pdf':
      case 'file':
        newBlock.data = { url: '', name: 'Download File' };
        break;
      case 'customHtml':
        newBlock.data = { html: '<div>Custom HTML</div>' };
        break;
    }

    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        body: {
          blocks: [...formData.emailContent.body.blocks, newBlock],
        },
      },
    });
  };

  const updateBlock = (index: number, data: any) => {
    const blocks = [...formData.emailContent.body.blocks];
    blocks[index].data = { ...blocks[index].data, ...data };
    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        body: { blocks },
      },
    });
  };

  const deleteBlock = (index: number) => {
    const blocks = formData.emailContent.body.blocks.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        body: { blocks },
      },
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...formData.emailContent.body.blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        body: { blocks },
      },
    });
  };

  // Footer functions
  const updateFooter = (field: string, value: any) => {
    setFormData({
      ...formData,
      emailContent: {
        ...formData.emailContent,
        footer: { ...formData.emailContent.footer, [field]: value },
      },
    });
  };

  const addSocialLink = () => {
    const socialLinks = [...formData.emailContent.footer.socialLinks, { platform: 'Facebook', url: 'https://' }];
    updateFooter('socialLinks', socialLinks);
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const socialLinks = [...formData.emailContent.footer.socialLinks];
    socialLinks[index] = { ...socialLinks[index], [field]: value };
    updateFooter('socialLinks', socialLinks);
  };

  const removeSocialLink = (index: number) => {
    const socialLinks = formData.emailContent.footer.socialLinks.filter((_, i) => i !== index);
    updateFooter('socialLinks', socialLinks);
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{id ? 'Edit Campaign' : 'New Campaign'}</h1>
          <div className="flex space-x-3">
            {id && (
              <button onClick={handleSendTest} className="btn btn-secondary flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Send Test</span>
              </button>
            )}
            <button onClick={handleSave} disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sender Name *</label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sender Email *</label>
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
                    <option value="">No Template (Block-based design)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isDefault ? '⭐' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Use a template to wrap your content with consistent branding
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Audience Tags * (OR logic)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
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
                                tagIds: formData.tagIds.filter((id) => id !== tag.id),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {tag.name} ({tag.contactCount})
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {formData.tagIds.length > 0 && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-900">
                        📧 Recipients: {recipientCount} contacts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Merge Tags Helper */}
            {mergeTags && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Personalization Tags</h2>
                  <button
                    onClick={() => setShowMergeTags(!showMergeTags)}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    {showMergeTags ? 'Hide' : 'Show'} Tags
                  </button>
                </div>
                
                {showMergeTags && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Use these tags in your subject line and email content to personalize emails with contact data:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(mergeTags).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <code className="text-sm font-mono text-primary-600">{`{${key}}`}</code>
                          <span className="text-xs text-gray-500">{value.description}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Example: "Hello {'{'}FirstName{'}'}" will become "Hello John" for each contact.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Builder */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {(['header', 'body', 'footer'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Header Tab */}
              {activeTab === 'header' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Header</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={formData.emailContent.header.logo}
                      onChange={(e) => updateHeader('logo', e.target.value)}
                      className="input"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.emailContent.header.title}
                      onChange={(e) => updateHeader('title', e.target.value)}
                      className="input"
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Navigation Links</label>
                      <button onClick={addNavLink} className="btn btn-secondary text-sm">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {formData.emailContent.header.navigation.map((nav, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={nav.text}
                          onChange={(e) => updateNavLink(index, 'text', e.target.value)}
                          className="input flex-1"
                          placeholder="Link text"
                        />
                        <input
                          type="url"
                          value={nav.url}
                          onChange={(e) => updateNavLink(index, 'url', e.target.value)}
                          className="input flex-1"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => removeNavLink(index)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Tab */}
              {activeTab === 'body' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Email Body</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => addBlock('heading')} className="btn btn-sm btn-secondary">
                        <Type className="h-4 w-4" /> Heading
                      </button>
                      <button onClick={() => addBlock('text')} className="btn btn-sm btn-secondary">
                        <FileText className="h-4 w-4" /> Text
                      </button>
                      <button onClick={() => addBlock('button')} className="btn btn-sm btn-secondary">
                        <Link className="h-4 w-4" /> Button
                      </button>
                      <button onClick={() => addBlock('image')} className="btn btn-sm btn-secondary">
                        <ImageIcon className="h-4 w-4" /> Image
                      </button>
                      <button onClick={() => addBlock('divider')} className="btn btn-sm btn-secondary">
                        <Minus className="h-4 w-4" /> Divider
                      </button>
                      <button onClick={() => addBlock('file')} className="btn btn-sm btn-secondary">
                        📎 File/PDF
                      </button>
                      <button onClick={() => addBlock('customHtml')} className="btn btn-sm btn-secondary">
                        <Code className="h-4 w-4" /> HTML
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formData.emailContent.body.blocks.map((block, index) => (
                      <BlockEditor
                        key={index}
                        block={block}
                        onUpdate={(data) => updateBlock(index, data)}
                        onDelete={() => deleteBlock(index)}
                        onMove={(direction) => moveBlock(index, direction)}
                        isFirst={index === 0}
                        isLast={index === formData.emailContent.body.blocks.length - 1}
                      />
                    ))}

                    {formData.emailContent.body.blocks.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-gray-500 mb-4">No content blocks yet</p>
                        <p className="text-sm text-gray-400">Click the buttons above to add content</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Tab */}
              {activeTab === 'footer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Footer</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Information</label>
                    <textarea
                      value={formData.emailContent.footer.companyInfo}
                      onChange={(e) => updateFooter('companyInfo', e.target.value)}
                      className="input"
                      rows={3}
                      placeholder="Your Company Name&#10;123 Main St, City, State 12345&#10;contact@company.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Social Media Links</label>
                      <button onClick={addSocialLink} className="btn btn-secondary text-sm">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {formData.emailContent.footer.socialLinks.map((social, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <select
                          value={social.platform}
                          onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                          className="input w-40"
                        >
                          <option>Facebook</option>
                          <option>Twitter</option>
                          <option>LinkedIn</option>
                          <option>Instagram</option>
                          <option>YouTube</option>
                        </select>
                        <input
                          type="url"
                          value={social.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          className="input flex-1"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => removeSocialLink(index)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">✅ Unsubscribe Link</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      An unsubscribe link will be automatically added to all campaign emails for compliance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Block Editor Component
interface BlockEditorProps {
  block: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ block, onUpdate, onDelete, onMove, isFirst, isLast }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 capitalize">{block.type}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="text-gray-600 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={isLast}
            className="text-gray-600 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {block.type === 'heading' && (
        <div className="space-y-2">
          <select
            value={block.data.level || 2}
            onChange={(e) => onUpdate({ level: parseInt(e.target.value) })}
            className="input w-32"
          >
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
          </select>
          <input
            type="text"
            value={block.data.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="input text-xl font-bold"
            placeholder="Heading text"
          />
        </div>
      )}

      {block.type === 'text' && (
        <textarea
          value={block.data.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="input"
          rows={3}
          placeholder="Paragraph text"
        />
      )}

      {block.type === 'richText' && (
        <textarea
          value={block.data.html}
          onChange={(e) => onUpdate({ html: e.target.value })}
          className="input font-mono text-sm"
          rows={4}
          placeholder="<p>Rich HTML content</p>"
        />
      )}

      {block.type === 'button' && (
        <div className="space-y-2">
          <input
            type="text"
            value={block.data.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="input"
            placeholder="Button text"
          />
          <input
            type="url"
            value={block.data.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            className="input"
            placeholder="Button URL"
          />
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs mb-1">Background Color</label>
              <input
                type="color"
                value={block.data.backgroundColor || '#4F46E5'}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="w-full h-10 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1">Text Color</label>
              <input
                type="color"
                value={block.data.textColor || '#ffffff'}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-full h-10 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {block.type === 'image' && (
        <div className="space-y-2">
          <input
            type="url"
            value={block.data.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            className="input"
            placeholder="Image URL"
          />
          <input
            type="text"
            value={block.data.alt || ''}
            onChange={(e) => onUpdate({ alt: e.target.value })}
            className="input"
            placeholder="Alt text (for accessibility)"
          />
          {block.data.url && (
            <img src={block.data.url} alt="Preview" className="max-w-full h-auto rounded" />
          )}
        </div>
      )}

      {block.type === 'divider' && (
        <div className="border-t-2 border-gray-300 my-4"></div>
      )}

      {block.type === 'spacer' && (
        <div>
          <label className="block text-sm mb-2">Height (px)</label>
          <input
            type="number"
            value={block.data.height || 20}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
            className="input w-32"
            min="10"
            max="200"
          />
        </div>
      )}

      {(block.type === 'file' || block.type === 'pdf') && (
        <div className="space-y-2">
          <input
            type="text"
            value={block.data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="input"
            placeholder="File name"
          />
          <input
            type="url"
            value={block.data.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            className="input"
            placeholder="File URL"
          />
        </div>
      )}

      {block.type === 'customHtml' && (
        <div>
          <label className="block text-sm mb-2">Custom HTML</label>
          <textarea
            value={block.data.html}
            onChange={(e) => onUpdate({ html: e.target.value })}
            className="input font-mono text-sm"
            rows={6}
            placeholder="<div>Your custom HTML here</div>"
          />
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ Use with caution. Invalid HTML may break email rendering.
          </p>
        </div>
      )}
    </div>
  );
};
