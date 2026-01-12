import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Upload, Search, Trash2, Edit } from 'lucide-react';
import Papa from 'papaparse';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [editingContact, setEditingContact] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [filterTag, search]);

  const loadData = async () => {
    try {
      const params: any = {};
      if (filterTag) params.tagId = filterTag;
      if (search) params.search = search;

      const [contactsRes, tagsRes] = await Promise.all([
        api.get('/contacts', { params }),
        api.get('/tags'),
      ]);

      setContacts(contactsRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;

    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Contact deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedContacts.length} contacts?`)) return;

    try {
      await api.post('/contacts/bulk-delete', { contactIds: selectedContacts });
      toast.success('Contacts deleted');
      setSelectedContacts([]);
      loadData();
    } catch (error) {
      toast.error('Failed to delete contacts');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c) => c.id));
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

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="input w-48"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.contactCount})
                </option>
              ))}
            </select>

            {selectedContacts.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-danger flex items-center space-x-2">
                <Trash2 className="h-5 w-5" />
                <span>Delete ({selectedContacts.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No contacts yet</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                Add Your First Contact
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === contacts.length}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Tags</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">{contact.email}</td>
                      <td className="px-4 py-3">
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((ct: any) => (
                            <span
                              key={ct.tag.id}
                              className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
                            >
                              {ct.tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            contact.status === 'SUBSCRIBED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(contact)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit contact"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddContactModal
          tags={tags}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}

      {showEditModal && editingContact && (
        <EditContactModal
          contact={editingContact}
          tags={tags}
          onClose={() => {
            setShowEditModal(false);
            setEditingContact(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingContact(null);
            loadData();
          }}
        />
      )}

      {showImportModal && (
        <ImportCSVModal
          tags={tags}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadData();
          }}
        />
      )}
    </Layout>
  );
};

// Edit Contact Modal
const EditContactModal: React.FC<any> = ({ contact, tags, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    status: contact.status || 'SUBSCRIBED',
    tagIds: contact.tags.map((ct: any) => ct.tag.id) || [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/contacts/${contact.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        status: formData.status,
      });

      // Update tags if changed
      const currentTagIds = contact.tags.map((ct: any) => ct.tag.id);
      const addedTags = formData.tagIds.filter((id: string) => !currentTagIds.includes(id));
      const removedTags = currentTagIds.filter((id: string) => !formData.tagIds.includes(id));

      if (addedTags.length > 0) {
        await api.post(`/contacts/${contact.id}/tags`, { tagIds: addedTags });
      }

      if (removedTags.length > 0) {
        await api.post('/contacts/bulk-remove-tags', {
          contactIds: [contact.id],
          tagIds: removedTags,
        });
      }

      toast.success('Contact updated');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Edit Contact</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={contact.email}
              disabled
              className="input bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="SUBSCRIBED">Subscribed</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tags.map((tag: any) => (
                <label key={tag.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                      } else {
                        setFormData({
                          ...formData,
                          tagIds: formData.tagIds.filter((id: string) => id !== tag.id),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Updating...' : 'Update Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Contact Modal
const AddContactModal: React.FC<any> = ({ tags, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    tagIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/contacts', formData);
      toast.success('Contact added');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Add Contact</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tags.map((tag: any) => (
                <label key={tag.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                      } else {
                        setFormData({
                          ...formData,
                          tagIds: formData.tagIds.filter((id: string) => id !== tag.id),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import CSV Modal
const ImportCSVModal: React.FC<any> = ({ tags, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Parse and preview
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: (results) => {
          setPreview(results.data);
        },
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tagIds', JSON.stringify(selectedTags));

    try {
      const response = await api.post('/contacts/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success(`Imported ${response.data.imported} contacts`);
      if (response.data.failed > 0) {
        toast.error(`${response.data.failed} contacts failed`);
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold mb-4">Import Contacts from CSV</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              CSV should have columns: email (required), firstName, lastName
            </p>
          </div>

          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Preview (first 5 rows)</label>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((value: any, j) => (
                          <td key={j} className="px-3 py-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Assign Tags (Optional)</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tags.map((tag: any) => (
                <label key={tag.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
