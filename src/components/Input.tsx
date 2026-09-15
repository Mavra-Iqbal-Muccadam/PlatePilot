import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <label className="block w-full space-y-2">
      {label && (
        <span className="text-sm font-medium text-[#1D2D00]">{label}</span>
      )}
      <input
        className={`w-full rounded-[12px] border border-[#90CD1D] bg-[#D6F0A4] px-3 py-2.5 text-[#1D2D00] placeholder:text-[#90CD1D] outline-none transition-all duration-200 focus:border-[#1D2D00] focus:ring-2 focus:ring-[#E8F0D7] ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-[#BC4749]">{error}</span>
      )}
    </label>
  );
}
