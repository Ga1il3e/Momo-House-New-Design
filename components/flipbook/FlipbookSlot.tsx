"use client";

import dynamic from "next/dynamic";

const MenuFlipbook = dynamic(
  () => import("./MenuFlipbook").then((mod) => mod.MenuFlipbook),
  {
    ssr: false,
    loading: () => <div className="min-h-[70vh] bg-[#0c0407]" />,
  },
);

export function FlipbookSlot({
  houseLabel,
  embedded = false,
}: {
  houseLabel: string;
  embedded?: boolean;
}) {
  return <MenuFlipbook houseLabel={houseLabel} embedded={embedded} />;
}
