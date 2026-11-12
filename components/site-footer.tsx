"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { Popover } from "./popover";

const L = (label: string, href: string) => ({ label, href });

// Row one has two groups separated by a faint vertical line.
const ROW_ONE_LEFT = [
  L("Company", "/"),
  L("About", "/events"),
  L("Contact Us", "/events"),
  L("What's New", "/events"),
  L("Feedback", "/events"),
  L("Blog", "/events"),
];
const ROW_ONE_RIGHT = [
  L("Dating Safety", "/events"),
  L("Protect Kids", "/events"),
  L("Report Abuse", "/events"),
  L("Anti-Trafficking", "/events"),
];
const ROW_TWO = [
  L("Privacy", "/events"),
  L("Cookies", "/events"),
  L("Terms", "/events"),
  L("18 U.S.C. 2257", "/events"),
  L("Do Not Sell My Info", "/events"),
  L("Accessibility", "/events"),
  L("Consent & Content Policy", "/events"),
];
const ROW_THREE = [
  L("Complaints, Abuse Reporting & Content Removal Policy", "/events"),
  L("Take It Down Act Notice", "/events"),
];

const GROUPS = [
  L("Company", "/events"),
  L("Safety", "/events"),
  L("Legal", "/events"),
  L("Help", "/events"),
];

const link = "text-muted-foreground transition-colors hover:text-black";

function openChat() {
  window.dispatchEvent(new Event("open-support-chat"));
}

const LANGUAGES = [
  { code: "en-US", label: "English (United States)" },
  { code: "en-GB", label: "English (United Kingdom)" },
  { code: "es", label: "Español" },
  { code: "zh-Hant", label: "繁體中文 (Traditional)" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "ko", label: "한글" },
  { code: "ja", label: "日本語" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "th", label: "ไทย" },
];

/* Badges. Simple drawn versions; swap in the official artwork files when you have them. */
function Badges() {
  return (
    <ul
      className="mt-3 flex items-center justify-center gap-3"
      aria-label="Age restriction and accepted cards">
      <li>
        <img src="/asset/rta_icon.png" alt="" className="h-[24px] w-auto" />
      </li>
      <li>
        <svg
          viewBox="0 0 66 34"
          className="h-[24px] w-auto"
          role="img"
          aria-label="Visa">
          <rect width="66" height="34" rx="2" fill="#1a1f71" />
          <text
            x="33"
            y="24"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="17"
            letterSpacing="0.5"
            fill="#fff">
            VISA
          </text>
        </svg>
      </li>
      <li>
        <svg
          viewBox="0 0 66 34"
          className="h-[24px] w-auto"
          role="img"
          aria-label="Mastercard">
          <rect width="66" height="34" rx="2" fill="#000" />
          <circle cx="27" cy="17" r="10.5" fill="#eb001b" />
          <circle cx="39" cy="17" r="10.5" fill="#f79e1b" />
          <path
            d="M33 8.6a10.5 10.5 0 0 1 0 16.8 10.5 10.5 0 0 1 0-16.8Z"
            fill="#ff5f00"
          />
        </svg>
      </li>
    </ul>
  );
}

function applyLanguage(code: string) {
  document.documentElement.lang = code;
  try {
    localStorage.setItem("lang", code);
  } catch {
    /* ignore */
  }
}

function Language() {
  const [code, setCode] = useState("en-US");

  // Restore the saved choice after hydration.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("lang");
        if (saved && LANGUAGES.some((l) => l.code === saved)) {
          setCode(saved);
          document.documentElement.lang = saved;
        }
      } catch {
        /* ignore */
      }
    });
  }, []);

  function choose(next: string) {
    setCode(next);
    applyLanguage(next);
  }

  const current = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

  return (
    <Popover
      label="Choose language"
      buttonClass="group inline-flex items-center gap-3 rounded-md hover:cursor-pointer border bg-card px-5 py-3 text-[12px] font-semibold shadow-sm hover:border-primary/50"
      panelClass="absolute bottom-full left-1/2 z-50 mb-2 max-h-72 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-2xl border bg-card py-1 text-left shadow-xl animate-in fade-in zoom-in-95 duration-150"
      button={
        <>
          {current.label}
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
        </>
      }>
      {(close) => (
        <ul role="listbox" aria-label="Language">
          {LANGUAGES.map((l) => {
            const active = l.code === code;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  onClick={() => {
                    choose(l.code);
                    close();
                  }}
                  className={`flex w-full items-center  justify-between px-4 py-3 text-left text-base transition-colors ${
                    active
                      ? "bg-primary/10 font-bold text-primary"
                      : "hover:bg-secondary"
                  }`}>
                  {l.label}
                  {active && <Check className="size-5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Popover>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-background px-4 pb-36 pt-5 text-center md:pb-20">
      {/* Desktop link rows */}
      <nav aria-label="Footer" className="hidden text-[12px] md:block">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {ROW_ONE_LEFT.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={link}>
                {l.label}
              </Link>
            </li>
          ))}
          {/* <li>
            <button onClick={openChat} className={link}>
              Support chat
            </button>
          </li> */}
          <li aria-hidden="true" className="h-5 w-px bg-border" />
          {ROW_ONE_RIGHT.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {ROW_TWO.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {ROW_THREE.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: four plain links */}
      <nav aria-label="Footer" className="md:hidden">
        <ul className="flex items-center justify-center gap-x-10 text-sm font-semibold">
          {GROUPS.map((g) => (
            <li key={g.label}>
              <Link href={g.href} className="block py-1">
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4">
        <Language />
      </div>

      <p className="mt-4 hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 md:flex text-[11px] text-muted-foreground">
        <span>Support:</span>
        {["888-575-8383 US", "0800 098 8311 UK", "1800 954 607 AU"].map((n) => (
          <button
            key={n}
            onClick={openChat}
            className="font-semibold text-black/35 hover:text-black hover:underline">
            {n}
          </button>
        ))}
      </p>

      {/* Mobile order: notice, copyright, badges. Desktop: badges, notice, copyright. */}
      <div className="flex flex-col md:block">
        <div className="order-3 mt-1 md:mt-0">
          <Badges />
        </div>

        <p className="order-1 mx-auto mt-4 max-w-xl text-base font-bold uppercase leading-snug tracking-tight text-foreground/80 md:mt-3 md:text-xl">
          ADULTFRIENDFINDER DOES NOT
          <br className="md:hidden" /> CONDUCT CRIMINAL BACKGROUND
          <br className="md:hidden" /> SCREENING OF ITS MEMBERS.
        </p>

        <p className="order-2 mt-2 text-[10px] text-muted-foreground">
          © 1996-2026 Various, Inc. All
          <br className="md:hidden" /> rights reserved. AdultFriendFinder®
          <span className="mx-2 hidden md:inline">·</span>
          <Link
            href="/events"
            className="hidden underline underline-offset-2 hover:text-black md:inline">
            Legal
          </Link>
        </p>
      </div>

      <p className="mx-auto hidden md:flex mt-3 max-w-2xl text-[9px] text-muted-foreground/70">
        AdultFriendFinder®, Adult Friend Finder℠, AFF®, FriendFinder Networks℠,
        and the FriendFinder Networks logo are service marks of Various Inc.
      </p>
    </footer>
  );
}
