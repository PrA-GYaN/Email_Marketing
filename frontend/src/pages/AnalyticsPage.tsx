import React from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Overview</h1>
        
        <div className="card">
          <p className="text-gray-600 mb-4">
            View analytics for individual campaigns by going to the Campaigns page.
          </p>
          <Link to="/campaigns" className="btn btn-primary">
            Go to Campaigns
          </Link>
        </div>
      </div>
    </Layout>
  );
};
