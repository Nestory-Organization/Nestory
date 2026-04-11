import React from 'react';
import { Child } from '../../types';
import { Edit2, Trash2, BookOpen, KeyRound } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  onEdit?: (child: Child) => void;
  onDelete?: (childId: string) => void;
  onResetPassword?: (childId: string) => void;
  onClick?: (child: Child) => void;
  showActions?: boolean;
  isDeleting?: boolean;
  isResettingPassword?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({
  child,
  onEdit,
  onDelete,
  onResetPassword,
  onClick,
  showActions = true,
  isDeleting = false,
  isResettingPassword = false,
}) => {
  const getLevelEmoji = (level?: string) => {
    switch (level) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '🌿';
      case 'advanced':
        return '🌳';
      default:
        return '👧';
    }
  };

  return (
    <div
      className="card-interactive relative"
      onClick={() => onClick?.(child)}
    >
      {/* Avatar */}
      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-container to-tertiary-container rounded-full flex items-center justify-center text-4xl shadow-ambient-sm ring-2 ring-white/80">
        {child.avatar || '👧'}
      </div>

      {/* Child Info */}
      <h3 className="font-headline font-semibold text-center text-on-surface text-lg mb-1">{child.name}</h3>
      <p className="text-center text-on-surface-variant text-sm mb-4">Age: {child.age}</p>

      {/* Reading Level Indicator */}
      {child.readingLevel && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{getLevelEmoji(child.readingLevel)}</span>
          <span className="badge badge-primary text-xs">{child.readingLevel}</span>
        </div>
      )}

      {/* Quick Stats (placeholder) */}
      <div className="bg-surface-container-low rounded-xl p-3 mb-4 text-center">
        <div className="flex items-center justify-center gap-2 text-primary-700 font-semibold">
          <BookOpen size={16} />
          <span>0 books</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onEdit || onDelete || onResetPassword) && (
        <div className="flex flex-wrap gap-2 justify-center pt-4 mt-2 bg-surface-container-low rounded-xl py-3 px-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(child);
              }}
              className="btn-secondary flex items-center gap-1 text-xs"
              disabled={isDeleting}
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {onResetPassword && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword(child.id);
              }}
              className="btn-secondary flex items-center gap-1 text-xs"
              disabled={isDeleting || isResettingPassword}
            >
              <KeyRound size={14} />
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(child.id);
              }}
              className="btn-danger flex items-center gap-1 text-xs"
              disabled={isDeleting || isResettingPassword}
            >
              <Trash2 size={14} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChildCard;
