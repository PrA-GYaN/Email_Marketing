import React from 'react';
import { Layout } from '@/components/Layout';
import MediaLibrary from '../components/MediaLibrary';

const MediaLibraryPage: React.FC = () => {
  return (
    <Layout>
      <div className="h-full p-6">
        <MediaLibrary mode="standalone" />
      </div>
    </Layout>
  );
};

export default MediaLibraryPage;
