import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    senderName: user?.senderName || '',
    senderEmail: user?.senderEmail || '',
    companyAddress: user?.companyAddress || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
    } catch (error) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="max-w-2xl">
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={user?.email} className="input bg-gray-50" disabled />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Sender Name</label>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  className="input"
                  placeholder="Your Name or Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Sender Email</label>
                <input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  className="input"
                  placeholder="noreply@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Address</label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="123 Main St, City, State 12345"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for compliance. Displayed in email footers.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
