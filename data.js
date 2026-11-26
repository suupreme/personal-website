/*
 * ─────────────────────────────────────────────────────────────
 *  SITE CONTENT — edit this file to update the site.
 *  Dates are decimal years: ym(2026, 2) = Feb 2026.
 *  `end: null` means "Present".
 * ─────────────────────────────────────────────────────────────
 */
const ym = (y, m) => y + (m - 1) / 12;
const NOW = ym(2026, 11);

window.SITE = {
  name: "Daniel Cheng",
  school: "University of Florida",
  degree: "B.S. Computer Science",
  grad: "May 2028",
  status: "Seeking Summer 2027 SWE internships",
  email: "dcheng138@gmail.com",
  links: {
    github: "https://github.com/suupreme",
    linkedin: "https://www.linkedin.com/in/chengus",
    resume: "assets/Daniel_Cheng_Resume.pdf",
  },
  now: NOW,
  range: [ym(2021, 4), ym(2027, 10)],

  /* Each track is also an audio stem in the session loop. */
  tracks: [
    { id: "code",     name: "Code",           stem: "hi-hats", color: "#4cc9f0", texture: "midi" },
    { id: "research", name: "Research",       stem: "bass",    color: "#a3e635", texture: "wave" },
    { id: "visuals",  name: "Design & Video", stem: "snare",   color: "#f472b6", texture: "film" },
    { id: "people",   name: "People",         stem: "kick",    color: "#fbbf24", texture: "pulse" },
    { id: "music",    name: "Keys",           stem: "chords",  color: "#a78bfa", texture: "midi" },
  ],

  clips: [
    /* ── CODE ─────────────────────────────────────────── */
    {
      id: "gatorlator", track: "code", featured: 1,
      title: "Gatorlator", sub: "SwampHacks XI · Winner",
      start: ym(2026, 1), end: ym(2026, 2), // TODO: confirm hackathon date
      summary: "A Chrome extension that translates live tab audio so ESL and international students can follow lectures, YouTube, and anything else playing in the browser.",
      bullets: [
        "Sub-500ms end-to-end latency across 10 languages by chaining Deepgram (speech-to-text), DeepL (translation) and ElevenLabs (text-to-speech).",
        "Worked around Chrome Manifest V3 audio limits with an offscreen document and a message-passing pipeline that streams 5-second media chunks in the background.",
      ],
      tags: ["JavaScript", "Chrome MV3", "Web Audio API"],
      award: "🏆 SwampHacks XI Winner",
    },
    {
      id: "fullr", track: "code", featured: 2,
      title: "Fullr", sub: "iOS + Web surplus-food marketplace",
      start: ym(2026, 3), end: ym(2026, 8), // TODO: confirm project dates
      summary: "A marketplace that connects students with discounted surplus meals from local businesses, fighting campus food insecurity and food waste.",
      bullets: [
        "Built the student-facing web portal in React + Vite for browsing affordable surplus meals.",
        "Built a merchant dashboard for real-time offer management and onboarding, so local businesses recover revenue from surplus inventory.",
        "Designed an ACID-compliant Supabase (PostgreSQL) schema with custom routing triggers for multi-role auth across iOS and web.",
      ],
      tags: ["Swift", "React", "Node.js", "PL/pgSQL", "Supabase", "Firebase"],
    },
    {
      id: "mdom", track: "code", featured: 6,
      title: "IT Consultant", sub: "MD Oriental Market · Tampa",
      start: ym(2021, 10), end: null,
      summary: "Running the digital side of a family-scale grocery store: website, SEO, promos and social.",
      bullets: [
        "Increased website traffic by 43% by revamping the Wix store's layout and visual design.",
        "Improved organic search visibility with metadata, page-structure and keyword SEO work.",
        "Designed in-store promos and social campaigns reaching 700+ daily customers.",
        "Customer service in English, Mandarin and Cantonese.",
      ],
      tags: ["Web Design", "SEO", "Marketing"],
    },
    {
      id: "cyber", track: "code",
      title: "Cybersecurity Club VP", sub: "WRHS",
      start: ym(2024, 2), end: ym(2025, 5),
      summary: "Helped lead my high school's cybersecurity club through workshops, competitions and outreach.",
      bullets: [
        "Placed 3rd in Florida (Silver Tier) in the Air & Space Forces Association's CyberPatriot, hardening Windows systems against attacks.",
        "Organized tours of Schweitzer Engineering Laboratories (SEL) and taught online safety to a local Girl Scouts chapter.",
        "Raised $160 through fundraising.",
      ],
      tags: ["Security", "Leadership"],
    },
    {
      id: "intern", track: "code", ghost: true,
      title: "SWE Intern", sub: "Summer 2027 · your team?",
      start: ym(2027, 5), end: ym(2027, 8),
      summary: "This slot is open. I'm looking for a Summer 2027 software engineering internship, and I bring systems work in Rust, full-stack product experience, and a hackathon-winning bias for shipping.",
      bullets: [],
      tags: ["Open to offers"],
    },

    /* ── RESEARCH ─────────────────────────────────────── */
    {
      id: "biovision", track: "research", featured: 3,
      title: "BioVision Lab", sub: "Florida Museum of Natural History",
      start: ym(2026, 9), end: null,
      summary: "Undergraduate Research Assistant building ML infrastructure for biodiversity research.",
      bullets: [
        "Engineering a high-performance, GPU-agnostic inference engine in Rust to speed up ML model deployment across mobile and desktop architectures.",
      ],
      tags: ["Rust", "ML Inference", "Systems"],
    },
    {
      id: "sightscribe", track: "research", featured: 4,
      title: "SightScribe", sub: "Deep learning research · UIUC (remote)",
      start: ym(2023, 8), end: ym(2024, 8),
      summary: "An image-captioning model that makes images accessible to blind and low-vision users, built with mentorship from a UIUC MS candidate.",
      bullets: [
        "Fine-tuned a multimodal transformer on 30,000+ images with PyTorch.",
        "Wrote a custom PyTorch Dataset/DataLoader pipeline and AdamW training loop, steadily reducing loss over 50 epochs.",
        "Enabled real-time assistive captioning with OpenCV preprocessing and Hugging Face AutoProcessor generation.",
      ],
      tags: ["Python", "PyTorch", "Hugging Face", "OpenCV"],
    },

    /* ── DESIGN & VIDEO ───────────────────────────────── */
    {
      id: "genesis", track: "visuals", featured: 5,
      title: "Videographer", sub: "Genesis Dance Crew",
      start: ym(2025, 9), end: ym(2026, 7),
      summary: "Filmed performances, edited dance covers and made social graphics for UF's biggest K-pop dance team.",
      bullets: [
        "UF VSO Tết Trung Thu 2025: filming",
        "Genesis Showcase 2025: graphic design and editing",
        "Cover of “Kiss & Tell” by ITZY: graphic design and editing",
        "UF KUSA Seollal 2026: filming",
        "Cover of “REDRED” by CORTIS: editing",
      ],
      // Approximate dates, shown as markers on the clip. TODO: adjust.
      markers: [
        { at: ym(2025, 10), label: "VSO Tết Trung Thu 2025" },
        { at: ym(2025, 11), label: "Genesis Showcase 2025" },
        { at: ym(2026, 1), label: "Kiss & Tell cover" },
        { at: ym(2026, 2), label: "KUSA Seollal 2026" },
        { at: ym(2026, 4), label: "REDRED cover" },
      ],
      tags: ["Videography", "Premiere / editing", "Graphic Design"],
      // links: [{ label: "Watch on YouTube", href: "https://..." }],
    },
    {
      id: "gud-design", track: "visuals",
      title: "Gator User Design", sub: "UI/UX club member",
      start: ym(2025, 9), end: null, // TODO: confirm when you joined
      summary: "Member of UF's UI/UX design club. This is where Figma case studies will go.",
      bullets: [],
      tags: ["Figma", "UI/UX"],
    },

    /* ── PEOPLE ───────────────────────────────────────── */
    {
      id: "ssd", track: "people", featured: 7,
      title: "Industry Relations", sub: "Society of Software Developers",
      start: ym(2026, 2), end: null,
      summary: "Industry Relations Coordinator bringing engineers, recruiters and alumni to a 350-member developer club.",
      bullets: [
        "Brought in guest speakers for general body meetings and technical workshops by recruiting industry professionals through LinkedIn.",
        "Expanded networking for 350 members by coordinating outreach with alumni across tech fields.",
        "Ran a structured follow-up system for 20+ prospective speakers and collaborators.",
      ],
      tags: ["Outreach", "Partnerships", "LinkedIn"],
    },
    {
      id: "gud", track: "people",
      title: "Fundraising Director", sub: "Gator User Design",
      start: ym(2026, 4), end: null,
      summary: "Securing company sponsorships and catering for GUD events.",
      bullets: ["Securing company sponsorships and catering for events."],
      tags: ["Sponsorships", "Fundraising"],
    },
    {
      id: "fbla", track: "people",
      title: "FBLA Treasurer → Secretary", sub: "Future Business Leaders of America",
      start: ym(2024, 1), end: ym(2025, 5),
      summary: "Chapter officer for a 100+ member business club.",
      bullets: [
        "Treasurer: kept the books for club funds and led fundraisers with local businesses and restaurants that raised over $400.",
        "Secretary: kept records and member information so a 100+ member chapter ran smoothly.",
      ],
      tags: ["Leadership", "Fundraising"],
    },
    {
      id: "impact", track: "people",
      title: "Student Leader", sub: "Impact Florida",
      start: ym(2022, 9), end: ym(2023, 5),
      summary: "Chosen to represent my high school in the pilot Youth Participatory Evaluation program, working with students and educators statewide.",
      bullets: [
        "Researched and presented solutions to student concerns alongside peers from across Florida.",
        "Worked with administration to open building window blinds for natural light, and to enforce a fairer revised tardy policy.",
      ],
      tags: ["Advocacy", "High Agency"],
    },

    /* ── KEYS / MUSIC ─────────────────────────────────── */
    {
      id: "piano", track: "music",
      title: "Piano · Pop & Hip-Hop · Theory", sub: "Always on",
      start: ym(2021, 7), end: null,
      summary: "Piano player and music-theory nerd who loves pop and hip-hop. The loop playing on this page is a ii–V–I–vi in C, sequenced in code.",
      bullets: ["Recordings coming soon. Meanwhile, play the keyboard further down the page."],
      tags: ["Piano", "Music Theory", "Production"],
      // links: [{ label: "SoundCloud", href: "https://..." }],
    },
  ],

  /* "Levels": impact numbers */
  stats: [
    { value: "350", label: "club members connected to industry", track: "people" },
    { value: "43%", label: "website traffic lift for a local business", track: "code" },
    { value: "<500ms", label: "live translation latency (Gatorlator)", track: "code" },
    { value: "30k+", label: "images used to fine-tune SightScribe", track: "research" },
    { value: "700+", label: "daily customers reached by my promos", track: "visuals" },
    { value: "3", label: "languages: English, Mandarin, Cantonese", track: "people" },
  ],

  skills: {
    Languages: ["Python", "C++", "Java", "JavaScript", "Rust", "SQL", "Swift", "Dart", "HTML/CSS", "Assembly"],
    Frameworks: ["React", "Next.js", "Node.js", "Flutter", "PyTorch", "Hugging Face", "NumPy", "pandas", "Vite"],
    Tools: ["Git", "Docker", "Figma", "Unity", "Firebase", "Supabase", "Vercel", "Shell"],
  },
};
