import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import { SETTINGS_STORAGE_KEY, TINTS, FONT_CHOICES, DEFAULT_SETTINGS } from "@/lib/settings";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "NZImage",
  description: "NZ Image Gallery",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Resolves mode/tint/font from localStorage synchronously before first paint, so the themed
// letterbox/panel colors don't flash to their defaults then swap. Mirrors the sanitization in
// lib/settings.ts. The script body must stay inline (it runs as a blocking <script> before any
// React/module code executes), but the tint/font allow-lists and defaults are interpolated from
// the settings.ts constants so they can't silently drift out of sync. The mode branch stays
// literal because "system" needs runtime prefers-color-scheme resolution below.
const noFlashScript = `
(function () {
  try {
    var raw = window.localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});
    var s = raw ? JSON.parse(raw) : {};
    var mode = s.mode === "light" || s.mode === "dark" ? s.mode : "system";
    var tint = ${JSON.stringify(TINTS)}.indexOf(s.tint) !== -1 ? s.tint : ${JSON.stringify(DEFAULT_SETTINGS.tint)};
    var font = ${JSON.stringify(FONT_CHOICES)}.indexOf(s.font) !== -1 ? s.font : ${JSON.stringify(DEFAULT_SETTINGS.font)};
    var resolvedMode = mode;
    if (mode === "system") {
      resolvedMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var root = document.documentElement;
    root.dataset.mode = resolvedMode;
    root.dataset.tint = tint;
    root.dataset.font = font;
  } catch (e) {
    document.documentElement.dataset.mode = "dark";
    document.documentElement.dataset.tint = "neutral";
    document.documentElement.dataset.font = "system";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSerif.variable} ${jetBrainsMono.variable} ${fraunces.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
