"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PAGES, type PageDef } from "@/lib/flipbookMenu";
import {
  BackCoverPage,
  CoverPage,
  DishPage,
  FormulePage,
  GridPage,
  IntroPage,
  PairPage,
  SupplementsPage,
  TrioPage,
} from "./MenuPages";

type BookSize = { pw: number; ph: number; mobile: boolean };
type PageFlipApi = {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (page: number) => void;
};
type FlipBookHandle = {
  pageFlip: () => PageFlipApi;
};

const Sheet = forwardRef<HTMLDivElement, { side: "left" | "right" | null; children: ReactNode }>(
  function Sheet({ side, children }, ref) {
    return (
      <div ref={ref} className={`page-root ${side ? `is-${side}` : ""}`}>
        <div className="page-paper" />
        {children}
        <span className="page-spine" />
      </div>
    );
  },
);

function fitOpenPages(stage: HTMLElement) {
  stage.querySelectorAll<HTMLElement>(".page-content").forEach((el) => {
    el.style.setProperty("--sheet-scale", "1");
    if (el.clientHeight < 40) return;
    const pageHeight = el.clientHeight;
    const needed = el.scrollHeight;
    const budget = Math.max(pageHeight - 12, 1);
    if (needed <= budget) return;
    el.style.setProperty("--sheet-scale", (budget / needed).toFixed(4));
  });
}

function measure(width: number, height: number): BookSize {
  if (width < 820) {
    const ph = Math.max(300, height - 132);
    const pw = Math.min(Math.max(width - 24, 240), 460);
    return { pw: Math.round(pw), ph: Math.round(ph), mobile: true };
  }
  const pw = Math.min(Math.round((height - 150) / 1.42), Math.round((width - 150) / 2), 472);
  const ph = Math.min(height - 150, Math.round(pw * 1.42));
  return { pw, ph, mobile: false };
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M11 4 6 9l5 5" : "M7 4l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderPage(def: PageDef, active: boolean, booted: boolean, onOpen: () => void) {
  switch (def.kind) {
    case "cover":
      return <CoverPage active={booted} onOpen={onOpen} />;
    case "intro":
      return <IntroPage active={active} />;
    case "dish":
      return <DishPage data={def} active={active} />;
    case "formule":
      return <FormulePage active={active} />;
    case "grid":
      return <GridPage data={def} active={active} />;
    case "pair":
      return <PairPage data={def} active={active} />;
    case "trio":
      return <TrioPage data={def} active={active} />;
    case "supplements":
      return <SupplementsPage active={active} />;
    case "back":
      return <BackCoverPage active={active} />;
    default: {
      const unreachable: never = def;
      return unreachable;
    }
  }
}

export function MenuBook({ booted }: { booted: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipBookHandle>(null);
  const saved = useRef(0);
  const cool = useRef(0);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<BookSize>({ pw: 360, ph: 510, mobile: true });
  const total = PAGES.length;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => setSize(measure(stage.clientWidth, stage.clientHeight));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitOpenPages(stage));
    };
    run();
    const retry = window.setTimeout(run, 80);
    const afterFlip = window.setTimeout(run, 920);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.clearTimeout(afterFlip);
    };
  }, [size, active, booted]);

  const next = useCallback(() => {
    try {
      bookRef.current?.pageFlip().flipNext();
    } catch {
      /* book not ready */
    }
  }, []);

  const prev = useCallback(() => {
    try {
      bookRef.current?.pageFlip().flipPrev();
    } catch {
      /* book not ready */
    }
  }, []);

  const onInit = useCallback((event: { object?: PageFlipApi }) => {
    const instance = event?.object ?? bookRef.current?.pageFlip();
    if (instance && saved.current > 0) {
      try {
        instance.turnToPage(saved.current);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const onFlip = useCallback((event: { data?: number | { page?: number } }) => {
    const data = event?.data;
    const page = typeof data === "number" ? data : Number(data?.page ?? 0);
    saved.current = page;
    setActive(page);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(delta) < 14) return;
      const now = performance.now();
      if (now - cool.current < 820) return;
      cool.current = now;
      if (delta > 0) next();
      else prev();
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [next, prev]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const sideOf = (index: number): "left" | "right" | null =>
    size.mobile ? null : index === 0 || index === total - 1 ? null : index % 2 === 1 ? "left" : "right";

  return (
    <div className="book-stage" id="book-stage" ref={stageRef} data-testid="book-stage">
      <div className="book-glow" aria-hidden="true" />
      <div className="book-frame" style={{ width: size.pw, height: size.ph }}>
      <HTMLFlipBook
        key={`${size.pw}x${size.ph}`}
        ref={bookRef}
        className="flipbook"
        style={{}}
        width={size.pw}
        height={size.ph}
        size="fixed"
        minWidth={240}
        maxWidth={2000}
        minHeight={320}
        maxHeight={2000}
        startZIndex={0}
        autoSize
        useMouseEvents
        disableFlipByClick={false}
        showCover
        usePortrait
        drawShadow
        maxShadowOpacity={0.55}
        showPageCorners={!size.mobile}
        clickEventForward={false}
        mobileScrollSupport={false}
        flippingTime={850}
        swipeDistance={20}
        startPage={0}
        onFlip={onFlip}
        onInit={onInit}
      >
        {PAGES.map((def, index) => {
          const partner = active % 2 === 1 ? active + 1 : active - 1;
          const isActive =
            index === active ||
            (!size.mobile && index === partner && active !== 0 && active !== total - 1);
          return (
            <Sheet key={def.id} side={sideOf(index)}>
              {renderPage(def, isActive, booted, next)}
            </Sheet>
          );
        })}
      </HTMLFlipBook>
      </div>
      <AnimatePresence>
        {active === 0 && booted && (
          <motion.p
            className="hint"
            data-testid="wheel-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            Glissez la page · Faites défiler · Cliquez
          </motion.p>
        )}
      </AnimatePresence>
      <div className="book-controls" data-testid="book-controls">
        <button
          className="nav-btn"
          data-testid="book-prev-button"
          onClick={prev}
          disabled={active === 0}
          aria-label="Page précédente"
          type="button"
        >
          <Chevron dir="left" />
        </button>
        <span className="counter" data-testid="book-counter">
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          className="nav-btn"
          data-testid="book-next-button"
          onClick={next}
          disabled={active === total - 1}
          aria-label="Page suivante"
          type="button"
        >
          <Chevron dir="right" />
        </button>
      </div>
      <div className="progress" data-testid="book-progress" style={{ width: `${((active + 1) / total) * 100}%` }} />
    </div>
  );
}
