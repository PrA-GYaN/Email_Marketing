import React, { useState, useEffect } from 'react';
import {
  Upload,
  Folder,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Archive,
  X,
  FolderPlus,
  Trash2,

  Grid,
  List,
  Check,
} from 'lucide-react';
import axios from 'axios';

interface MediaFile {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  folderId: string | null;
  createdAt: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  _count?: {
    children: number;
    files: number;
  };
}

interface MediaLibraryProps {
  onSelectFile?: (file: MediaFile) => void;
  allowMultiple?: boolean;
  acceptedTypes?: string[];
  mode?: 'standalone' | 'picker';
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectFile,
  allowMultiple = false,
  acceptedTypes = ['image/*'],
  mode = 'standalone',
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [storageUsage, setStorageUsage] = useState({ totalFiles: 0, totalSizeMB: '0' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadFolders();
    loadFiles();
    loadStorageUsage();
  }, [currentFolderId]);

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = currentFolderId ? `?parentId=${currentFolderId}` : '';
      const response = await axios.get(`${API_URL}/media/folders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = currentFolderId ? `?folderId=${currentFolderId}` : '';
      const response = await axios.get(`${API_URL}/media/files${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/media/storage/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStorageUsage(response.data);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const token = localStorage.getItem('token');

    for (let i = 0; i < uploadedFiles.length; i++) {
      const formData = new FormData();
      formData.append('file', uploadedFiles[i]);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      try {
        await axios.post(`${API_URL}/media/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error) {
        console.error('Failed to upload file:', error);
        alert(`Failed to upload ${uploadedFiles[i].name}`);
      }
    }

    loadFiles();
    loadStorageUsage();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/media/folders`,
        {
          name: newFolderName,
          parentId: currentFolderId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewFolderName('');
      setShowCreateFolder(false);
      loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/media/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadFiles();
      loadStorageUsage();
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? It must be empty.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/media/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadFolders();
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      alert(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleFileSelect = (file: MediaFile) => {
    if (mode === 'picker' && onSelectFile) {
      onSelectFile(file);
    } else {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        if (!allowMultiple) {
          newSelected.clear();
        }
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Film className="w-6 h-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Media Library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <FolderPlus className="w-5 h-5" />
              New Folder
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg cursor-pointer">
              <Upload className="w-5 h-5" />
              Upload Files
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept={acceptedTypes.join(',')}
              />
            </label>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="text-sm text-gray-600">
          {storageUsage.totalFiles} files • {storageUsage.totalSizeMB} MB used
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mt-2">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="hover:text-indigo-600"
          >
            Home
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Folders */}
        {folders.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4 mb-6' : 'space-y-2 mb-6'}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`${
                  viewMode === 'grid'
                    ? 'p-4 border rounded-lg hover:border-indigo-500 cursor-pointer'
                    : 'flex items-center justify-between p-3 border rounded-lg hover:border-indigo-500 cursor-pointer'
                }`}
                onClick={() => handleFolderClick(folder.id)}
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-6 h-6 text-yellow-500" />
                  <div>
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-xs text-gray-500">
                      {folder._count?.files || 0} files
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        {files.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
            {files.map((file) => (
              <div
                key={file.id}
                className={`${
                  viewMode === 'grid'
                    ? 'p-4 border rounded-lg hover:border-indigo-500 cursor-pointer relative'
                    : 'flex items-center justify-between p-3 border rounded-lg hover:border-indigo-500 cursor-pointer relative'
                } ${selectedFiles.has(file.id) ? 'border-indigo-500 bg-indigo-50' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                {selectedFiles.has(file.id) && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={`${API_URL.replace('/api', '')}${file.url}`}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="flex justify-center items-center h-32 bg-gray-100 rounded mb-2">
                    {getFileIcon(file.mimeType)}
                  </div>
                )}
                <div>
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id);
                  }}
                  className="absolute bottom-2 right-2 p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No files in this folder</p>
            <p className="text-sm">Upload files to get started</p>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Create New Folder</h3>
              <button onClick={() => setShowCreateFolder(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border rounded-lg mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
