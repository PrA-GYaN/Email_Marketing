import React from 'react';
import { X } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface MediaFile {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
  acceptedTypes?: string[];
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  acceptedTypes = ['image/*'],
}) => {
  if (!isOpen) return null;

  const handleSelect = (file: MediaFile) => {
    onSelect(file);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Select Media</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <MediaLibrary
            mode="picker"
            onSelectFile={handleSelect}
            acceptedTypes={acceptedTypes}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
