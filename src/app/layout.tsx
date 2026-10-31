import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReplaySpec — Evidence-grounded bug investigation",
  description: "Forensic workstation for browser bug investigation. Every claim traces to a frame.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
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
