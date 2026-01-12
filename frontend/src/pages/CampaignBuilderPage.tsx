import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Send, TestTube } from 'lucide-react';

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
    emailContent: {
      blocks: [
        { type: 'heading', data: { text: 'Welcome!' } },
        { type: 'text', data: { text: 'Your email content here...' } },
      ],
    },
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
      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        senderName: campaign.senderName,
        senderEmail: campaign.senderEmail,
        tagIds: campaign.tags.map((t: any) => t.tagId),
        emailContent: campaign.emailContent,
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

  const addBlock = (type: string) => {
    const newBlock: any = { type, data: {} };
    
    switch (type) {
      case 'heading':
        newBlock.data.text = 'Heading';
        break;
      case 'text':
        newBlock.data.text = 'Paragraph text';
        break;
      case 'button':
        newBlock.data = { text: 'Click Here', url: 'https://example.com' };
        break;
      case 'image':
        newBlock.data = { url: 'https://via.placeholder.com/600x300', alt: 'Image' };
        break;
    }

    setFormData({
      ...formData,
      emailContent: {
        blocks: [...formData.emailContent.blocks, newBlock],
      },
    });
  };

  const updateBlock = (index: number, data: any) => {
    const blocks = [...formData.emailContent.blocks];
    blocks[index].data = { ...blocks[index].data, ...data };
    setFormData({ ...formData, emailContent: { blocks } });
  };

  const deleteBlock = (index: number) => {
    const blocks = formData.emailContent.blocks.filter((_, i) => i !== index);
    setFormData({ ...formData, emailContent: { blocks } });
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Email Content</h2>
                <div className="flex space-x-2">
                  <button onClick={() => addBlock('heading')} className="btn btn-secondary text-sm">
                    + Heading
                  </button>
                  <button onClick={() => addBlock('text')} className="btn btn-secondary text-sm">
                    + Text
                  </button>
                  <button onClick={() => addBlock('button')} className="btn btn-secondary text-sm">
                    + Button
                  </button>
                  <button onClick={() => addBlock('image')} className="btn btn-secondary text-sm">
                    + Image
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.emailContent.blocks.map((block, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">{block.type}</span>
                      <button
                        onClick={() => deleteBlock(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {block.type === 'heading' && (
                      <input
                        type="text"
                        value={block.data.text}
                        onChange={(e) => updateBlock(index, { text: e.target.value })}
                        className="input text-xl font-bold"
                      />
                    )}

                    {block.type === 'text' && (
                      <textarea
                        value={block.data.text}
                        onChange={(e) => updateBlock(index, { text: e.target.value })}
                        className="input"
                        rows={3}
                      />
                    )}

                    {block.type === 'button' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.data.text}
                          onChange={(e) => updateBlock(index, { text: e.target.value })}
                          className="input"
                          placeholder="Button text"
                        />
                        <input
                          type="url"
                          value={block.data.url}
                          onChange={(e) => updateBlock(index, { url: e.target.value })}
                          className="input"
                          placeholder="Button URL"
                        />
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={block.data.url}
                          onChange={(e) => updateBlock(index, { url: e.target.value })}
                          className="input"
                          placeholder="Image URL"
                        />
                        <input
                          type="text"
                          value={block.data.alt || ''}
                          onChange={(e) => updateBlock(index, { alt: e.target.value })}
                          className="input"
                          placeholder="Alt text"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
