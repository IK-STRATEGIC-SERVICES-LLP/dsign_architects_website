import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  MAPS_URL,
  STUDIO_ADDRESS,
  STUDIO_EMAIL,
  STUDIO_EMAIL_HREF,
  STUDIO_PHONE,
  STUDIO_PHONE_HREF,
} from "@/lib/contact";

const FOOTER_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/#services" },
  { label: "Team", href: "/team" },
  { label: "Process", href: "/#process" },
  { label: "Clients", href: "/#clients" },
  { label: "Contact", href: "/#contact" },
];

// lucide-react v1 dropped its brand glyphs, so the mark is drawn here in the
// same 24px / 2px-stroke idiom as the icons around it.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// The studio was founded in 2015, so the notice runs as a range from then to
// the current year rather than the current year alone — that is what actually
// claims the back catalogue. Same date the hero's "Established" stat cites.
const FOUNDED_YEAR = 2015;

const SOCIALS = [
  {
    network: "Instagram",
    // Instagram is the one profile the studio is known by its handle, so the
    // pill shows that rather than the platform name.
    label: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    Icon: InstagramIcon,
  },
  {
    network: "LinkedIn",
    label: "LinkedIn",
    href: LINKEDIN_URL,
    Icon: LinkedInIcon,
  },
];

const CONTACT_DETAILS = [
  { icon: Phone, href: STUDIO_PHONE_HREF, label: STUDIO_PHONE },
  { icon: Mail, href: STUDIO_EMAIL_HREF, label: STUDIO_EMAIL },
  { icon: MapPin, href: MAPS_URL, label: STUDIO_ADDRESS },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Logo + Contact (NAP) */}
          <div>
            <a href="/#top" aria-label="D'sign Architects — home">
              <Logo />
            </a>
            <address className="mt-5 flex flex-col gap-3 not-italic">
              {CONTACT_DETAILS.map((detail) => (
                <a
                  key={detail.label}
                  href={detail.href}
                  target={detail.icon === MapPin ? "_blank" : undefined}
                  rel={detail.icon === MapPin ? "noopener noreferrer" : undefined}
                  className="group flex items-start gap-2.5 text-sm text-mist transition-colors duration-200 hover:text-porcelain"
                >
                  <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <span>{detail.label}</span>
                </a>
              ))}
            </address>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer navigation" className="flex flex-col gap-3 md:items-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Quick Links
            </span>
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-mist transition-colors duration-200 hover:text-porcelain"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social */}
          <div className="flex flex-col gap-3 md:items-end">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Follow
            </span>
            {SOCIALS.map(({ network, label, href, Icon }) => (
              <a
                key={network}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`D'sign Architects on ${network} (opens in a new tab)`}
                className="group inline-flex w-fit items-center gap-3 rounded-full glass-gold py-2 pl-2 pr-5 transition-colors duration-200 hover:border-gold/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-gold group-hover:text-ink">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-mist transition-colors duration-200 group-hover:text-porcelain">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-white/10 pt-6 text-center text-sm text-mist md:flex-row md:justify-between md:text-left">
          <p>
            &copy; {FOUNDED_YEAR}&ndash;{new Date().getFullYear()}{" "}
            D&rsquo;Sign Architects. All rights reserved.
          </p>
          <p>
            Developed by{" "}
            <a
              href="https://www.ikstrategic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mist underline decoration-mist/40 underline-offset-2 transition-colors duration-200 hover:text-gold hover:decoration-gold"
            >
              www.ikstrategic.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
