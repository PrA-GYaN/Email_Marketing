import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import type { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetNewsletter from 'grapesjs-preset-newsletter';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface GrapesJSEmailEditorProps {
  value: string;
  onChange: (html: string, css: string) => void;
  height?: number | string;
  onReady?: (editor: Editor) => void;
}

export const GrapesJSEmailEditor: React.FC<GrapesJSEmailEditorProps> = ({
  value,
  onChange,
  height,
  onReady,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement>(null);
  const traitsRef = useRef<HTMLDivElement>(null);
  const stylesRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'settings' | 'styles' | 'layers'>('blocks');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (!editorRef.current || editor) return;
    if (!blocksRef.current || !traitsRef.current) return;

    // Initialize GrapesJS
    const grapesEditor = grapesjs.init({
      container: editorRef.current,
      height: '100%',
      width: 'auto',
      storageManager: false,
      fromElement: false,
      
      plugins: [gjsPresetNewsletter, gjsBlocksBasic],
      pluginsOpts: {
        [gjsPresetNewsletter as any]: {
          modalLabelImport: 'Paste your HTML here',
          modalLabelExport: 'Copy the code below',
          codeViewerTheme: 'material',
          importPlaceholder: '<div>Paste your HTML here</div>',
          cellStyle: {
            'font-size': '14px',
            'font-weight': '300',
            'vertical-align': 'top',
            color: 'rgb(111, 119, 125)',
            margin: 0,
            padding: 0,
          },
        },
        [gjsBlocksBasic as any]: {
          flexGrid: true,
          stylePrefix: 'gjs-',
          addBasicStyle: true,
          category: 'Basic',
        },
      },
      
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        ],
      },
      
      deviceManager: {
        devices: [
          {
            id: 'desktop',
            name: 'Desktop',
            width: '100%',
          },
          {
            id: 'tablet',
            name: 'Tablet',
            width: '768px',
          },
          {
            id: 'mobile',
            name: 'Mobile',
            width: '375px',
          },
        ],
      },
      
      panels: {
        defaults: [
          {
            id: 'basic-actions',
            el: '.panel__basic-actions',
            buttons: [
              {
                id: 'visibility',
                active: true,
                className: 'btn-toggle-borders',
                label: '👁',
                command: 'sw-visibility',
                attributes: { title: 'Toggle Borders' },
              },
            ],
          },
          {
            id: 'panel-devices',
            el: '.panel__devices',
            buttons: [
              {
                id: 'device-desktop',
                label: '🖥️',
                command: 'set-device-desktop',
                active: true,
                togglable: false,
                attributes: { title: 'Desktop' },
              },
              {
                id: 'device-tablet',
                label: '📱',
                command: 'set-device-tablet',
                togglable: false,
                attributes: { title: 'Tablet' },
              },
              {
                id: 'device-mobile',
                label: '📱',
                command: 'set-device-mobile',
                togglable: false,
                attributes: { title: 'Mobile' },
              },
            ],
          },
        ],
      },
      
      blockManager: {
        appendTo: blocksRef.current as HTMLElement,
        blocks: [],
      },
      
      layerManager: {
        appendTo: layersRef.current as HTMLElement,
      },
      
      traitManager: {
        appendTo: traitsRef.current as HTMLElement,
      },
      
      selectorManager: {
        appendTo: stylesRef.current as HTMLElement,
      },
      
      assetManager: {
        upload: false,
        uploadFile: async function (e: any) {
          const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
          const formData = new FormData();
          
          for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
          }

          try {
            const response = await api.post('/media/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const imageUrl = `${backendUrl}${response.data.url}`;
            
            const assetManager = grapesEditor.AssetManager;
            assetManager.add({
              src: imageUrl,
              name: files[0].name,
            });
            
            toast.success('Image uploaded successfully');
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
          }
        },
      },
      
      styleManager: {
        appendTo: stylesRef.current as HTMLElement,
        sectors: [
          {
            name: 'General',
            open: true,
            buildProps: ['background-color', 'color', 'font-family', 'font-size', 'font-weight', 'text-align'],
          },
          {
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
          },
          {
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-decoration'],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['border-radius', 'border', 'box-shadow', 'background'],
          },
        ],
      },
    });

    // Remove default GrapesJS panels and buttons
    const panelsToRemove = ['views', 'views-container'];
    panelsToRemove.forEach(panelId => {
      const panel = grapesEditor.Panels.getPanel(panelId);
      if (panel) {
        grapesEditor.Panels.removePanel(panelId);
      }
    });

    // Remove default buttons from panels
    const buttonsToRemove = [
    //   { panel: 'options', button: 'sw-visibility' },
    //   { panel: 'options', button: 'preview' },
    //   { panel: 'options', button: 'fullscreen' },
    //   { panel: 'options', button: 'export-template' },
    //   { panel: 'options', button: 'canvas-clear' },
    //   { panel: 'views', button: 'open-sm' },
    //   { panel: 'views', button: 'open-tm' },
      { panel: 'views', button: 'open-layers' },
      { panel: 'views', button: 'open-blocks' },
    ];
    
    buttonsToRemove.forEach(({ panel, button }) => {
      try {
        const panelObj = grapesEditor.Panels.getPanel(panel);
        if (panelObj) {
          const buttons = panelObj.get('buttons');
          if (buttons) {
            buttons.remove(button);
          }
        }
      } catch (e) {
        // Button or panel doesn't exist, ignore
      }
    });

    // Add custom commands
    grapesEditor.Commands.add('set-device-desktop', {
      run: (editor) => editor.setDevice('desktop'),
    });
    grapesEditor.Commands.add('set-device-tablet', {
      run: (editor) => editor.setDevice('tablet'),
    });
    grapesEditor.Commands.add('set-device-mobile', {
      run: (editor) => editor.setDevice('mobile'),
    });

    // Add custom email-specific blocks
    const blockManager = grapesEditor.BlockManager;
    
    // Section/Container Block
    blockManager.add('section', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">📦</div><div style="font-size: 11px;">Section</div></div>',
      category: 'Layout',
      content: {
        type: 'table',
        style: {
          width: '100%',
          'border-collapse': 'collapse',
        },
        components: [
          {
            type: 'row',
            components: [
              {
                type: 'cell',
                style: {
                  padding: '40px 20px',
                  'background-color': '#ffffff',
                },
                components: '<p>Drag blocks here to build your email section</p>',
              },
            ],
          },
        ],
      },
    });

    // Text Block
    blockManager.add('text', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">📝</div><div style="font-size: 11px;">Text</div></div>',
      category: 'Basic',
      content: {
        type: 'text',
        content: 'Insert your text here',
        style: {
          padding: '10px',
          'font-family': 'Arial, sans-serif',
          'font-size': '14px',
          color: '#333333',
        },
        traits: [
          {
            type: 'text',
            label: 'Content',
            name: 'content',
          },
        ],
      },
      activate: true,
    });

    // Heading Block
    blockManager.add('heading', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">📰</div><div style="font-size: 11px;">Heading</div></div>',
      category: 'Basic',
      content: {
        type: 'text',
        tagName: 'h2',
        content: 'Enter Heading',
        style: {
          padding: '10px',
          'font-family': 'Arial, sans-serif',
          'font-size': '24px',
          'font-weight': 'bold',
          color: '#333333',
        },
      },
    });

    // Button Block
    blockManager.add('button', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">🔘</div><div style="font-size: 11px;">Button</div></div>',
      category: 'Basic',
      content: {
        type: 'link',
        content: 'Click Here',
        style: {
          display: 'inline-block',
          padding: '12px 24px',
          'background-color': '#4F46E5',
          color: '#ffffff',
          'text-decoration': 'none',
          'border-radius': '5px',
          'font-family': 'Arial, sans-serif',
          'font-size': '16px',
          'font-weight': '600',
          margin: '10px',
        },
        attributes: {
          href: '#',
        },
        traits: [
          {
            type: 'text',
            label: 'Button Text',
            name: 'content',
          },
          {
            type: 'text',
            label: 'Link URL',
            name: 'href',
          },
        ],
      },
    });

    // Image Block
    blockManager.add('image', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">🖼️</div><div style="font-size: 11px;">Image</div></div>',
      category: 'Basic',
      content: {
        type: 'image',
        style: {
          width: '100%',
          'max-width': '600px',
          height: 'auto',
          display: 'block',
        },
        attributes: {
          src: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
          alt: 'Image',
        },
        traits: [
          {
            type: 'text',
            label: 'Image URL',
            name: 'src',
          },
          {
            type: 'text',
            label: 'Alt Text',
            name: 'alt',
          },
        ],
      },
    });

    // Divider Block
    blockManager.add('divider', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">➖</div><div style="font-size: 11px;">Divider</div></div>',
      category: 'Basic',
      content: {
        tagName: 'hr',
        style: {
          border: 'none',
          'border-top': '1px solid #e0e0e0',
          margin: '20px 0',
        },
      },
    });

    // Two Columns Block
    blockManager.add('two-columns', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">📊</div><div style="font-size: 11px;">2 Columns</div></div>',
      category: 'Layout',
      content: {
        type: 'table',
        style: {
          width: '100%',
          'border-collapse': 'collapse',
        },
        components: [
          {
            type: 'row',
            components: [
              {
                type: 'cell',
                style: {
                  width: '50%',
                  padding: '10px',
                  'vertical-align': 'top',
                },
                components: '<p>Column 1</p>',
              },
              {
                type: 'cell',
                style: {
                  width: '50%',
                  padding: '10px',
                  'vertical-align': 'top',
                },
                components: '<p>Column 2</p>',
              },
            ],
          },
        ],
      },
    });

    // Social Links Block
    blockManager.add('social-links', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">🔗</div><div style="font-size: 11px;">Social</div></div>',
      category: 'Components',
      content: `
        <div style="text-align: center; padding: 20px;">
          <a href="#" style="display: inline-block; margin: 0 10px;">
            <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" width="32" height="32" style="display: block;">
          </a>
          <a href="#" style="display: inline-block; margin: 0 10px;">
            <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" width="32" height="32" style="display: block;">
          </a>
          <a href="#" style="display: inline-block; margin: 0 10px;">
            <img src="https://img.icons8.com/color/48/000000/instagram-new.png" alt="Instagram" width="32" height="32" style="display: block;">
          </a>
          <a href="#" style="display: inline-block; margin: 0 10px;">
            <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" width="32" height="32" style="display: block;">
          </a>
        </div>
      `,
    });

    // Merge Tag / Personalization Block
    blockManager.add('merge-tag', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">👤</div><div style="font-size: 11px;">Personalize</div></div>',
      category: 'Components',
      content: {
        type: 'text',
        content: 'Hi {{FirstName}},',
        style: {
          padding: '10px',
          'font-family': 'Arial, sans-serif',
          'font-size': '14px',
        },
      },
    });

    // Unsubscribe Link Block
    blockManager.add('unsubscribe', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">✉️</div><div style="font-size: 11px;">Unsubscribe</div></div>',
      category: 'Components',
      content: {
        type: 'link',
        content: 'Unsubscribe from this list',
        style: {
          'text-align': 'center',
          padding: '10px',
          'font-size': '12px',
          color: '#999999',
          'text-decoration': 'underline',
          display: 'block',
        },
        attributes: {
          href: '{{UNSUBSCRIBE_LINK}}',
        },
      },
    });

    // PDF Content Block
    blockManager.add('pdf-content', {
      label: '<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 5px;">📄</div><div style="font-size: 11px;">PDF</div></div>',
      category: 'Components',
      content: {
        type: 'pdf-content',
        droppable: true,
        editable: true,
        style: {
          padding: '20px',
          'background-color': '#f9fafb',
          border: '2px dashed #d1d5da',
          'border-radius': '8px',
          'text-align': 'center',
        },
        components: [
          {
            type: 'text',
            content: '📄 Click settings to choose PDF display mode and upload',
            style: {
              color: '#6b7280',
              'font-size': '14px',
            },
          },
        ],
      },
    });

    // Define PDF Content Component Type
    grapesEditor.DomComponents.addType('pdf-content', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          editable: true,
          attributes: {
            'data-pdf-mode': 'parsed', // Default mode
          },
          traits: [
            {
              type: 'select',
              label: 'Display Mode',
              name: 'data-pdf-mode',
              options: [
                { id: 'parsed', name: 'Parsed (Editable HTML)' },
                { id: 'direct', name: 'Direct (Original Layout)' },
              ],
            },
            {
              type: 'button',
              label: 'Upload PDF',
              name: 'upload-pdf',
              text: 'Upload & Process PDF',
              full: true,
              command: (editor: Editor) => {
                // Create hidden file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/pdf';
                
                input.onchange = async (e: any) => {
                  const file = e.target?.files?.[0];
                  if (!file) return;

                  // Get the selected component and its mode
                  const selected = editor.getSelected();
                  if (!selected) return;

                  const mode = selected.getAttributes()['data-pdf-mode'] || 'parsed';

                  // Show loading toast
                  const loadingToast = toast.loading(
                    mode === 'direct' 
                      ? 'Converting PDF to images...' 
                      : 'Extracting PDF content...'
                  );

                  try {
                    // Upload PDF to media storage
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadResponse = await api.post('/media/upload', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                    });

                    const fileId = uploadResponse.data.id;

                    // Extract or convert PDF based on mode
                    const extractResponse = await api.get(`/media/pdf/extract/${fileId}?mode=${mode}`);
                    
                    if (mode === 'direct') {
                      // Direct mode: convert PDF pages to images
                      const { pages, metadata } = extractResponse.data;
                      
                      // Create HTML with stacked images
                      let html = '<div class="pdf-direct-content" style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px; border-radius: 8px;">\n';
                      
                      if (metadata.title) {
                        html += `  <h2 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px; text-align: center;">${metadata.title}</h2>\n`;
                      }
                      
                      html += '  <div class="pdf-pages" style="display: flex; flex-direction: column; gap: 20px; align-items: center;">\n';
                      
                      for (const page of pages) {
                        html += `    <div class="pdf-page" style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; max-width: 100%;">\n`;
                        html += `      <img src="${page.imageData}" alt="PDF Page ${page.pageNumber}" style="display: block; width: 100%; height: auto; max-width: 800px;" />\n`;
                        html += `    </div>\n`;
                      }
                      
                      html += '  </div>\n';
                      html += `  <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">${metadata.pages} page(s)</p>\n`;
                      html += '</div>';

                      selected.components(html);
                      selected.setStyle({
                        padding: '0',
                        'background-color': 'transparent',
                        border: 'none',
                      });

                      selected.addAttributes({
                        'data-pdf-file-id': fileId,
                        'data-pdf-mode': 'direct',
                        'data-pdf-pages': metadata.pages || 0,
                      });

                      toast.success(`PDF converted! (${metadata.pages} pages as images)`, {
                        id: loadingToast,
                      });
                    } else {
                      // Parsed mode: extract to HTML (original behavior)
                      const { html, metadata } = extractResponse.data;

                      selected.components(html);
                      
                      selected.setStyle({
                        padding: '20px',
                        'background-color': '#ffffff',
                        border: '1px solid #e5e7eb',
                        'border-radius': '8px',
                        'font-family': 'Arial, sans-serif',
                        'line-height': '1.6',
                      });

                      selected.addAttributes({
                        'data-pdf-file-id': fileId,
                        'data-pdf-mode': 'parsed',
                        'data-pdf-title': metadata.title || 'PDF Content',
                        'data-pdf-pages': metadata.pages || 0,
                      });

                      toast.success(`PDF extracted successfully! (${metadata.pages} pages)`, {
                        id: loadingToast,
                      });
                    }
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || 'Failed to process PDF',
                      { id: loadingToast }
                    );
                  }
                };

                input.click();
              },
            },
            {
              type: 'button',
              label: 'Select Existing PDF',
              name: 'select-pdf',
              text: 'Select from Library',
              full: true,
              command: async (editor: Editor) => {
                const loadingToast = toast.loading('Loading PDF library...');

                try {
                  // Fetch all PDF files from media library
                  const response = await api.get('/media/files');
                  const pdfFiles = response.data.filter(
                    (file: any) => file.mimeType === 'application/pdf'
                  );

                  toast.dismiss(loadingToast);

                  if (pdfFiles.length === 0) {
                    toast.error('No PDF files found in library');
                    return;
                  }

                  // Create a modal to select PDF
                  const modal = document.createElement('div');
                  modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                  `;

                  const modalContent = document.createElement('div');
                  modalContent.style.cssText = `
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                  `;

                  let html = '<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Select PDF from Library</h2>';
                  html += '<div style="display: grid; gap: 12px;">';

                  for (const file of pdfFiles) {
                    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                    html += `
                      <div class="pdf-item" data-file-id="${file.id}" style="
                        padding: 16px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.15s;
                      ">
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <div style="font-size: 32px;">📄</div>
                          <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${file.name}</div>
                            <div style="font-size: 13px; color: #6b7280;">${sizeInMB} MB</div>
                          </div>
                        </div>
                      </div>
                    `;
                  }

                  html += '</div>';
                  html += '<button id="close-modal" style="margin-top: 16px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">Cancel</button>';

                  modalContent.innerHTML = html;
                  modal.appendChild(modalContent);
                  document.body.appendChild(modal);

                  // Handle PDF selection
                  const pdfItems = modalContent.querySelectorAll('.pdf-item');
                  pdfItems.forEach((item) => {
                    item.addEventListener('mouseenter', () => {
                      (item as HTMLElement).style.borderColor = '#3b82f6';
                      (item as HTMLElement).style.background = '#eff6ff';
                    });
                    item.addEventListener('mouseleave', () => {
                      (item as HTMLElement).style.borderColor = '#e5e7eb';
                      (item as HTMLElement).style.background = 'transparent';
                    });
                    item.addEventListener('click', async () => {
                      const fileId = (item as HTMLElement).dataset.fileId;
                      document.body.removeChild(modal);

                      const selected = editor.getSelected();
                      if (!selected) return;

                      const mode = selected.getAttributes()['data-pdf-mode'] || 'parsed';

                      const extractToast = toast.loading(
                        mode === 'direct' 
                          ? 'Converting PDF to images...' 
                          : 'Extracting PDF content...'
                      );

                      try {
                        const extractResponse = await api.get(`/media/pdf/extract/${fileId}?mode=${mode}`);
                        
                        if (mode === 'direct') {
                          // Direct mode: convert PDF pages to images
                          const { pages, metadata } = extractResponse.data;
                          
                          // Create HTML with stacked images
                          let pdfHtml = '<div class="pdf-direct-content" style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px; border-radius: 8px;">\n';
                          
                          if (metadata.title) {
                            pdfHtml += `  <h2 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px; text-align: center;">${metadata.title}</h2>\n`;
                          }
                          
                          pdfHtml += '  <div class="pdf-pages" style="display: flex; flex-direction: column; gap: 20px; align-items: center;">\n';
                          
                          for (const page of pages) {
                            pdfHtml += `    <div class="pdf-page" style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; max-width: 100%;">\n`;
                            pdfHtml += `      <img src="${page.imageData}" alt="PDF Page ${page.pageNumber}" style="display: block; width: 100%; height: auto; max-width: 800px;" />\n`;
                            pdfHtml += `    </div>\n`;
                          }
                          
                          pdfHtml += '  </div>\n';
                          pdfHtml += `  <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">${metadata.pages} page(s)</p>\n`;
                          pdfHtml += '</div>';

                          selected.components(pdfHtml);
                          selected.setStyle({
                            padding: '0',
                            'background-color': 'transparent',
                            border: 'none',
                          });

                          selected.addAttributes({
                            'data-pdf-file-id': fileId,
                            'data-pdf-mode': 'direct',
                            'data-pdf-pages': metadata.pages || 0,
                          });

                          toast.success(`PDF converted! (${metadata.pages} pages as images)`, {
                            id: extractToast,
                          });
                        } else {
                          // Parsed mode: extract to HTML
                          const { html: pdfHtml, metadata } = extractResponse.data;

                          selected.components(pdfHtml);
                          selected.setStyle({
                            padding: '20px',
                            'background-color': '#ffffff',
                            border: '1px solid #e5e7eb',
                            'border-radius': '8px',
                            'font-family': 'Arial, sans-serif',
                            'line-height': '1.6',
                          });

                          selected.addAttributes({
                            'data-pdf-file-id': fileId,
                            'data-pdf-mode': 'parsed',
                            'data-pdf-title': metadata.title || 'PDF Content',
                            'data-pdf-pages': metadata.pages || 0,
                          });

                          toast.success(`PDF extracted! (${metadata.pages} pages)`, {
                            id: extractToast,
                          });
                        }
                      } catch (error: any) {
                        toast.error(
                          error.response?.data?.message || 'Failed to process PDF',
                          { id: extractToast }
                        );
                      }
                    });
                  });

                  // Close modal
                  const closeBtn = modalContent.querySelector('#close-modal');
                  closeBtn?.addEventListener('click', () => {
                    document.body.removeChild(modal);
                  });
                  modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                      document.body.removeChild(modal);
                    }
                  });
                } catch (error: any) {
                  toast.error('Failed to load PDF library', { id: loadingToast });
                }
              },
            },
          ],
        },
      },
    });

    // Listen to changes
    grapesEditor.on('update', () => {
      if (isReady) {
        const html = grapesEditor.getHtml() || '';
        const css = grapesEditor.getCss() || '';
        onChange(html, css);
      }
    });

    // Listen for preview mode changes
    grapesEditor.on('run:preview', () => {
      setIsPreviewMode(true);
    });

    grapesEditor.on('stop:preview', () => {
      setIsPreviewMode(false);
    });

    setEditor(grapesEditor);
    setIsReady(true);
    
    if (onReady) {
      onReady(grapesEditor);
    }

    return () => {
      if (grapesEditor) {
        grapesEditor.destroy();
      }
    };
  }, []);

  // Load content when value changes
  useEffect(() => {
    if (editor && value && isReady) {
      const currentHtml = editor.getHtml();
      if (currentHtml !== value) {
        editor.setComponents(value);
      }
    }
  }, [editor, value, isReady]);

  return (
    <div className="grapesjs-canvas-left-editor">
      <style>
        {`
          .grapesjs-canvas-left-editor {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            height: ${height ? (typeof height === 'number' ? `${height}px` : height) : '100%'};
            min-height: ${height ? (typeof height === 'number' ? `${height}px` : height) : '600px'};
            display: flex;
            flex-direction: column;
            background: #f6f8fa;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }
          
          /* Top Toolbar */
          .canvas-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            background: #ffffff;
            border-bottom: 1px solid #e1e4e8;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            z-index: 1;
            gap: 12px;
            flex-shrink: 0;
          }
          
          .canvas-toolbar.hidden {
            display: none;
          }
          
          .toolbar-section {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          
          .toolbar-title {
            font-size: 14px;
            font-weight: 600;
            color: #24292e;
            margin-right: 12px;
          }
          
          .panel__basic-actions,
          .panel__devices {
            display: flex;
            gap: 6px;
          }
          
          .panel__basic-actions button,
          .panel__devices button {
            padding: 5px 10px;
            border: 1px solid #d1d5da;
            background: #fafbfc;
            cursor: pointer;
            border-radius: 6px;
            font-size: 15px;
            transition: all 0.15s ease;
            min-width: 32px;
            line-height: 18px;
          }
          
          .panel__basic-actions button:hover,
          .panel__devices button:hover {
            background: #f3f4f6;
            border-color: #959da5;
          }
          
          .panel__devices button.gjs-pn-active {
            background: #0366d6;
            color: white;
            border-color: #0366d6;
          }
          
          .toggle-panel-btn {
            padding: 6px 12px;
            background: #0366d6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.15s ease;
          }
          
          .toggle-panel-btn:hover {
            background: #0256c7;
          }
          
          /* Main Workspace */
          .canvas-workspace {
            display: flex;
            flex: 1;
            overflow: hidden;
            min-height: 0;
          }
          
          .canvas-workspace.preview-mode {
            background: #ffffff;
          }
          
          .canvas-workspace.preview-mode .controls-panel {
            display: none;
          }
          
          /* Canvas Area (Left Side) */
          .canvas-main-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #f6f8fa;
            overflow: hidden;
            position: relative;
            min-height: 0;
          }
          
          .canvas-container {
            flex: 1;
            overflow: auto;
            padding: 20px;
            min-height: 0;
          }
          
          /* Ensure GrapesJS editor fills container */
          .canvas-container > div {
            min-height: 100%;
          }
          
          .canvas-container::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          .canvas-container::-webkit-scrollbar-track {
            background: #f1f3f5;
          }
          
          .canvas-container::-webkit-scrollbar-thumb {
            background: #d1d5da;
            border-radius: 5px;
          }
          
          .canvas-container::-webkit-scrollbar-thumb:hover {
            background: #959da5;
          }
          
          /* Right Controls Panel */
          .controls-panel {
            width: 340px;
            background: #ffffff;
            border-left: 1px solid #e1e4e8;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: width 0.3s ease, margin-right 0.3s ease;
          }
          
          .controls-panel.collapsed {
            width: 0;
            margin-right: -340px;
            border-left: none;
          }
          
          /* Tab Navigation */
          .panel-tabs {
            display: flex;
            background: #fafbfc;
            border-bottom: 2px solid #e1e4e8;
            overflow-x: auto;
            flex-shrink: 0;
          }
          
          .panel-tabs::-webkit-scrollbar {
            height: 3px;
          }
          
          .panel-tabs::-webkit-scrollbar-thumb {
            background: #d1d5da;
            border-radius: 2px;
          }
          
          .panel-tab {
            flex: 1;
            min-width: 80px;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            color: #586069;
            transition: all 0.15s ease;
            text-align: center;
            white-space: nowrap;
          }
          
          .panel-tab:hover {
            background: #f6f8fa;
            color: #24292e;
          }
          
          .panel-tab.active {
            color: #0366d6;
            background: #ffffff;
            border-bottom-color: #0366d6;
          }
          
          .panel-tab-icon {
            font-size: 16px;
            margin-right: 6px;
          }
          
          /* Tab Content Area */
          .panel-content-area {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            background: #ffffff;
          }
          
          .panel-content-area::-webkit-scrollbar {
            width: 8px;
          }
          
          .panel-content-area::-webkit-scrollbar-track {
            background: #f6f8fa;
          }
          
          .panel-content-area::-webkit-scrollbar-thumb {
            background: #d1d5da;
            border-radius: 4px;
          }
          
          .panel-content-area::-webkit-scrollbar-thumb:hover {
            background: #959da5;
          }
          
          .tab-pane {
            display: none;
            padding: 16px;
            min-height: 100%;
          }
          
          .tab-pane.active {
            display: block;
          }
          
          .panel-section-title {
            font-size: 11px;
            font-weight: 600;
            color: #6a737d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e1e4e8;
          }
          
          /* GrapesJS Element Customization */
          .gjs-one-bg {
            background-color: #ffffff;
          }
          
          .gjs-two-color {
            color: #0366d6;
          }
          
          .gjs-three-bg {
            background-color: #0366d6;
            color: white;
          }
          
          .gjs-four-color,
          .gjs-four-color-h:hover {
            color: #0366d6;
          }
          
          /* Blocks Styling */
          .gjs-block {
            width:20%;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 10px;
            margin: 0 0 10px 0;
            background: #fafbfc;
            transition: all 0.2s ease;
            cursor: move;
            min-height: 55px;
          }
          
          .gjs-block:hover {
            border-color: #0366d6;
            background: #f1f8ff;
            box-shadow: 0 2px 8px rgba(3, 102, 214, 0.1);
            transform: translateY(-1px);
          }
          
          .gjs-block.gjs-block-selected {
            border-color: #0366d6;
            background: #f1f8ff;
            box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.15);
          }
          
          .gjs-block-label {
            font-size: 11px;
            line-height: 1.3;
            color: #24292e;
            font-weight: 500;
          }
          
          .gjs-block__media {
            margin-bottom: 5px;
          }
          
          .gjs-block-category {
            margin-bottom: 8px;
          }
          
          .gjs-block-category .gjs-title {
            font-size: 10px;
            font-weight: 600;
            padding: 6px 12px;
            margin: 0 0 8px 0;
            background: #f6f8fa;
            border-radius: 4px;
            color: #6a737d;
            text-transform: uppercase;
            letter-spacing: 0.7px;
          }
          
          .gjs-blocks-c {
            padding: 0;
          }
          
          /* Toolbar Styling */
          .gjs-toolbar {
            background-color: #0366d6;
            border-radius: 4px;
          }
          
          .gjs-toolbar-item {
            color: white;
          }
          
          /* Form Fields */
          .gjs-field {
            margin-bottom: 14px;
          }
          
          .gjs-field-label {
            font-size: 11px;
            font-weight: 600;
            color: #586069;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
          }
          
          .gjs-field input,
          .gjs-field select,
          .gjs-field textarea {
            width: 100%;
            padding: 7px 10px;
            border: 1px solid #d1d5da;
            border-radius: 6px;
            font-size: 13px;
            background: #fafbfc;
            transition: all 0.15s ease;
          }
          
          .gjs-field input:focus,
          .gjs-field select:focus,
          .gjs-field textarea:focus {
            border-color: #0366d6;
            background: #ffffff;
            outline: none;
            box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
          }
          
          /* Style Manager */
          .gjs-sm-sector {
            border-bottom: 1px solid #e1e4e8;
          }
          
          .gjs-sm-sector-title {
            font-size: 11px;
            font-weight: 600;
            padding: 10px 12px;
            background: #f6f8fa;
            cursor: pointer;
            user-select: none;
            transition: background 0.15s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #586069;
          }
          
          .gjs-sm-sector-title:hover {
            background: #f1f3f5;
          }
          
          .gjs-sm-properties {
            padding: 12px;
            background: #ffffff;
          }
          
          /* Layers */
          .gjs-layer {
            font-size: 12px;
            padding: 6px 12px;
            transition: background 0.15s ease;
          }
          
          .gjs-layer:hover {
            background: #f6f8fa;
          }
          
          .gjs-layer-selected {
            background: #f1f8ff;
            color: #0366d6;
          }
          
          .gjs-layer-title {
            font-size: 12px;
          }
          
          /* Canvas */
          .gjs-cv-canvas {
            background: #ffffff;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border-radius: 8px;
            height: auto !important;
            min-height: 100%;
          }
          
          .gjs-cv-canvas__frames {
            border-radius: 8px;
            overflow: visible !important;
            height: auto !important;
          }
          
          /* Fix GrapesJS frame container */
          .gjs-frame {
            height: auto !important;
            min-height: 600px;
          }
          
          /* Ensure canvas wrapper doesn't restrict height */
          #gjs {
            height: 100% !important;
          }
          
          /* Fix GrapesJS panels in preview mode */
          .gjs-pn-panels {
            z-index: 1;
          }
          
          /* Ensure editor wrapper fills height */
          .gjs-editor {
            height: 100% !important;
            display: flex;
            flex-direction: column;
          }
          
          /* Remove fixed height from GrapesJS canvas wrapper */
          .gjs-cv-canvas-bg {
            height: auto !important;
          }
          
          /* Override any inline height styles on GrapesJS elements */
          .gjs-frame-wrapper {
            height: auto !important;
            min-height: 600px;
          }
          
          /* Responsive Design */
          @media (max-width: 1280px) {
            .controls-panel {
              width: 300px;
            }
            
            .controls-panel.collapsed {
              margin-right: -300px;
            }
          }
          
          @media (max-width: 1024px) {
            .grapesjs-canvas-left-editor {
              min-height: 500px;
            }
            
            .controls-panel {
              width: 280px;
            }
            
            .controls-panel.collapsed {
              margin-right: -280px;
            }
            
            .canvas-container {
              padding: 12px;
            }
          }
          
          @media (max-width: 768px) {
            .grapesjs-canvas-left-editor {
              min-height: 400px;
            }
            
            .canvas-workspace {
              flex-direction: column;
            }
            
            .controls-panel {
              width: 100%;
              border-left: none;
              border-top: 1px solid #e1e4e8;
              height: 300px;
              max-height: 50vh;
            }
            
            .controls-panel.collapsed {
              height: 0;
              margin-right: 0;
              margin-bottom: -300px;
            }
            
            .canvas-container {
              padding: 8px;
            }
            
            .panel-tabs {
              overflow-x: auto;
            }
            
            .panel-tab {
              min-width: 70px;
              padding: 10px 12px;
              font-size: 11px;
            }
          }
        `}
      </style>
      
      {/* Top Toolbar */}
      <div className={`canvas-toolbar ${isPreviewMode ? 'hidden' : ''}`}>
        <div className="toolbar-section">
          <span className="toolbar-title">✉️ Email Builder</span>
          <div className="panel__basic-actions"></div>
        </div>
        <div className="toolbar-section">
          <div className="panel__devices"></div>
          <button 
            className="toggle-panel-btn"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            title={isPanelOpen ? 'Hide Controls' : 'Show Controls'}
          >
            {isPanelOpen ? '→ Hide' : '← Show'}
          </button>
        </div>
      </div>
      
      {/* Main Workspace */}
      <div className={`canvas-workspace ${isPreviewMode ? 'preview-mode' : ''}`}>
        {/* Canvas Area (Left Side - Takes Most Space) */}
        <div className="canvas-main-area">
          <div className="canvas-container">
            <div ref={editorRef} />
          </div>
        </div>
        
        {/* Right Controls Panel */}
        <div className={`controls-panel ${isPanelOpen ? '' : 'collapsed'}`}>
          {/* Tabs */}
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === 'blocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('blocks')}
            >
              <span className="panel-tab-icon">📦</span>
              Blocks
            </button>
            <button
              className={`panel-tab ${activeTab === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              <span className="panel-tab-icon">🗂️</span>
              Layers
            </button>
            <button
              className={`panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="panel-tab-icon">⚙️</span>
              Settings
            </button>
            <button
              className={`panel-tab ${activeTab === 'styles' ? 'active' : ''}`}
              onClick={() => setActiveTab('styles')}
            >
              <span className="panel-tab-icon">🎨</span>
              Styles
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="panel-content-area">
            {/* Blocks Tab */}
            <div className={`tab-pane ${activeTab === 'blocks' ? 'active' : ''}`}>
              <div className="panel-section-title">Drag & Drop Blocks</div>
              <div ref={blocksRef}></div>
            </div>
            
            {/* Layers Tab */}
            <div className={`tab-pane ${activeTab === 'layers' ? 'active' : ''}`}>
              <div className="panel-section-title">Component Structure</div>
              <div ref={layersRef}></div>
            </div>
            
            {/* Settings Tab */}
            <div className={`tab-pane ${activeTab === 'settings' ? 'active' : ''}`}>
              <div className="panel-section-title">Component Properties</div>
              <div ref={traitsRef}></div>
            </div>
            
            {/* Styles Tab */}
            <div className={`tab-pane ${activeTab === 'styles' ? 'active' : ''}`}>
              <div className="panel-section-title">Style Manager</div>
              <div ref={stylesRef}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrapesJSEmailEditor;
