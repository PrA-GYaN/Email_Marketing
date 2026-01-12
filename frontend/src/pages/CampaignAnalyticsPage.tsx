import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { ArrowLeft, Mail, Eye, MousePointer, XCircle, UserMinus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const CampaignAnalyticsPage: React.FC = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics');
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

  if (!analytics) {
    return (
      <Layout>
        <div className="p-8">
          <p>Failed to load analytics</p>
        </div>
      </Layout>
    );
  }

  const chartData = [
    { name: 'Sent', value: analytics.metrics.sent },
    { name: 'Delivered', value: analytics.metrics.delivered },
    { name: 'Opened', value: analytics.metrics.opened },
    { name: 'Clicked', value: analytics.metrics.clicked },
  ];

  return (
    <Layout>
      <div className="p-8">
        <Link to="/campaigns" className="flex items-center text-gray-600 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Campaigns
        </Link>

        <h1 className="text-3xl font-bold mb-2">{analytics.campaign.name}</h1>
        <p className="text-gray-600 mb-8">
          Sent on {new Date(analytics.campaign.sentAt).toLocaleString()}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            icon={Mail}
            label="Total Sent"
            value={analytics.metrics.sent}
            color="blue"
          />
          <MetricCard
            icon={Eye}
            label="Opened"
            value={`${analytics.metrics.openRate}%`}
            subtitle={`${analytics.metrics.opened} opens`}
            color="green"
          />
          <MetricCard
            icon={MousePointer}
            label="Clicked"
            value={`${analytics.metrics.clickRate}%`}
            subtitle={`${analytics.metrics.clicked} clicks`}
            color="purple"
          />
          <MetricCard
            icon={XCircle}
            label="Bounced"
            value={`${analytics.metrics.bounceRate}%`}
            subtitle={`${analytics.metrics.bounced} bounces`}
            color="red"
          />
          <MetricCard
            icon={UserMinus}
            label="Unsubscribed"
            value={analytics.metrics.unsubscribed}
            color="orange"
          />
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Campaign Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

const MetricCard: React.FC<any> = ({ icon: Icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`p-2 rounded ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};
