import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Send, Trash2, BarChart3, Edit } from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  const loadCampaigns = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/campaigns', { params });
      setCampaigns(response.data);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;

    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted');
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign now?')) return;

    try {
      await api.post(`/campaigns/${id}/send`);
      toast.success('Campaign is being sent!');
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send');
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
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <Link to="/campaigns/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>New Campaign</span>
          </Link>
        </div>

        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-48"
            >
              <option value="">All Campaigns</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SENT">Sent</option>
            </select>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No campaigns yet</p>
            <Link to="/campaigns/new" className="btn btn-primary">
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold text-lg">{campaign.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          campaign.status === 'SENT'
                            ? 'bg-green-100 text-green-700'
                            : campaign.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{campaign.subject}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{campaign._count.recipients} recipients</span>
                      {campaign.sentAt && (
                        <span>Sent {new Date(campaign.sentAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'SENT' && (
                      <Link
                        to={`/campaigns/${campaign.id}/analytics`}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    )}

                    {campaign.status === 'DRAFT' && (
                      <>
                        <Link
                          to={`/campaigns/${campaign.id}/edit`}
                          className="btn btn-secondary flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleSend(campaign.id)}
                          className="btn btn-primary flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          <span>Send</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
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
};
