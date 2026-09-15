import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1D2D00] text-white hover:bg-[#2a4600] active:bg-[#1D2D00] disabled:bg-[#90CD1D]/50 font-semibold",
  secondary:
    "bg-transparent text-[#1D2D00] border border-[#1D2D00] hover:bg-[#1D2D00] hover:text-white active:bg-[#1D2D00] disabled:opacity-50 font-semibold",
  ghost:
    "bg-transparent text-[#1D2D00] hover:bg-[#E8F0D7] active:bg-[#D6F0A4] disabled:opacity-60 font-medium",
  danger:
    "bg-[#BC4749] text-white hover:bg-[#BC4749]/85 active:bg-[#BC4749] disabled:bg-[#BC4749]/60 font-semibold",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-[14px] px-4 py-2.5 font-medium transition-all duration-200 disabled:cursor-not-allowed ${variantClassMap[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  );
}
