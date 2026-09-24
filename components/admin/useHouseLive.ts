"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { euro } from "@/lib/money";
import { formatDateFr, formatTime } from "@/lib/time";
import type { House } from "@/lib/house";

function chime() {
  try {
    if (localStorage.getItem("mh_order_sound") === "off") return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* ignore */
  }
}

export function useHouseLive(house: House) {
  const router = useRouter();
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 500);
    };
    const channel = supabase
      .channel(`admin-${house}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations", filter: `house=eq.${house}` },
        (payload) => {
          if (Date.now() - started.current < 2000) return;
          const next = payload.new as Record<string, string | number | null>;
          if (payload.eventType === "INSERT" && next.source === "web") {
            toast(`Nouvelle retenue — ${next.guest_name} · ${next.guests} pers. · ${formatDateFr(String(next.service_date))} ${formatTime(String(next.start_time))}`);
          }
          if (payload.eventType === "UPDATE" && next.status === "cancelled") {
            toast(`Retenue annulée par le client — ${next.guest_name}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `house=eq.${house}` },
        (payload) => {
          if (Date.now() - started.current < 2000) return;
          const next = payload.new as Record<string, string | number | null>;
          if (payload.eventType === "INSERT") {
            toast(`Nouvelle commande ${next.order_number} — ${euro(Number(next.total_cents))}`);
            chime();
          }
          if (payload.eventType === "UPDATE" && next.status === "cancelled" && next.cancelled_by === "guest") {
            toast(`Commande annulée par le client — ${next.order_number}`);
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_messages", filter: `house=eq.${house}` },
        (payload) => {
          if (Date.now() - started.current < 2000) return;
          const next = payload.new as Record<string, string>;
          toast(`Nouveau message — ${next.name}`);
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_logs", filter: `house=eq.${house}` },
        (payload) => {
          if (Date.now() - started.current < 2000) return;
          const next = payload.new as Record<string, string>;
          if (next.status === "failed") {
            toast(`E-mail non envoyé — ${next.type} → ${next.to_email}`);
          }
          refresh();
        },
      )
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [house, router]);
}
