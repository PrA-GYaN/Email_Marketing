import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = useCallback(async (emailToUnsubscribe?: string) => {
    const targetEmail = emailToUnsubscribe || email;
    
    if (!targetEmail) {
      setStatus('error');
      setMessage('Please provide an email address.');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const campaignId = searchParams.get('campaignId');
      // Note: Using axios directly instead of api.ts because this is a public endpoint
      // that doesn't require authentication and shouldn't redirect to login on errors
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      const params: { email: string; campaignId?: string } = { email: targetEmail };
      if (campaignId) {
        params.campaignId = campaignId;
      }

      const response = await axios.get(`${apiUrl}/unsubscribe`, { params });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'You have been successfully unsubscribed.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error: unknown) {
      setStatus('error');
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, searchParams]);

  useEffect(() => {
    // Get email from URL if provided
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      // Auto-submit if email is in URL
      handleUnsubscribe(emailFromUrl);
    }
  }, [searchParams, handleUnsubscribe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnsubscribe();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">ViozonX</h1>
          <p className="text-gray-600">Email Marketing Platform</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Unsubscribe</h2>
          
          {status === 'idle' && (
            <>
              <p className="text-gray-600 mb-6">
                We're sorry to see you go. Enter your email address below to unsubscribe from our mailing list.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? 'Processing...' : 'Unsubscribe'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                You will no longer receive emails from us.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setMessage('');
                }}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
