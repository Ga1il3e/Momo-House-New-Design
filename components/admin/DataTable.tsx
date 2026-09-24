export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-paper-soft font-label text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(228,190,186,0.35)]">{children}</tbody>
      </table>
    </div>
  );
}
