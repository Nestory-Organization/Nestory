import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label?: string;
  type?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string; // Added className prop for custom styling
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  min,
  max,
  step,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 px-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full ${Icon ? 'pl-12' : 'px-4'} pr-4 py-4 bg-surface-container-low border-b-2 transition-all outline-none text-on-surface rounded-t-lg focus:ring-0 ${
            error 
              ? 'border-error focus:border-error text-error' 
              : 'border-outline-variant focus:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="text-error text-xs font-medium px-1 mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
