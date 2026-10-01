"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader } from "./Loader";
import { MenuBook } from "./MenuBook";
import "./flipbook.css";

class Boundary extends Component<{ children: ReactNode }, { err: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { err: false };
  }

  static getDerivedStateFromError() {
    return { err: true };
  }

  render() {
    if (this.state.err) {
      return <div className="boot-error">Oups — le menu n&apos;a pas pu s&apos;ouvrir. Rechargez la page.</div>;
    }
    return this.props.children;
  }
}

export function MenuFlipbook({
  houseLabel,
  embedded = false,
}: {
  houseLabel: string;
  embedded?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);
  const onDone = useCallback(() => setBooted(true), []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || embedded) return;
    const fit = () => {
      const top = Math.max(el.getBoundingClientRect().top, 0);
      const available = window.innerHeight - top;
      el.style.height = `${Math.max(available, 480)}px`;
      el.style.maxHeight = `${available}px`;
      el.style.overflow = "hidden";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [embedded]);

  return (
    <div
      ref={rootRef}
      className={embedded ? "menu-flipbook menu-flipbook-embedded" : "menu-flipbook"}
    >
      <div className="app-root">
        <header className="topbar">
          <span>Momo House</span>
          <span>{houseLabel}</span>
        </header>
        <div className="watermark" aria-hidden="true">
          मोमो
        </div>
        <Boundary>
          <MenuBook booted={booted} />
        </Boundary>
        <div className="app-grain" aria-hidden="true" />
        {!booted && <Loader onDone={onDone} />}
      </div>
    </div>
  );
}
