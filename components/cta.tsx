"use client";

import Image from "next/image";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion-primitives";
import {
  MAPS_URL,
  STUDIO_ADDRESS,
  STUDIO_EMAIL,
  STUDIO_EMAIL_HREF,
  STUDIO_PHONES,
} from "@/lib/contact";

// Phones live in the primary call buttons above; the grid below carries the
// email and address only, so neither number is shown twice.
const CONTACT_DETAILS = [
  {
    icon: Mail,
    label: "Email us",
    value: STUDIO_EMAIL,
    href: STUDIO_EMAIL_HREF,
  },
  { icon: MapPin, label: "Visit", value: STUDIO_ADDRESS, href: MAPS_URL },
];

export function CTA() {
  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=2400&q=75"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-[2.5rem] glass-strong-gold p-10 text-center shadow-2xl shadow-black/40 sm:p-14">
            <span className="inline-flex items-center rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Limited Availability — Q4 2026
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl leading-tight tracking-tight text-porcelain sm:text-4xl lg:text-5xl">
              Your Site Has a Story.
              <br />
              <span className="bg-gradient-to-br from-porcelain via-gold-soft to-gold bg-clip-text text-transparent">
                Let&rsquo;s Design It.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
              Tell us about your site, brief and budget. We&rsquo;ll review it
              and show you what&rsquo;s possible before you commit to anything.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`${STUDIO_EMAIL_HREF}?subject=Project%20Enquiry`}
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-4 text-sm font-semibold text-ink transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                Contact Us
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </a>
              {STUDIO_PHONES.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full glass-gold px-8 py-4 text-sm font-semibold text-porcelain transition-colors duration-200 hover:bg-white/10 hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {phone.label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACT_DETAILS.map((detail) => (
            <StaggerItem key={detail.href}>
              <a
                href={detail.href}
                {...(detail.href === MAPS_URL
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex h-full items-start gap-4 rounded-2xl glass-gold p-5 transition-colors duration-200 hover:border-gold/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition-colors duration-300 group-hover:bg-gold/20">
                  <detail.icon className="h-5 w-5 text-gold" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-mist">
                    {detail.label}
                  </div>
                  <div className="break-words text-sm font-medium text-porcelain">
                    {detail.value}
                  </div>
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
