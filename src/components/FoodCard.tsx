import Button from "./Button";
import { FaStar } from "react-icons/fa6";

interface FoodCardProps {
  name: string;
  description: string;
  price: number;
  calories?: number;
  category?: string;
  rating?: number;
  imageUrl?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function FoodCard({
  name,
  description,
  price,
  calories,
  category,
  rating = 4.5,
  imageUrl,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = "Add to Cart",
  secondaryLabel = "View Details",
}: FoodCardProps) {
  return (
    <article className="group overflow-hidden rounded-[16px] border border-[#90CD1D]/15 bg-white shadow-[0_4px_16px_rgba(29,45,0,0.08)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(29,45,0,0.15)]">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#E8F0D7] to-[#D6F0A4]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[#1D2D00]">
            🍽️ Culinary Delight
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10" />
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1D2D00]">{name}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-[#1D2D00]/60">{description}</p>
          </div>
          <span className="rounded-lg bg-[#90CD1D]/15 px-2 py-1 text-sm font-bold text-[#90CD1D]">
            PKR {price.toFixed(0)}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const isFilled = index < Math.round(rating);
              return (
                <FaStar
                  key={index}
                  className={isFilled ? "h-3.5 w-3.5 text-[#EAB308]" : "h-3.5 w-3.5 text-[#EAB308]/25"}
                />
              );
            })}
          </div>
          <span className="text-xs font-semibold text-[#1D2D00]/70">{rating.toFixed(1)}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {category && (
            <span className="rounded-full bg-[#90CD1D]/10 px-2 py-1 text-xs font-medium text-[#90CD1D]">
              {category}
            </span>
          )}
          {typeof calories === "number" && (
            <span className="rounded-full bg-[#1D2D00]/10 px-2 py-1 text-xs font-medium text-[#1D2D00]">
              {calories} kcal
            </span>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#90CD1D]/10 pt-4">
          <Button
            variant="ghost"
            className="!flex-1 !px-0 !text-sm"
            onClick={onSecondaryAction}
          >
            {secondaryLabel}
          </Button>
          <Button
            className="!flex-1 !px-0 !text-sm"
            onClick={onPrimaryAction}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
