"use client";

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Confirmer",
  onConfirm,
  children,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">{children}</summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-[rgba(228,190,186,0.5)] bg-white p-4 shadow-lg">
        <p className="font-display font-bold">{title}</p>
        <p className="mt-2 text-sm text-ink-muted">{body}</p>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-burgundy mt-3 w-full px-3 py-2 text-xs"
        >
          {confirmLabel}
        </button>
      </div>
    </details>
  );
}
