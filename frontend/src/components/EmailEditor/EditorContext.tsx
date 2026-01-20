import { create } from 'zustand';
import { TReaderDocument } from '@usewaypoint/email-builder';

type EditorState = {
  document: TReaderDocument;
  selectedBlockId: string | null;
};

export const useEditorStore = create<EditorState>(() => ({
  document: getDefaultDocument(),
  selectedBlockId: null,
}));

export function getDefaultDocument(): TReaderDocument {
  return {
    root: {
      type: 'EmailLayout',
      data: {
        backdropColor: '#F8F8F8',
        canvasColor: '#FFFFFF',
        textColor: '#242424',
        fontFamily: 'MODERN_SANS',
        childrenIds: ['header-block', 'content-block', 'footer-block', 'unsubscribe-block'],
      },
    },
    'header-block': {
      type: 'Html',
      data: {
        style: {
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        },
        props: {
          contents: '{{HEADER}}',
        },
      },
    },
    'content-block': {
      type: 'Html',
      data: {
        style: {
          padding: { top: 20, bottom: 20, left: 20, right: 20 },
        },
        props: {
          contents: '{{CONTENT}}',
        },
      },
    },
    'footer-block': {
      type: 'Container',
      data: {
        style: {
          backgroundColor: '#f8f9fa',
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        },
        props: {
          childrenIds: ['footer-html-block'],
        },
      },
    },
    'footer-html-block': {
      type: 'Html',
      data: {
        style: {
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        },
        props: {
          contents: '{{FOOTER}}',
        },
      },
    },
    'unsubscribe-block': {
      type: 'Html',
      data: {
        style: {
          padding: { top: 10, bottom: 10, left: 10, right: 10 },
        },
        props: {
          contents: '<div style="text-align: center; padding: 10px; font-size: 11px; color: #666666;"><a href="{{UNSUBSCRIBE_LINK}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a></div>',
        },
      },
    },
  };
}

export function useDocument() {
  return useEditorStore((s) => s.document);
}

export function useSelectedBlockId() {
  return useEditorStore((s) => s.selectedBlockId);
}

export function setSelectedBlockId(selectedBlockId: string | null) {
  return useEditorStore.setState({ selectedBlockId });
}

export function setDocument(updates: Partial<TReaderDocument>) {
  return useEditorStore.setState((state) => {
    const updatedDoc = {
      ...state.document,
      ...updates,
    };
    return {
      document: updatedDoc as TReaderDocument,
    };
  });
}

export function resetDocument(document: TReaderDocument) {
  return useEditorStore.setState({ document, selectedBlockId: null });
}
