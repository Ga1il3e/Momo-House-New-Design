type IconProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

/** Plain img for local SVG assets — avoids next/image SVG hydration quirks. */
export function Icon({
  src,
  alt = "",
  width,
  height,
  className,
}: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
    />
  );
}
