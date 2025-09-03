'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Plus, FileText, Video, Image, FileIcon, Trash2, ArrowLeft, Edit3, Upload, Link, FormInput } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  order_index: number;
  is_required: boolean;
  duration?: number;
  metadata?: any;
  file_path?: string;
  file_name?: string;
  file_size?: number;
}

type ContentType = 'text' | 'video' | 'pdf' | 'form';

interface ContentFormData {
  title: string;
  description: string;
  content_type: ContentType;
  isRequired: boolean;
  // Text content
  content?: string;
  // Video content
  videoId?: string;
  videoUrl?: string;
  // Form content
  formUrl?: string;
  // Duration
  duration?: string;
}

export default function LessonContentPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  
  const [userToken, setUserToken] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/auth');
      return;
    }

    setUserToken(token);
    loadContentItems(token);
  }, [lessonId]);

  const loadContentItems = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/cms/lessons/${lessonId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContentItems(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContent = async (formData: ContentFormData) => {
    try {
      let response;
      const isEditing = !!editingContent;
      
      if (formData.content_type === 'text') {
        // Text content
        const endpoint = isEditing 
          ? `http://localhost:3001/api/cms/content/${editingContent.id}/text`
          : `http://localhost:3001/api/cms/lessons/${lessonId}/content/text`;
        
        response = await fetch(endpoint, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            contentType: 'text',
            metadata: { content: formData.content },
            isRequired: formData.isRequired,
            duration: formData.duration ? parseInt(formData.duration) : null,
          }),
        });
      } else if (formData.content_type === 'video') {
        // Video content
        let videoId = formData.videoId;
        if (formData.videoUrl && !videoId) {
          // Extract video ID from YouTube URL
          const match = formData.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
          videoId = match ? match[1] : '';
        }
        
        if (isEditing) {
          // For editing, use the general content endpoint without file
          response = await fetch(`http://localhost:3001/api/cms/content/${editingContent.id}/text`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              contentType: 'video',
              content_type: 'video',
              metadata: { 
                videoId: videoId,
                contentUrl: formData.videoUrl,
                duration: formData.duration 
              },
              isRequired: formData.isRequired,
              duration: formData.duration ? parseInt(formData.duration) : null,
            }),
          });
        } else {
          // For creating new video content, use general endpoint with FormData
          const formDataToSend = new FormData();
          formDataToSend.append('contentData', JSON.stringify({
            title: formData.title,
            description: formData.description,
            contentType: 'video',
            metadata: { 
              videoId: videoId,
              contentUrl: formData.videoUrl,
              duration: formData.duration 
            },
            isRequired: formData.isRequired,
            duration: formData.duration ? parseInt(formData.duration) : null,
          }));
          
          response = await fetch(`http://localhost:3001/api/cms/lessons/${lessonId}/content`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
            body: formDataToSend,
          });
        }
      } else if (formData.content_type === 'form') {
        // Form content
        if (isEditing) {
          // For editing, use the text endpoint
          response = await fetch(`http://localhost:3001/api/cms/content/${editingContent.id}/text`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              contentType: 'form',
              content_type: 'form',
              metadata: { formUrl: formData.formUrl },
              isRequired: formData.isRequired,
            }),
          });
        } else {
          // For creating new form content, use general endpoint with FormData
          const formDataToSend = new FormData();
          formDataToSend.append('contentData', JSON.stringify({
            title: formData.title,
            description: formData.description,
            contentType: 'form',
            metadata: { formUrl: formData.formUrl },
            isRequired: formData.isRequired,
          }));
          
          response = await fetch(`http://localhost:3001/api/cms/lessons/${lessonId}/content`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
            body: formDataToSend,
          });
        }
      } else if (formData.content_type === 'pdf') {
        // PDF file upload
        if (isEditing && !selectedFile) {
          // Editing without new file - use text endpoint
          response = await fetch(`http://localhost:3001/api/cms/content/${editingContent.id}/text`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              contentType: 'pdf',
              isRequired: formData.isRequired,
            }),
          });
        } else if (selectedFile) {
          // Has file to upload
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFile);
          uploadFormData.append('contentData', JSON.stringify({
            title: formData.title,
            description: formData.description,
            contentType: 'pdf',
            isRequired: formData.isRequired,
          }));

          const endpoint = isEditing 
            ? `http://localhost:3001/api/cms/content/${editingContent.id}`
            : `http://localhost:3001/api/cms/lessons/${lessonId}/content`;

          response = await fetch(endpoint, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
            body: uploadFormData,
          });
        } else {
          throw new Error('PDF file is required');
        }
      }

      if (!response || !response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${isEditing ? 'update' : 'add'} content: ${errorText}`);
      }

      await loadContentItems(userToken!);
      setShowContentModal(false);
      setEditingContent(null);
      setSelectedFile(null);
    } catch (error) {
      console.error(`Error ${editingContent ? 'updating' : 'adding'} content:`, error);
      alert(`Failed to ${editingContent ? 'update' : 'add'} content`);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    
    try {
      // Note: This endpoint would need to be implemented in the backend
      const response = await fetch(`http://localhost:3001/api/cms/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      await loadContentItems(userToken!);
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const openEditModal = (content: ContentItem) => {
    setEditingContent(content);
    setShowContentModal(true);
  };

  const openAddModal = () => {
    setEditingContent(null);
    setShowContentModal(true);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-600" />;
      case 'text':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pdf':
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case 'form':
        return <FormInput className="h-5 w-5 text-purple-600" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'text': return 'Text/Markdown';
      case 'pdf': return 'PDF Document';
      case 'form': return 'Google Form';
      default: return type;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course Editor
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Lesson Content Manager</h1>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Content
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {contentItems.length > 0 ? (
            <div className="space-y-3">
              {contentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4">
                    {getContentIcon(item.content_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                          {getContentTypeLabel(item.content_type)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      {item.content_type === 'video' && item.metadata?.videoId && (
                        <p className="text-xs text-gray-500 mt-1">Video ID: {item.metadata.videoId}</p>
                      )}
                      {item.content_type === 'pdf' && item.file_path && (
                        <div className="text-xs text-gray-500 mt-1">
                          <p>File: {item.file_name}</p>
                          <a 
                            href={`http://localhost:3001/api/cms/files/${item.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View PDF
                          </a>
                        </div>
                      )}
                      {item.content_type === 'form' && item.metadata?.formUrl && (
                        <p className="text-xs text-gray-500 mt-1">Form URL: {item.metadata.formUrl}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {item.is_required && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Required</span>
                    )}
                    <span className="text-sm text-gray-500">#{item.order_index}</span>
                    
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit content"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete content"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content items yet</h3>
              <p className="text-gray-600 mb-4">Add your first content item to get started.</p>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Content
              </button>
            </div>
          )}
        </div>

        {/* Content Modal */}
        {showContentModal && (
          <ContentModal
            isEdit={!!editingContent}
            content={editingContent}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onSubmit={handleSubmitContent}
            onClose={() => {
              setShowContentModal(false);
              setEditingContent(null);
              setSelectedFile(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Separate Content Modal Component
function ContentModal({
  isEdit,
  content,
  selectedFile,
  setSelectedFile,
  onSubmit,
  onClose
}: {
  isEdit: boolean;
  content: ContentItem | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onSubmit: (data: ContentFormData) => void;
  onClose: () => void;
}) {
  const [contentType, setContentType] = useState<ContentType>(content?.content_type as ContentType || 'text');
  const [formData, setFormData] = useState({
    title: content?.title || '',
    description: content?.description || '',
    isRequired: content?.is_required ?? true,
    content: content?.metadata?.content || '',
    videoId: content?.metadata?.videoId || '',
    videoUrl: content?.metadata?.contentUrl || '',
    formUrl: content?.metadata?.formUrl || '',
    duration: content?.duration?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      content_type: contentType,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Content' : 'Add Content'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Type * {isEdit && <span className="text-sm text-gray-500">(cannot be changed)</span>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'text', label: 'Text/Markdown', icon: FileText, desc: 'Rich text content with markdown formatting' },
                  { value: 'video', label: 'YouTube Video', icon: Video, desc: 'Embed YouTube videos' },
                  { value: 'pdf', label: 'PDF Document', icon: Upload, desc: 'Upload PDF files' },
                  { value: 'form', label: 'Google Form', icon: FormInput, desc: 'Embed Google Forms for surveys' },
                ].map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      disabled={isEdit}
                      onClick={() => !isEdit && setContentType(type.value as ContentType)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        contentType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        isEdit ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="h-5 w-5" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Content Type Specific Fields */}
            {contentType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content * (Markdown supported)
                </label>
                <textarea
                  required
                  rows={10}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your content in markdown format...

**Example:**
# Heading
- List item
**Bold text**
[Link](https://example.com)"
                />
              </div>
            )}

            {contentType === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or Video ID
                  </label>
                  <input
                    type="text"
                    value={formData.videoId}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="dQw4w9WgXcQ"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you provide a URL above, the Video ID will be extracted automatically
                  </p>
                </div>
              </div>
            )}

            {contentType === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File {!isEdit && '*'} {isEdit && '(optional - leave empty to keep existing file)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  required={!isEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
                {isEdit && content && content.file_name && !selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Current file: {content.file_name}
                  </p>
                )}
              </div>
            )}

            {contentType === 'form' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Form URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.formUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, formUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://docs.google.com/forms/d/e/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the shareable link from your Google Form
                </p>
              </div>
            )}

            {/* Required Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                This content is required
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isEdit ? 'Update Content' : 'Add Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
