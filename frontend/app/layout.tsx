import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "JD-Aware Resume Engineering",
  description: "Job-description-specific resume versions with LaTeX safety and version control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
