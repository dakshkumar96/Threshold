/**
 * Threshold mark: three stepping stones rising along a curve, each bigger than
 * the last. The last one is a heavy ring with a dot, the checkpoint you reach.
 * "dark" is for light backgrounds (navy stones). "light" is for dark
 * backgrounds: white stones and the green ring on a blue circle.
 * `size` is the overall diameter (light) or the mark height (dark), in px.
 */
const NAVY = "#1b2a4e";
const REACHED = "#34d399";
const BADGE = "#1d4ed8";

function Mark({ height, stone = NAVY }: { height: number; stone?: string }) {
  return (
    <svg
      height={height}
      width={(height * 104) / 76}
      viewBox="0 0 104 76"
      fill="none"
      aria-hidden
    >
      <circle cx="14" cy="62" r="9" fill={stone} />
      <circle cx="40" cy="48" r="13" fill={stone} />
      <circle cx="78" cy="26" r="20" stroke={REACHED} strokeWidth="8" />
      <circle cx="78" cy="26" r="8" fill={REACHED} />
    </svg>
  );
}

export default function Logo({
  height = 22,
  tone = "dark",
}: {
  height?: number;
  tone?: "dark" | "light";
}) {
  if (tone === "dark") return <Mark height={height} />;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: height,
        height,
        borderRadius: "50%",
        background: BADGE,
      }}
    >
      <Mark height={Math.round(height * 0.46)} stone="#ffffff" />
    </span>
  );
}
