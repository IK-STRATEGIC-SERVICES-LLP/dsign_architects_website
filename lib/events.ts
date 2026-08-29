export type EventEntry = {
  slug: string;
  title: string;
  location: string;
  /** ISO date (YYYY-MM-DD), so the timeline can sort and format it. */
  date: string;
  description: string;
  /** Empty when the studio hasn't supplied photos for this one yet. */
  images: string[];
};

// Hand-maintained — these are the studio's own event photos, not derived
// from the practice profile PDF, so there's no generator to keep in sync.
export const EVENTS: EventEntry[] = [
  {
    slug: "lg-new-evolution-westin-kp",
    title: "“The New Evolution” — LG Light Commercial ACs Launch",
    location: "The Westin, Koregaon Park, Pune",
    date: "2026-08-12",
    description:
      "D'sign Architects joined IKP Solutions LLP and LG on stage for the Pune launch of LG's new light commercial AC range, from the welcome address to felicitations for the evening's honourees.",
    images: [
      "/events/lg-new-evolution-westin-kp.jpg",
      "/events/lg-new-evolution-westin-kp-2.jpg",
      "/events/lg-new-evolution-westin-kp-3.jpg",
      "/events/lg-new-evolution-westin-kp-4.jpg",
      "/events/lg-new-evolution-westin-kp-5.jpg",
      "/events/lg-new-evolution-westin-kp-6.jpg",
      "/events/lg-new-evolution-westin-kp-7.jpg",
      "/events/lg-new-evolution-westin-kp-8.jpg",
      "/events/lg-new-evolution-westin-kp-9.jpg",
    ],
  },
  {
    slug: "satark-heroes-park-inauguration",
    title: "Satark Heroes Park Inauguration",
    location: "Wanowrie, Pune",
    date: "2024-10-06",
    description:
      "The studio's Satark Heroes Park design — a memorial to India's military intelligence martyrs — was inaugurated in Wanowrie, Pune, with the Indian Army and the project team on site.",
    images: [
      "/events/satark-heroes-park-inauguration.jpg",
      "/events/satark-heroes-park-inauguration-2.jpg",
    ],
  },
];

/** Most recent first, so the timeline reads like a news feed. */
export const EVENTS_BY_DATE: EventEntry[] = [...EVENTS].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
