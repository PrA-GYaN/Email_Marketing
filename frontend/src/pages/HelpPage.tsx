import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Book,
  Mail,
  Users,
  Tag,
  FileText,
  Send,
  BarChart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

const HelpPage: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Welcome to ViozonX Email Marketing!</h3>
          <p>ViozonX is a powerful email marketing platform that helps you create, send, and track email campaigns to your subscribers.</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h4 className="font-semibold mb-2">Quick Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Import or add your contacts</li>
              <li>Create tags to organize your contacts</li>
              <li>Design your email campaign</li>
              <li>Preview and send your campaign</li>
              <li>Track campaign performance with analytics</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'contacts',
      title: 'Managing Contacts',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Contact Management</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-600">Adding Contacts</h4>
              <p>You can add contacts individually or import them in bulk using CSV files.</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Manual Entry:</strong> Click "Add Contact" and fill in the details</li>
                <li><strong>CSV Import:</strong> Upload a CSV file with columns: email, firstName, lastName</li>
                <li><strong>Required Fields:</strong> Only email is required, names are optional but recommended for personalization</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Contact Status</h4>
              <p>Contacts can have the following statuses:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Subscribed:</strong> Active contacts who will receive emails</li>
                <li><strong>Unsubscribed:</strong> Contacts who opted out and won't receive campaigns</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <strong>⚠️ Important:</strong> Always respect unsubscribe requests. The system automatically handles unsubscribes through campaign emails.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tags',
      title: 'Using Tags',
      icon: <Tag className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Tag System</h3>
          <p>Tags help you organize contacts into groups for targeted campaigns.</p>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-600">Creating Tags</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Go to Tags page and click "Create Tag"</li>
                <li>Give your tag a descriptive name (e.g., "Newsletter Subscribers", "VIP Customers")</li>
                <li>Assign contacts to tags when adding or editing them</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Using Tags in Campaigns</h4>
              <p className="mt-2">When creating a campaign, select one or more tags to target specific contact groups. Only <strong>subscribed</strong> contacts with those tags will receive the campaign.</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <strong>💡 Pro Tip:</strong> Use multiple tags for better segmentation. For example: "Customers + Interested in Product A" to create highly targeted campaigns.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'campaigns',
      title: 'Creating Campaigns',
      icon: <Mail className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Campaign Creation Guide</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-indigo-600">Campaign Builder</h4>
              <p>Our visual campaign builder makes it easy to create beautiful emails:</p>
              
              <div className="mt-3 space-y-2">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h5 className="font-semibold">1. Basic Information</h5>
                  <ul className="list-disc list-inside text-gray-700">
                    <li><strong>Campaign Name:</strong> Internal name for your reference</li>
                    <li><strong>Subject Line:</strong> What recipients see in their inbox</li>
                    <li><strong>Sender Name & Email:</strong> Who the email appears to be from</li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h5 className="font-semibold">2. Select Recipients</h5>
                  <p className="text-gray-700">Choose tags to determine who receives the campaign. Multiple tags can be selected.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h5 className="font-semibold">3. Design Your Email</h5>
                  <p className="text-gray-700">Use our block-based editor to add:</p>
                  <ul className="list-disc list-inside text-gray-700 ml-4">
                    <li>Text blocks with formatting</li>
                    <li>Images from Media Library</li>
                    <li>Buttons with links</li>
                    <li>Custom HTML</li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h5 className="font-semibold">4. Preview & Send</h5>
                  <p className="text-gray-700">Always preview your campaign before sending to see how it looks with real data.</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">✨ Auto-Save Feature</h4>
              <p>Your campaigns are automatically saved as drafts while you work. You can leave and come back anytime!</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'placeholders',
      title: 'Dynamic Placeholders',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Personalization with Merge Tags</h3>
          <p>Make your emails personal by using merge tags that automatically fill in contact information.</p>

          <div className="space-y-3">
            <h4 className="font-semibold text-indigo-600">Available Merge Tags</h4>
            
            <div className="space-y-2">
              {[
                { tag: '{FirstName}', description: 'Contact\'s first name', example: 'John' },
                { tag: '{LastName}', description: 'Contact\'s last name', example: 'Doe' },
                { tag: '{Full Name}', description: 'First and last name combined', example: 'John Doe' },
                { tag: '{First Name}', description: 'Alternative format for first name', example: 'John' },
                { tag: '{Last Name}', description: 'Alternative format for last name', example: 'Doe' },
                { tag: '{Name}', description: 'Full name or email prefix if name unavailable', example: 'John Doe' },
                { tag: '{Email}', description: 'Contact\'s email address', example: 'john@example.com' },
              ].map((item) => (
                <div key={item.tag} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-mono text-sm">
                        {item.tag}
                      </code>
                      <button
                        onClick={() => handleCopyTag(item.tag)}
                        className="p-1 hover:bg-indigo-100 rounded"
                        title="Copy tag"
                      >
                        {copiedTag === item.tag ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Example: <em>{item.example}</em></p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <h4 className="font-semibold mb-2">📝 Usage Examples</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Subject Line:</strong>
                  <code className="block mt-1 p-2 bg-white rounded">Hello {'{FirstName}'}, check out our new products!</code>
                </div>
                <div>
                  <strong>Email Body:</strong>
                  <code className="block mt-1 p-2 bg-white rounded">
                    Dear {'{Full Name}'},<br/>
                    <br/>
                    Thank you for being a valued customer...
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <strong>⚠️ Fallback Behavior:</strong> If a contact doesn't have a first/last name, the system will use a fallback (usually their email prefix) to ensure the email still looks good.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'media',
      title: 'Media Library',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Managing Media Files</h3>
          <p>The Media Library lets you upload and organize images and files for use in your campaigns.</p>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-600">Uploading Files</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Click "Upload Files" to select files from your computer</li>
                <li>Supported formats: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX</li>
                <li>Maximum file size: 50MB per file</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Organizing with Folders</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Create folders to organize your media</li>
                <li>Upload files directly into folders</li>
                <li>Move files between folders as needed</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Using Media in Campaigns</h4>
              <p className="mt-2">When adding images to your campaign, click the image icon and select from your Media Library instead of entering URLs manually.</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <strong>💡 Pro Tip:</strong> Create folders for different campaign types or seasons to stay organized!
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sending',
      title: 'Sending Campaigns',
      icon: <Send className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Campaign Delivery</h3>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-600">Before You Send</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Preview:</strong> Use the preview feature to see how your email looks</li>
                <li><strong>Test Email:</strong> Send a test to yourself to check everything</li>
                <li><strong>Check Recipients:</strong> Verify you've selected the correct tags</li>
                <li><strong>Proofread:</strong> Check subject line and content for errors</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Sending Options</h4>
              <div className="space-y-2 mt-2">
                <div className="p-3 bg-gray-50 rounded">
                  <strong>Send Now:</strong> Immediately sends the campaign to all selected contacts
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <strong>Schedule:</strong> Set a specific date and time for the campaign to send
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <strong>Save as Draft:</strong> Save progress and send later
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <strong>⚠️ Important:</strong> Once sent, campaigns cannot be stopped or edited. Always double-check before sending!
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Analytics & Tracking',
      icon: <BarChart className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Understanding Campaign Performance</h3>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-indigo-600">Key Metrics</h4>
              <div className="space-y-2 mt-2">
                {[
                  { metric: 'Total Recipients', description: 'Number of contacts selected for the campaign' },
                  { metric: 'Sent', description: 'Emails successfully sent from our system' },
                  { metric: 'Delivered', description: 'Emails that reached recipient inboxes' },
                  { metric: 'Opened', description: 'How many recipients opened the email' },
                  { metric: 'Clicked', description: 'How many recipients clicked links in the email' },
                  { metric: 'Bounced', description: 'Emails that could not be delivered' },
                  { metric: 'Unsubscribed', description: 'Recipients who opted out' },
                ].map((item) => (
                  <div key={item.metric} className="p-3 bg-gray-50 rounded">
                    <strong>{item.metric}:</strong> {item.description}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Calculated Rates</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Open Rate:</strong> (Opened / Delivered) × 100</li>
                <li><strong>Click Rate:</strong> (Clicked / Delivered) × 100</li>
                <li><strong>Bounce Rate:</strong> (Bounced / Sent) × 100</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold mb-2">📊 Industry Benchmarks</h4>
              <ul className="text-sm space-y-1">
                <li>Good Open Rate: 15-25%</li>
                <li>Good Click Rate: 2-5%</li>
                <li>Acceptable Bounce Rate: Under 2%</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Email Marketing Best Practices</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-indigo-600">Subject Lines</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Keep it under 50 characters</li>
                <li>Use personalization (e.g., {'{FirstName}'})</li>
                <li>Avoid spam trigger words (FREE, !!!, ACT NOW)</li>
                <li>Create urgency without being pushy</li>
                <li>A/B test different approaches</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Email Content</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Keep emails concise and scannable</li>
                <li>Use a clear call-to-action</li>
                <li>Optimize images for fast loading</li>
                <li>Include alt text for images</li>
                <li>Make sure emails are mobile-friendly</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">Sending Schedule</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Best days: Tuesday, Wednesday, Thursday</li>
                <li>Best times: 10 AM or 2 PM (recipient's timezone)</li>
                <li>Avoid weekends for B2B emails</li>
                <li>Don't send too frequently (respect your audience)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-600">List Hygiene</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Remove hard bounces immediately</li>
                <li>Re-engage inactive subscribers</li>
                <li>Honor unsubscribe requests instantly</li>
                <li>Keep your list updated and clean</li>
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <strong>💡 Golden Rule:</strong> Always provide value to your subscribers. If your emails aren't helpful or interesting, people will unsubscribe!
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
              <p className="text-gray-600">Everything you need to know about using ViozonX Email Marketing</p>
            </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <span className="font-semibold text-lg">{section.title}</span>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <div className="p-6 bg-white">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Still Need Help?</h3>
            <p className="text-gray-700 mb-4">
              If you can't find what you're looking for, please contact our support team.
            </p>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
  );
};

export default HelpPage;
