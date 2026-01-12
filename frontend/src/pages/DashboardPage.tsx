import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { Users, Tag, Mail, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    contacts: { total: 0, subscribed: 0, unsubscribed: 0 },
    tags: { total: 0, topTags: [] },
    campaigns: { total: 0, sent: 0, draft: 0, scheduled: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [contactsRes, tagsRes, campaignsRes] = await Promise.all([
        api.get('/contacts/stats'),
        api.get('/tags/stats'),
        api.get('/campaigns/stats'),
      ]);

      setStats({
        contacts: contactsRes.data,
        tags: tagsRes.data,
        campaigns: campaignsRes.data,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Contacts"
            value={stats.contacts.total}
            subtitle={`${stats.contacts.subscribed} subscribed`}
            color="blue"
            link="/contacts"
          />
          
          <StatCard
            icon={Tag}
            title="Tags"
            value={stats.tags.total}
            subtitle="Audience segments"
            color="purple"
            link="/tags"
          />
          
          <StatCard
            icon={Mail}
            title="Campaigns"
            value={stats.campaigns.total}
            subtitle={`${stats.campaigns.sent} sent`}
            color="green"
            link="/campaigns"
          />
          
          <StatCard
            icon={TrendingUp}
            title="Draft Campaigns"
            value={stats.campaigns.draft}
            subtitle={`${stats.campaigns.scheduled} scheduled`}
            color="orange"
            link="/campaigns"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/contacts?action=add" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold">Add Contacts</h3>
                <p className="text-sm text-gray-600">Import or manually add new contacts</p>
              </Link>
              
              <Link to="/campaigns?action=create" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold">Create Campaign</h3>
                <p className="text-sm text-gray-600">Design and send a new email campaign</p>
              </Link>
              
              <Link to="/tags" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold">Manage Tags</h3>
                <p className="text-sm text-gray-600">Organize contacts with tags</p>
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Top Tags</h2>
            {stats.tags.topTags.length > 0 ? (
              <div className="space-y-3">
                {stats.tags.topTags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-sm text-gray-600">{tag.contactCount} contacts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No tags yet. Create tags to organize your contacts.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle: string;
  color: string;
  link: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, subtitle, color, link }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Link to={link} className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
};
