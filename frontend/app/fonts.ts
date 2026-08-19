import localFont from "next/font/local";

/**
 * Creato Display (SIL Open Font License — free for commercial use, license
 * file alongside these in app/fonts/creato/LICENSE.txt). Used for headings
 * only; body text stays on Inter (loaded separately in layout.tsx).
 */
export const creato = localFont({
  src: [
    { path: "./fonts/creato/CreatoDisplay-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/creato/CreatoDisplay-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/creato/CreatoDisplay-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/creato/CreatoDisplay-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-creato",
  display: "swap",
});
