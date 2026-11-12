import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AdminSide, AdminTop } from "@/components/admin-slots";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdultFriendFinder",
  description: "Discover and join exclusive events.",
};

// Applies the saved theme before first paint so there's no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';if(t)document.documentElement.dataset.theme=t;var s=localStorage.getItem('text-size');if(s)document.documentElement.dataset.text=s}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <AppShell
          footer={<SiteFooter />}
          adminTop={
            <Suspense
              fallback={
                <div className="flex gap-2">
                  <div className="h-10 w-12 rounded-xl bg-secondary" />
                  <div className="size-10 rounded-xl bg-secondary" />
                  <div className="size-10 rounded-full bg-secondary" />
                </div>
              }>
              <AdminTop />
            </Suspense>
          }
          adminSide={
            <Suspense fallback={null}>
              <AdminSide />
            </Suspense>
          }>
          {children}
        </AppShell>
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </body>
    </html>
  );
}
