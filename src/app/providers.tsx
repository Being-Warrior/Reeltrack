"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1c1a18",
            color: "#f6f1e8",
            border: "1px solid rgba(246, 241, 232, 0.12)",
          },
        }}
      />
    </ThemeProvider>
  );
}
