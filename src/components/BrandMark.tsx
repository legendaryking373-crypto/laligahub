import logoAsset from "@/assets/laliga-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = 40,
  showWordmark = true,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={logoAsset.url}
        alt="LALIGA logo"
        width={size}
        height={size}
        className="rounded-sm object-contain mix-blend-multiply dark:mix-blend-lighten dark:invert-0"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="text-display text-xl leading-none text-primary">LALIGA</span>
      )}
    </span>
  );
}
