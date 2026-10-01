import { Cormorant_Garamond, Jost, Lora, Yatra_One } from "next/font/google";
import { FlipbookSlot } from "./FlipbookSlot";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-flip-display",
});

const body = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-flip-body",
});

const label = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-flip-label",
});

const devanagari = Yatra_One({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-flip-devanagari",
});

export function CarteFlipbook({
  houseLabel,
  embedded = false,
}: {
  houseLabel: string;
  embedded?: boolean;
}) {
  return (
    <div className={`${display.variable} ${body.variable} ${label.variable} ${devanagari.variable}`}>
      <FlipbookSlot houseLabel={houseLabel} embedded={embedded} />
    </div>
  );
}
