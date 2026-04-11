import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  size = 'md',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(48, 51, 46, 0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-surface-container-lowest rounded-2xl shadow-ambient w-full ${sizeMap[size]} mx-auto animate-scale-in overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low">
          <h2 id="modal-title" className="font-headline text-lg font-semibold text-on-surface pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors duration-200 ease-spring shrink-0"
            disabled={isLoading}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 bg-surface-container-lowest">{children}</div>

        {onConfirm && (
          <div className="flex gap-3 justify-end px-6 py-4 bg-surface-container-low">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              {cancelText}
            </button>
            <button type="button" onClick={onConfirm} className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Loading...' : confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
