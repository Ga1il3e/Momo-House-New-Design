"use client";

import { motion } from "motion/react";
import type { MouseEvent } from "react";
import {
  fmt,
  type DishPageDef,
  type GridPageDef,
  type MenuItem,
  type PairPageDef,
  type PriceOption,
  type TrioPageDef,
  BACK,
  FORMULE,
  INTRO,
  SUPPS,
} from "@/lib/flipbookMenu";
import { Logo } from "./Logo";
import { Marquee } from "./Marquee";

const box = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } };
const up = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};
const line = {
  hidden: { y: "115%" },
  show: { y: "0%", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

function Eyebrow({ children }: { children: string }) {
  return (
    <motion.p className="eyebrow" variants={up}>
      {children}
    </motion.p>
  );
}

function PriceRow({ label, sub, price, prefix = "" }: PriceOption) {
  return (
    <motion.div className="price-row" variants={up} data-testid="price-row">
      <div className="price-label">
        <span className="price-name">
          {prefix}
          {label}
        </span>
        {sub && <span className="price-sub">{sub}</span>}
      </div>
      <span className="leader" />
      <span className="price">
        {prefix}
        {fmt(price)}
      </span>
    </motion.div>
  );
}

function Arch({
  src,
  alt,
  className = "",
  seal,
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  seal?: string;
  eager?: boolean;
}) {
  return (
    <div className={`arch ${className}`}>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} />
      <span className="arch-glare" />
      {seal && <span className="seal">{seal}</span>}
    </div>
  );
}

export function CoverPage({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const tilt = (event: MouseEvent<HTMLDivElement>) => {
    const el = event.currentTarget.querySelector<HTMLElement>(".cover-tilt");
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
  };
  const untilt = (event: MouseEvent<HTMLDivElement>) => {
    const el = event.currentTarget.querySelector<HTMLElement>(".cover-tilt");
    if (el) el.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div className="cover-wrap" onMouseMove={tilt} onMouseLeave={untilt} data-testid="page-cover">
      <div className="cover-leather cover-tilt-inner">
        <div className="cover-tilt">
          <motion.div className="cover-center" variants={box} initial="hidden" animate={active ? "show" : "hidden"}>
            <motion.span variants={up}>
              <Logo size={72} />
            </motion.span>
            <motion.p className="cover-dev" variants={up}>
              मोमो
            </motion.p>
            <h1 className="cover-title">
              <span className="line-mask">
                <motion.span variants={line}>MOMO</motion.span>
              </span>
              <span className="line-mask">
                <motion.span variants={line}>HOUSE</motion.span>
              </span>
            </h1>
            <motion.span className="cover-rule" variants={up} />
            <motion.p className="cover-tag" variants={up}>
              Cuisine Népalaise · Fait Maison
            </motion.p>
            <motion.button className="cta" variants={up} data-testid="open-menu-button" onClick={onOpen} type="button">
              Ouvrir le Menu
            </motion.button>
          </motion.div>
          <div className="cover-marquee">
            <Marquee items={["Vapeur", "Kothey", "Jhol", "Épicé", "Fait Maison", "Épices du Népal", "8 Pièces"]} />
          </div>
        </div>
        <span className="cover-frame" />
      </div>
    </div>
  );
}

export function IntroPage({ active }: { active: boolean }) {
  return (
    <motion.div
      className="page-content intro"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid="page-intro"
    >
      <Eyebrow>{INTRO.eyebrow}</Eyebrow>
      <motion.div className="intro-mark" variants={up}>
        <Logo size={46} />
      </motion.div>
      <motion.h2 className="page-title" variants={up}>
        {INTRO.title}
      </motion.h2>
      <motion.p className="intro-body" variants={up}>
        {INTRO.body}
      </motion.p>
      <div className="styles">
        {INTRO.styles.map((style) => (
          <motion.div className="style-row" key={style.n} variants={up}>
            <span className="style-n">{style.n}</span>
            <div>
              <h3>{style.name}</h3>
              <p>{style.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.p className="page-note" variants={up}>
        {INTRO.note}
      </motion.p>
    </motion.div>
  );
}

export function DishPage({ data, active }: { data: DishPageDef; active: boolean }) {
  return (
    <motion.div
      className="page-content dish"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid={`page-${data.id}`}
    >
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <motion.div className="dish-arch-wrap" variants={up}>
        <Arch src={data.image} alt={data.title} className="dish-arch" seal={data.badge} eager />
      </motion.div>
      <motion.h2 className="dish-title" variants={up}>
        {data.title}
      </motion.h2>
      <motion.p className="dish-desc" variants={up}>
        {data.desc}
      </motion.p>
      <div className="price-list">
        {data.options.map((option) => (
          <PriceRow key={option.label} {...option} />
        ))}
      </div>
    </motion.div>
  );
}

function PairItem({ item }: { item: MenuItem }) {
  return (
    <motion.div className="pair-item" variants={up}>
      <Arch src={item.image} alt={item.name} className="arch-sm" />
      <div className="pair-info">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-desc">{item.desc}</p>
        <div className="price-row">
          <span className="leader" />
          <span className="price">{fmt(item.price)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function PairPage({ data, active }: { data: PairPageDef; active: boolean }) {
  return (
    <motion.div
      className="page-content"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid={`page-${data.id}`}
    >
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <motion.h2 className="page-title" variants={up}>
        {data.title}
      </motion.h2>
      <div className="pair-list">
        {data.items.map((item) => (
          <PairItem key={item.name} item={item} />
        ))}
      </div>
    </motion.div>
  );
}

export function TrioPage({ data, active }: { data: TrioPageDef; active: boolean }) {
  const featured = data.featured;
  return (
    <motion.div
      className="page-content"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid={`page-${data.id}`}
    >
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <motion.h2 className="page-title" variants={up}>
        {data.title}
      </motion.h2>
      <motion.div className="trio-featured" variants={up}>
        <Arch src={featured.image} alt={featured.name} className="arch-mid" />
        <div className="pair-info">
          <h3 className="item-name">{featured.name}</h3>
          <p className="item-desc">{featured.desc}</p>
          <span className="price">{fmt(featured.price)}</span>
        </div>
      </motion.div>
      <div className="trio-rows">
        {data.rows.map((row) => (
          <motion.div className="trio-row" key={row.name} variants={up}>
            <Arch src={row.image} alt={row.name} className="arch-xs" />
            <div className="trio-info">
              <h4>{row.name}</h4>
              <p>{row.desc}</p>
            </div>
            <span className="price">{fmt(row.price)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function GridPage({ data, active }: { data: GridPageDef; active: boolean }) {
  return (
    <motion.div
      className="page-content"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid={`page-${data.id}`}
    >
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <motion.h2 className="page-title" variants={up}>
        {data.title}
      </motion.h2>
      <div className="grid2">
        {data.items.map((item) => (
          <motion.div className="grid-cell" key={item.name} variants={up}>
            <Arch src={item.image} alt={item.name} className="arch-sq" />
            <h3 className="cell-name">{item.name}</h3>
            <div className="cell-bottom">
              <p className="cell-desc">{item.desc}</p>
              <span className="price">{fmt(item.price)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function FormulePage({ active }: { active: boolean }) {
  return (
    <motion.div
      className="page-content formule"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid="page-formule"
    >
      <Eyebrow>{FORMULE.eyebrow}</Eyebrow>
      <motion.h2 className="page-title" variants={up}>
        {FORMULE.title}
      </motion.h2>
      <motion.p className="dish-desc formule-desc" variants={up}>
        {FORMULE.desc}
      </motion.p>
      <motion.div className="formule-arch-wrap" variants={up}>
        <Arch src={FORMULE.image} alt="Formule Midi" className="formule-arch" />
      </motion.div>
      <motion.div className="mini-label" variants={up}>
        {FORMULE.fillLabel}
      </motion.div>
      <motion.p className="fills" variants={up}>
        {FORMULE.fills.join("  ·  ")}
      </motion.p>
      {FORMULE.cooks.map((cook) => (
        <PriceRow key={cook.label} {...cook} />
      ))}
      <motion.div className="mini-label" variants={up}>
        {FORMULE.sidesLabel}
      </motion.div>
      <motion.ul className="sides" variants={up}>
        {FORMULE.sides.map((side) => (
          <li key={side}>{side}</li>
        ))}
      </motion.ul>
      <div className="formule-extras">
        {FORMULE.extras.map((extra) => (
          <PriceRow key={extra.label} {...extra} />
        ))}
      </div>
    </motion.div>
  );
}

export function SupplementsPage({ active }: { active: boolean }) {
  return (
    <motion.div
      className="page-content"
      variants={box}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      data-testid="page-supplements"
    >
      <Eyebrow>{SUPPS.eyebrow}</Eyebrow>
      <motion.h2 className="page-title" variants={up}>
        {SUPPS.title}
      </motion.h2>
      <motion.div className="pair-item" variants={up}>
        <Arch src={SUPPS.extra.image} alt={SUPPS.extra.name} className="arch-sm" />
        <div className="pair-info">
          <h3 className="item-name">{SUPPS.extra.name}</h3>
          <p className="item-desc">{SUPPS.extra.sub}</p>
          <div className="price-row">
            <span className="leader" />
            <span className="price">{fmt(SUPPS.extra.price)}</span>
          </div>
        </div>
      </motion.div>
      <motion.div className="mini-label" variants={up}>
        {SUPPS.label}
      </motion.div>
      <div className="supp-rows">
        {SUPPS.rows.map((row) => (
          <PriceRow key={row.label} {...row} />
        ))}
      </div>
    </motion.div>
  );
}

export function BackCoverPage({ active }: { active: boolean }) {
  return (
    <div className="cover-wrap" data-testid="page-back">
      <div className="cover-leather back-leather">
        <motion.div className="back-center" variants={box} initial="hidden" animate={active ? "show" : "hidden"}>
          <motion.span variants={up}>
            <Logo size={64} />
          </motion.span>
          <motion.p className="back-dev" variants={up}>
            {BACK.dev}
          </motion.p>
          <motion.p className="back-merci" variants={up}>
            {BACK.merci}
          </motion.p>
          <motion.span className="cover-rule" variants={up} />
          <motion.p className="back-brand" variants={up}>
            {BACK.brand} — {BACK.tag}
          </motion.p>
          <motion.p className="back-note" variants={up}>
            {BACK.note}
          </motion.p>
        </motion.div>
        <span className="cover-frame" />
      </div>
    </div>
  );
}
