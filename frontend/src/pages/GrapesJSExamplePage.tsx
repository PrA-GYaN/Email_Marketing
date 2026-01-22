import React, { useState } from 'react';
import { EmailEditorWithStorage } from '@/components/EmailEditorWithStorage';

/**
 * Example component demonstrating GrapesJS Email Editor integration
 * 
 * This shows how to:
 * 1. Initialize the editor with default content
 * 2. Handle content changes
 * 3. Save content to state/backend
 * 4. Load existing content
 */
export const GrapesJSExample: React.FC = () => {
  const [emailContent, setEmailContent] = useState<string>(`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to Our Newsletter</h1>
      </div>
      <div style="padding: 20px; background-color: #f8f9fa;">
        <h2>Hello {{FirstName}},</h2>
        <p>Thank you for subscribing to our newsletter. We're excited to share our latest updates with you!</p>
      </div>
      <div style="padding: 20px; text-align: center;">
        <a href="#" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Read More
        </a>
      </div>
      <div style="padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px;">
        <p>&copy; 2026 Your Company. All rights reserved.</p>
        <p><a href="{{UNSUBSCRIBE_LINK}}" style="color: #666;">Unsubscribe</a></p>
      </div>
    </div>
  `);
  
  const [savedContent, setSavedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleContentChange = (content: string) => {
    setEmailContent(content);
    console.log('Email content updated:', content.substring(0, 100) + '...');
  };

  const handleSave = () => {
    setSavedContent(emailContent);
    alert('Content saved successfully!\n\nIn a real application, this would save to the backend via API call.');
    console.log('Saved content:', emailContent);
  };

  const handleLoad = () => {
    if (savedContent) {
      setEmailContent(savedContent);
      alert('Content loaded successfully!');
    } else {
      alert('No saved content available. Save first!');
    }
  };

  const handleReset = () => {
    const defaultContent = `
      <div style="padding: 40px; text-align: center;">
        <h1>Start Building Your Email</h1>
        <p>Drag blocks from the left panel to create your email design.</p>
      </div>
    `;
    setEmailContent(defaultContent);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">GrapesJS Email Editor - Example</h1>
          <p className="text-gray-600">
            This is a working example of the GrapesJS email editor integration. 
            Try dragging blocks, customizing styles, and testing the save/load functionality.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            💾 Save Content
          </button>
          
          <button 
            onClick={handleLoad}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📂 Load Saved Content
          </button>
          
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            🔄 Reset to Blank
          </button>
          
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showPreview ? '✏️ Edit Mode' : '👁️ Preview HTML'}
          </button>
        </div>

        {/* Editor or Preview */}
        {showPreview ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">HTML Output Preview</h2>
            <div className="bg-gray-100 p-4 rounded-lg mb-4 overflow-auto max-h-96">
              <pre className="text-xs">{emailContent}</pre>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Rendered Preview:</h3>
              <div 
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: emailContent }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Email Editor</h2>
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>📦 <strong>Drag blocks</strong> from the left panel onto the canvas</li>
                <li>✏️ <strong>Click elements</strong> to edit content and styling</li>
                <li>🎨 <strong>Use style panel</strong> on the right to customize appearance</li>
                <li>📱 <strong>Test responsive</strong> design with device buttons at top</li>
                <li>🏷️ <strong>Add merge tags</strong>: {`{{FirstName}}`}, {`{{LastName}}`}, {`{{Email}}`}</li>
                <li>💾 <strong>Click Save</strong> when done to persist your design</li>
              </ul>
            </div>

            {/* GrapesJS Editor */}
            <EmailEditorWithStorage
              value={emailContent}
              onChange={handleContentChange}
              height={600}
              storageKey="example-email"
            />
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-3">Integration Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>✅ Visual drag-and-drop editor</li>
                <li>✅ Pre-built email components</li>
                <li>✅ Responsive design preview</li>
                <li>✅ Style customization</li>
                <li>✅ Save/load functionality</li>
                <li>✅ HTML output generation</li>
                <li>✅ Merge tag support</li>
                <li>✅ Email client compatibility</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Available Blocks:</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>📝 Text blocks</li>
                <li>📋 Headings</li>
                <li>🖼️ Images</li>
                <li>🔘 Buttons</li>
                <li>📊 Columns</li>
                <li>➖ Dividers</li>
                <li>🔗 Social links</li>
                <li>📧 Unsubscribe link</li>
                <li>👤 Merge tags</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✨ Production Ready:</strong> This example shows the exact same editor used in the campaign builder. 
              The content is stored as HTML and is compatible with all major email clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrapesJSExample;
