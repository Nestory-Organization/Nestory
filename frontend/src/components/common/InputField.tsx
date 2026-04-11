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
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-on-surface mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
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
          className={`input-base ${Icon ? 'pl-11' : ''} ${
            error ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-surface-container-low' : ''}`}
        />
      </div>
      {error && <p className="text-red-700 text-sm mt-1.5">{error}</p>}
    </div>
  );
};

export default InputField;
