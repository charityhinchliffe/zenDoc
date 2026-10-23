"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
      <div className="shell header-bar">
        <a href="#top" className="brand-link" aria-label="zenDoc, back to top">
          <Wordmark />
        </a>

        <nav className="desk-nav" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <span className="nav-auth">
            <a className="btn btn-ghost" href="/login">
              Log in
            </a>
            <a className="btn btn-primary" href="/signup">
              Sign up
            </a>
          </span>
        </nav>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className={open ? "burger is-open" : "burger"}>
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="mobile-auth">
            <a className="btn btn-ghost" href="/login" onClick={() => setOpen(false)}>
              Log in
            </a>
            <a className="btn btn-primary" href="/signup" onClick={() => setOpen(false)}>
              Sign up
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
