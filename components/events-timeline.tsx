"use client";

import { CalendarDays, ImageOff, MapPin } from "lucide-react";
import { FocusSliceCarousel } from "@/components/focus-slice-carousel";
import { Reveal } from "@/components/motion-primitives";
import type { EventEntry } from "@/lib/events";

function formatEventDate(iso: string) {
  // Noon avoids the date rolling back a day in a negative-UTC-offset
  // browser, which midnight parsing is prone to.
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function EventsTimeline({ events }: { events: EventEntry[] }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* The spine every date marker sits on. */}
      <div
        aria-hidden
        className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-gold/70 via-white/15 to-transparent sm:left-[15px]"
      />

      <div className="flex flex-col gap-16">
        {events.map((event) => (
          <Reveal key={event.slug}>
            <article className="relative pl-8 sm:pl-12">
              <span
                aria-hidden
                className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-gold bg-ink sm:h-[31px] sm:w-[31px] sm:border-[3px]"
              />

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {formatEventDate(event.date)}
                </span>
                {event.location ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-mist">
                    <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {event.location}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-2 font-display text-2xl leading-snug text-porcelain sm:text-3xl">
                {event.title}
              </h3>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-mist">
                {event.description}
              </p>

              <div className="relative mt-6 aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10">
                {event.images.length > 0 ? (
                  <FocusSliceCarousel
                    images={event.images}
                    alt={event.title}
                    interactive
                    showArrows
                    focusRatio={5}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/[0.03] text-mist">
                    <ImageOff className="h-6 w-6 text-gold/70" aria-hidden />
                    <span className="text-sm">Photos coming soon</span>
                  </div>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
