export default function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#A7C957] border-t-[#386641]" />
      <p className="text-sm font-medium text-[#386641]">{label}</p>
    </div>
  );
}
