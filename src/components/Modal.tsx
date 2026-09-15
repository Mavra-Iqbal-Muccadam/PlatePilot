import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#386641]/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-[16px] border border-[#6A994E]/40 bg-[#F2E8CF] shadow-[0_20px_40px_rgba(56,102,65,0.24)]">
        <div className="flex items-center justify-between border-b border-[#6A994E]/35 p-4">
          <h3 className="text-xl font-semibold text-[#386641]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] px-3 py-1 text-[#386641] transition-colors hover:bg-[#A7C957]/40"
          >
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
