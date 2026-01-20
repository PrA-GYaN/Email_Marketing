import React, { useState } from 'react';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';
import { useDocument, resetDocument, getDefaultDocument } from './EditorContext';

interface VisualEmailEditorProps {
  onExport?: (html: string, design: any) => void;
}

export const VisualEmailEditor: React.FC<VisualEmailEditorProps> = () => {
  const document = useDocument();
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'html'>('preview');
  const [jsonValue, setJsonValue] = useState(JSON.stringify(document, null, 2));

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonValue(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      resetDocument(parsed);
    } catch (error) {
      // Invalid JSON, don't update
    }
  };

  const handleReset = () => {
    const defaultDoc = getDefaultDocument();
    resetDocument(defaultDoc);
    setJsonValue(JSON.stringify(defaultDoc, null, 2));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'preview':
        return (
          <div className="bg-gray-100 p-6 min-h-[600px] overflow-auto">
            <div className="max-w-2xl mx-auto bg-white shadow-lg">
              <Reader document={document} rootBlockId="root" />
            </div>
          </div>
        );
      case 'json':
        return (
          <div className="p-4">
            <textarea
              value={jsonValue}
              onChange={handleJsonChange}
              className="w-full h-[600px] font-mono text-sm p-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your template JSON configuration..."
            />
          </div>
        );
      case 'html':
        const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
        return (
          <div className="p-4">
            <textarea
              value={html}
              readOnly
              className="w-full h-[600px] font-mono text-sm p-4 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        );
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            JSON Editor
          </button>
          <button
            onClick={() => setActiveTab('html')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'html'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            HTML Output
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Reset Template
          </button>
        </div>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
};

export default VisualEmailEditor;
