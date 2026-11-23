import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import { APP_NAME } from "@/lib/constants";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: "Personal movie and TV discovery that remembers what you watch and what you like.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${fraunces.variable} dark`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
