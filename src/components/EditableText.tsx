import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface EditableTextProps {
  value: string;
  field: string;
  label: string;
  isEditMode: boolean;
  onSave: (field: string, newValue: string) => void;
  className?: string;
  multiline?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  style?: React.CSSProperties;
  themeAccent?: string;
  placeholder?: string;
  children?: React.ReactNode;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  field,
  label,
  isEditMode,
  onSave,
  className = '',
  multiline = false,
  as: Component = 'span',
  style,
  themeAccent = '#FF5F1F',
  placeholder = 'Click to type text...',
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSave(field, currentValue);
    setIsEditing(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="relative inline-block w-full max-w-full z-40 bg-black/95 p-2 rounded border-2 shadow-2xl animate-in fade-in"
        style={{ borderColor: themeAccent }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[#AAA]">
          <span className="font-bold flex items-center gap-1" style={{ color: themeAccent }}>
            <Edit3 className="w-3 h-3" />
            <span>Editing: {label}</span>
          </span>
          <span className="text-[#666]">Press Enter to Save, Esc to Cancel</span>
        </div>

        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-[#111] text-white text-sm p-2.5 border border-[#333] focus:border-amber-400 outline-none rounded font-sans leading-relaxed resize-y"
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#111] text-white text-sm px-2.5 py-1.5 border border-[#333] focus:border-amber-400 outline-none rounded font-sans"
            placeholder={placeholder}
          />
        )}

        <div className="flex items-center justify-end gap-2 mt-2 font-mono">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 bg-[#222] hover:bg-[#333] text-white text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-black font-bold text-xs rounded transition-colors flex items-center gap-1 shadow cursor-pointer"
            style={{ backgroundColor: themeAccent }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save (محفوظ کریں)</span>
          </button>
        </div>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        title={`Click to edit "${label}"`}
        className={`group/editable relative inline-block cursor-pointer transition-all duration-150 rounded px-1 -mx-1 border border-dashed border-amber-400/50 hover:border-amber-400 hover:bg-amber-400/10 hover:shadow-md ${className}`}
        style={style}
      >
        <Component style={style}>
          {children || value || placeholder}
        </Component>
        <span 
          className="absolute -top-3.5 -right-2 hidden group-hover/editable:flex items-center gap-1 bg-amber-400 text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg z-30 uppercase tracking-wider animate-in fade-in"
        >
          <Edit3 className="w-2.5 h-2.5" />
          <span>Edit</span>
        </span>
      </span>
    );
  }

  return (
    <Component className={className} style={style}>
      {children || value}
    </Component>
  );
};
