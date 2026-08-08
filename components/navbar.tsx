"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { easeLuxe } from "@/components/motion-primitives";

const NAV_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/#services" },
  { label: "Team", href: "/team" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: easeLuxe }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"
    >
      <nav
        aria-label="Main navigation"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 transition-all duration-300 ${
          scrolled || menuOpen ? "glass-strong shadow-2xl shadow-black/40" : ""
        }`}
      >
        {/* Same shadow treatment as the links beside it: at the top of the
            home page the bar has no backing, and the hero opens on a bright
            sky and pale roof that the gold script would otherwise vanish
            into. */}
        <a
          href="/#top"
          aria-label="D'sign Architects — home"
          className="rounded-lg [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.6))] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded text-sm font-medium tracking-wide text-porcelain [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] transition-colors duration-200 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/#contact"
            className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2.5 text-sm font-semibold text-ink transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            Start a Project
          </a>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl glass text-porcelain md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: easeLuxe }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl glass-strong p-4 shadow-2xl shadow-black/40 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-porcelain transition-colors hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/#contact"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-4 py-3 text-center text-base font-semibold text-ink"
              >
                Start a Project
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
