import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  height = 500,
}) => {
  const editorRef = useRef<any>(null);

  // Custom file upload handler for TinyMCE
  const handleImageUpload = (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        const response = await api.post('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              progress(percentCompleted);
            }
          },
        });

        // Return the full URL to the uploaded image
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const imageUrl = `${backendUrl}${response.data.url}`;
        resolve(imageUrl);
      } catch (error: any) {
        reject(error.response?.data?.message || 'Failed to upload image');
        toast.error('Failed to upload image');
      }
    });
  };

  return (
    <Editor
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
      onInit={(_evt: any, editor: any) => editorRef.current = editor}
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
          'emoticons', 'template', 'codesample'
        ],
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        
        // Image upload configuration
        images_upload_handler: handleImageUpload,
        automatic_uploads: true,
        images_reuse_filename: true,
        
        // File and media picker
        file_picker_types: 'image media',
        file_picker_callback: (callback: any, _value: any, meta: any) => {
          // Create file input on the fly
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          
          if (meta.filetype === 'image') {
            input.setAttribute('accept', 'image/*');
          } else if (meta.filetype === 'media') {
            input.setAttribute('accept', 'video/*,audio/*');
          }

          input.onchange = async function () {
            const fileInput = this as HTMLInputElement;
            const file = fileInput.files?.[0];
            if (!file) return;

            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await api.post('/media/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
              const fileUrl = `${backendUrl}${response.data.url}`;
              
              callback(fileUrl, { alt: file.name });
              toast.success('File uploaded successfully');
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to upload file');
            }
          };

          input.click();
        },

        // Merge tags menu
        setup: (editor: any) => {
          editor.ui.registry.addMenuButton('mergetags', {
            text: 'Merge Tags',
            fetch: (callback: any) => {
              const items = [
                {
                  type: 'menuitem',
                  text: 'First Name',
                  onAction: () => editor.insertContent('{FirstName}'),
                },
                {
                  type: 'menuitem',
                  text: 'Last Name',
                  onAction: () => editor.insertContent('{LastName}'),
                },
                {
                  type: 'menuitem',
                  text: 'Full Name',
                  onAction: () => editor.insertContent('{Full Name}'),
                },
                {
                  type: 'menuitem',
                  text: 'Email',
                  onAction: () => editor.insertContent('{Email}'),
                },
                {
                  type: 'menuitem',
                  text: 'Unsubscribe Link',
                  onAction: () => editor.insertContent('{{UNSUBSCRIBE_LINK}}'),
                },
              ];
              callback(items);
            },
          });

          // Add toolbar with merge tags button
          editor.ui.registry.addButton('mergetags', {
            text: 'Merge Tags',
            onAction: () => {
              editor.execCommand('mceFocus');
            },
          });
        },
      }}
    />
  );
};
