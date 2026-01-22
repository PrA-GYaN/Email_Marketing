import React, { useState, useEffect, useCallback } from 'react';
import GrapesJSEmailEditor from './GrapesJSEmailEditor.tsx';

interface EmailEditorWithStorageProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  storageKey?: string; // Reserved for future use with localStorage/sessionStorage
}

/**
 * Wrapper component that integrates GrapesJS with the existing storage format.
 * Maintains compatibility with the current backend structure.
 */
export const EmailEditorWithStorage: React.FC<EmailEditorWithStorageProps> = ({
  value,
  onChange,
  height,
}) => {
  const [internalHtml, setInternalHtml] = useState<string>(value);

  // Update internal state when value prop changes
  useEffect(() => {
    setInternalHtml(value);
  }, [value]);

  const handleEditorChange = useCallback((html: string, css: string) => {
    setInternalHtml(html);
    
    // Combine HTML and CSS for email-compatible output
    // CSS is inlined for email client compatibility
    const fullHtml = css ? `<style>${css}</style>${html}` : html;
    onChange(fullHtml);
  }, [onChange]);

  return (
    <GrapesJSEmailEditor
      value={internalHtml}
      onChange={handleEditorChange}
      height={height}
    />
  );
};

export default EmailEditorWithStorage;
