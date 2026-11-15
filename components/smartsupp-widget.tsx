"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

type Smartsupp = (...args: unknown[]) => void;
declare global {
  interface Window {
    smartsupp?: Smartsupp;
  }
}

/** Smartsupp queues calls made before its loader finishes, but the global itself appears a moment after our script runs. */
function ss(...args: unknown[]) {
  const fn = window.smartsupp;
  if (fn) {
    try {
      fn(...args);
    } catch {
      /* widget not ready */
    }
    return;
  }
  let tries = 0;
  const t = setInterval(() => {
    if (window.smartsupp || ++tries > 40) {
      clearInterval(t);
      try {
        window.smartsupp?.(...args);
      } catch {
        /* ignore */
      }
    }
  }, 150);
}

/**
 * Smartsupp live chat. Name, email and phone are collected by Smartsupp's own contact form
 * (Settings > Chat box > Contact form), so visitors only ever see one chat screen.
 *  - Every "Reservation" / "Messages" button on the site fires `open-support-chat`, which opens the chat box.
 *  - The page each visitor is on is sent as a visitor detail, next to the URL Smartsupp already tracks.
 *  - The chat is hidden on the admin screens.
 */
export function SmartsuppWidget({ chatKey }: { chatKey: string }) {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const open = () => {
      ss("chat:show");
      ss("chat:open");
    };
    window.addEventListener("open-support-chat", open);
    return () => window.removeEventListener("open-support-chat", open);
  }, []);

  useEffect(() => {
    ss(inAdmin ? "chat:hide" : "chat:show");
  }, [inAdmin]);

  // Tell the team which page the visitor is on (friendly page title).
  useEffect(() => {
    if (inAdmin) return;
    const t = setTimeout(() => {
      const title = document.title.replace(/\s*\|\s*AdultFriendFinder.*$/i, "").trim() || "Home";
      ss("variables", { Page: title, Path: pathname });
    }, 600); // the title updates a moment after navigation
    return () => clearTimeout(t);
  }, [pathname, inAdmin]);

  return (
    <Script id="smartsupp-loader" strategy="afterInteractive">
      {`var _smartsupp = _smartsupp || {};
_smartsupp.key = ${JSON.stringify(chatKey)};
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);`}
    </Script>
  );
}
