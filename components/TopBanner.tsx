type TopBannerProps = {
  variant?: "home" | "house";
  left?: string;
  right?: string;
};

export function TopBanner({
  variant = "home",
  left,
  right,
}: TopBannerProps) {
  if (variant === "house") {
    return (
      <aside className="bg-burgundy-deep flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-center">
        <span className="size-2 shrink-0 rounded-full bg-[#d87a22]" />
        <p className="font-label text-[10px] font-bold uppercase tracking-[1px] text-paper">
          {left ??
            "FAIT MAIN CHAQUE MATIN À PARIS • POISSONNIÈRE (10E) & MONTMARTRE (2E)"}
        </p>
        <span className="font-label text-[10px] font-bold uppercase tracking-[1px] text-paper/60">
          •
        </span>
        <p className="font-label text-[10px] font-bold uppercase tracking-[1px] text-paper/90">
          {right ?? "24 PLIS TRADITIONNELS NÉPALO-TIBÉTAINS"}
        </p>
      </aside>
    );
  }

  return (
    <aside className="bg-burgundy flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-center">
      <span className="size-2 shrink-0 rounded-full bg-amber" />
      <p className="font-label text-[11px] font-medium tracking-[0.8px] text-white sm:text-base">
        {left ??
          "DEUX MAISONS À PARIS · MONTMARTRE (2E) & POISSONNIÈRE (10E)"}
      </p>
      <p className="font-label text-[11px] font-medium tracking-[0.8px] text-[#ffb3ad] sm:text-base">
        {right ?? "Momos faits main chaque matin"}
      </p>
    </aside>
  );
}
