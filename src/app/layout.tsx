import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = localFont({
  src: "./fonts/geist-sans-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-code",
  weight: "100 800",
  display: "swap",
});

const instrumentSerif = localFont({
  src: "./fonts/instrument-serif-latin.woff2",
  variable: "--font-editorial",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReplaySpec — Evidence-grounded bug investigation",
  description: "Forensic workstation for browser bug investigation. Every claim traces to a frame.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${jetbrains.variable} ${instrumentSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          // Prevent flash: set theme before hydration
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('replayspec-theme');var m=s? s : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');document.documentElement.setAttribute('data-theme',m);if(m==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
