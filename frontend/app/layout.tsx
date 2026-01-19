import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ToastProvider } from "@/components/ui/Toast";
import { FloatingNavbar } from "@/components/ui/floating-navbar";
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
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <FloatingNavbar />
            <ToastProvider>
              {children}
            </ToastProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
