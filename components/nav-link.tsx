"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  className: (active: boolean) => string;
  children: React.ReactNode;
  onClick?: () => void;
};

function Active({ href, className, children, onClick }: Props) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={className(active)}>
      {children}
    </Link>
  );
}

/** Link that highlights itself on the current route. usePathname needs Suspense with cacheComponents. */
export function NavLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} onClick={props.onClick} className={props.className(false)}>
          {props.children}
        </Link>
      }
    >
      <Active {...props} />
    </Suspense>
  );
}
