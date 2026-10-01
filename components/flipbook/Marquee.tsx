export function Marquee({ items }: { items: string[] }) {
  const seq = (key: number) => (
    <span className="marquee-seq" key={key}>
      {items.map((label, i) => (
        <span className="marquee-item" key={`${key}-${label}-${i}`}>
          {label}
          <i>·</i>
        </span>
      ))}
    </span>
  );

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {seq(1)}
        {seq(2)}
      </div>
    </div>
  );
}
