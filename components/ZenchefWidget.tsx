"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

/** Restaurant id from the Zenchef SDK embed (sdk.zenchef.com). */
const ZENCHEF_RESTAURANT_ID = "373754";

type ZenchefApi = {
  open: () => void;
  close: () => void;
};

declare global {
  interface Window {
    ZenchefWidget?: ZenchefApi;
  }
}

function shouldAutoOpen(pathname: string) {
  return pathname === "/reservation";
}

export function ZenchefWidget() {
  const pathname = usePathname();
  const autoOpen = shouldAutoOpen(pathname);

  useEffect(() => {
    if (!autoOpen) return;

    let cancelled = false;
    let openTimer = 0;

    const scheduleOpen = () => {
      if (cancelled || !window.ZenchefWidget) return false;
      openTimer = window.setTimeout(() => {
        if (!cancelled) window.ZenchefWidget?.open();
      }, 2000);
      return true;
    };

    if (scheduleOpen()) {
      return () => {
        cancelled = true;
        window.clearTimeout(openTimer);
      };
    }

    const interval = window.setInterval(() => {
      if (scheduleOpen()) window.clearInterval(interval);
    }, 250);
    const giveUp = window.setTimeout(() => window.clearInterval(interval), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(giveUp);
      window.clearTimeout(openTimer);
    };
  }, [autoOpen]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <Script id="zenchef-sdk-loader" strategy="afterInteractive">
        {`(function (d, s, id) {
  const el = d.getElementsByTagName(s)[0];
  if (d.getElementById(id) || !el || el.parentNode == null) return;
  var js = d.createElement(s);
  js.id = id;
  js.src = "https://sdk.zenchef.com/v1/sdk.min.js";
  el.parentNode.insertBefore(js, el);
})(document, "script", "zenchef-sdk");`}
      </Script>
      <div
        className="zc-widget-config"
        data-restaurant={ZENCHEF_RESTAURANT_ID}
        data-lang="fr"
        data-primary-color="980012"
        data-position="right"
        {...(autoOpen ? { "data-open": "2000" } : {})}
      />
    </>
  );
}
