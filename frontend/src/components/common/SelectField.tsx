import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
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
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant z-[1]" size={20} />
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-base ${Icon ? 'pl-11' : ''} ${
            error ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-surface-container-low' : ''} appearance-none pr-10`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-xs">
          ▼
        </div>
      </div>
      {error && <p className="text-red-700 text-sm mt-1.5">{error}</p>}
    </div>
  );
};

export default SelectField;
