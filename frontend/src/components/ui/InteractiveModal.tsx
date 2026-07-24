'use client';

import React, { useState, useEffect } from 'react';

export type ModalType = 'confirm' | 'prompt' | 'alert';

export interface InteractiveModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  theme?: 'approve' | 'prepare' | 'danger' | 'info';
  defaultValue?: string; // For prompt
  placeholder?: string; // For prompt
  required?: boolean; // For prompt
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function InteractiveModal({
  isOpen,
  type,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  theme = 'info',
  defaultValue = '',
  placeholder = 'Enter value...',
  required = false,
  onConfirm,
  onCancel
}: InteractiveModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setErrorMsg(null);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt' && required && !inputValue.trim()) {
      setErrorMsg('A review comment is required.');
      return;
    }
    setErrorMsg(null);
    onConfirm(type === 'prompt' ? inputValue : undefined);
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'approve':
        return {
          bg: '#ecfccb',
          color: '#4d7c0f',
          btnBg: '#65a30d',
          btnHover: '#4d7c0f',
          icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        };
      case 'danger':
        return {
          bg: '#fef2f2',
          color: '#b91c1c',
          btnBg: '#dc2626',
          btnHover: '#991b1b',
          icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        };
      case 'prepare':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          btnBg: '#0ea5e9',
          btnHover: '#0284c7',
          icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        };
      case 'info':
      default:
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          btnBg: '#0284c7',
          btnHover: '#0369a1',
          icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div
      onClick={onCancel}
      className="modal-backdrop-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.4)',
        zIndex: 1600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-scale-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          transformOrigin: 'center center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{
            backgroundColor: styles.bg,
            color: styles.color,
            padding: '0.75rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {styles.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        {type === 'prompt' && (
          <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (errorMsg && e.target.value.trim()) setErrorMsg(null);
              }}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: 8,
                border: errorMsg ? '1px solid #ef4444' : '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {errorMsg && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                {errorMsg}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{ 
              padding: '0.5rem 1.25rem', 
              border: 'none', 
              backgroundColor: styles.btnBg, 
              color: '#ffffff', 
              borderRadius: 8, 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
              boxShadow: `0 4px 6px -1px ${styles.btnBg}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.btnHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.btnBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          >
            {type === 'alert' ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
