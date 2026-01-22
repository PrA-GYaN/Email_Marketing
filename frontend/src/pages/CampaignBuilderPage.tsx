import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TestTube } from 'lucide-react';
import { EmailEditorWithStorage } from '@/components/EmailEditorWithStorage';

export const CampaignBuilderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    senderName: '',
    senderEmail: '',
    tagIds: [] as string[],
    emailContent: '<h1>Welcome!</h1><p>Your email content here...</p>',
  });

  useEffect(() => {
    loadTags();
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

  const loadCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      const campaign = response.data;
      
      // Handle both old block-based format and new HTML format
      let emailContent = '<h1>Welcome!</h1><p>Your email content here...</p>';
      if (typeof campaign.emailContent === 'string') {
        emailContent = campaign.emailContent;
      } else if (campaign.emailContent?.blocks) {
        // Convert old block format to HTML (for backward compatibility)
        emailContent = convertBlocksToHTML(campaign.emailContent.blocks);
      }
      
      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        senderName: campaign.senderName,
        senderEmail: campaign.senderEmail,
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
                                tagIds: formData.tagIds.filter((id) => id !== tag.id),
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
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Email Content</h2>
              <p className="text-sm text-gray-600 mb-4">
                Use the visual drag-and-drop editor to create your email. You can use merge tags like {'{FirstName}'}, {'{LastName}'}, {'{Email}'}, and {'{{UNSUBSCRIBE_LINK}}'} for personalization.
              </p>
              
              <EmailEditorWithStorage
                value={formData.emailContent}
                onChange={(content) => setFormData({ ...formData, emailContent: content })}
                height={600}
                storageKey="campaign-content"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
