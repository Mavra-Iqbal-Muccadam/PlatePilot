interface CategoryCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

export default function CategoryCard({ title, description, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[16px] border border-[#6A994E]/45 bg-[#A7C957]/25 p-5 text-left text-[#386641] shadow-[0_8px_24px_rgba(56,102,65,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#A7C957]/40"
      type="button"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </button>
  );
}
