export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white px-6 py-12 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {children ? <div className="mt-2 text-sm text-ink-muted">{children}</div> : null}
    </div>
  );
}
