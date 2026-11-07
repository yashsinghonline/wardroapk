import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  HardDrive,
  Heart,
  Home,
  Layers,
  Moon,
  Plus,
  Share2,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  WifiOff,
} from 'lucide-react';

export const APK_URL = '/downloads/wardro.apk';
export const APK_FILENAME = 'wardro.apk';
const APP_VERSION = 'v1.0.0';

interface LandingPageProps {
  onLaunchApp: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'screens', label: 'Screens' },
  { id: 'how', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
];

const PROPORTIONS = [
  { label: 'Tops', sub: 'Essential basics & shirts', pct: 28, bg: '#1E1E1E', fg: '#F9F6F0' },
  { label: 'Shoes', sub: 'Footwear & boots', pct: 24, bg: '#BA9B67', fg: '#FFFDF8' },
  { label: 'Bottoms', sub: 'Trousers, denim & skirts', pct: 18, bg: '#7C8974', fg: '#FFFDF8' },
  { label: 'Accessories', sub: 'Bags, jewelry & belts', pct: 16, bg: '#D9CFCC', fg: '#1C1B1A' },
  { label: 'Outerwear', sub: 'Coats & blazers', pct: 14, bg: '#E3DAD5', fg: '#1C1B1A' },
];

const FAQS = [
  {
    q: 'Is Wardro free to use?',
    a: 'Yes. Wardro is free, carries no ads, and never asks you to create an account. Your wardrobe, looks, and chronicle belong to you alone.',
  },
  {
    q: 'Where is my wardrobe data stored?',
    a: 'Everything lives on your device in high-capacity browser storage (IndexedDB). Photos, outfits, calendar entries, and wishlist links never leave your phone unless you export a backup yourself.',
  },
  {
    q: 'Does it work offline?',
    a: 'Your wardrobe, outfit composer, Style Chronicle, and analytics are fully available offline. Only fetching a fresh wishlist link preview requires a connection.',
  },
  {
    q: 'How do I install the Android APK?',
    a: 'Tap “Download App”, open the downloaded wardro.apk, and allow installation from your browser when prompted. The whole process takes under a minute.',
  },
  {
    q: 'Can I use it without installing anything?',
    a: 'Absolutely. The full studio runs in your browser — tap “Open the web studio” anywhere on this page and start uploading your pieces immediately.',
  },
];

/* ------------------------------------------------------------------ */
/* Phone mockups — editorial marketing screens                         */
/* ------------------------------------------------------------------ */

const PhoneFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`phone-frame ${className}`}>
    <div className="phone-notch" />
    <div className="relative h-full w-full overflow-hidden" style={{ background: '#F9F6F0', color: '#1C1B1A' }}>
      {children}
    </div>
  </div>
);

const MockAlternatives: React.FC = () => (
  <div className="flex h-full flex-col px-4 pb-4 pt-9">
    <div className="flex items-center justify-between">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E2DACD] bg-white">
        <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
      </span>
      <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-[#97783F]">Outfit Alternatives</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E2DACD] bg-white">
        <Share2 className="h-3 w-3" strokeWidth={1.5} />
      </span>
    </div>
    <h3 className="mt-3 text-center font-serif-display text-[19px] leading-tight">Three ways to wear it.</h3>
    <p className="mt-1 text-center text-[6.5px] font-bold uppercase tracking-[0.16em] text-[#97783F]">
      Styling the classic black blazer
    </p>
    <div className="mt-3 rounded-[14px] border border-[#BA9B67] bg-[#F7F3EB] p-2">
      <div className="aspect-square overflow-hidden rounded-[10px]">
        <img src="/images/alt-minimal.jpg" alt="Minimal blazer flat-lay" className="h-full w-full object-cover" />
      </div>
      <p className="mt-2 font-serif-display text-[14px]">Minimal</p>
      <p className="text-[7.5px] text-[#6E675D]">Blazer · White Tee · Trousers</p>
    </div>
    <div className="mt-3 flex items-center justify-center gap-1">
      <span className="h-1 w-4 rounded-full bg-[#1E1E1E]" />
      <span className="h-1 w-1 rounded-full bg-[#CFC4B2]" />
      <span className="h-1 w-1 rounded-full bg-[#CFC4B2]" />
    </div>
  </div>
);

const MockProportions: React.FC = () => (
  <div className="flex h-full flex-col px-4 pb-4 pt-9">
    <div className="flex items-center justify-between">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E2DACD] bg-white">
        <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
      </span>
      <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-[#97783F]">Proportions</span>
      <span className="w-6" />
    </div>
    <h3 className="mt-3 font-serif-display text-[19px] leading-[1.15]">
      A more balanced
      <br />
      wardrobe.
    </h3>
    <div className="mt-3 space-y-1.5">
      {PROPORTIONS.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-[9px] px-2.5 py-1.5"
          style={{ background: row.bg, color: row.fg }}
        >
          <div>
            <p className="text-[6.5px] font-bold uppercase tracking-[0.12em]">{row.label}</p>
            <p className="text-[6px] opacity-75">{row.sub}</p>
          </div>
          <span className="font-serif-display text-[13px] italic">{row.pct}%</span>
        </div>
      ))}
    </div>
    <div className="mt-2.5 rounded-[9px] border-l-2 border-[#BA9B67] bg-[#F3EFE7] px-2.5 py-2">
      <p className="font-serif-display text-[8px] italic leading-snug">
        “Your wardrobe is footwear-heavy compared with your actual usage.”
      </p>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <div className="rounded-[9px] bg-[#F3EFE7] px-2 py-1.5">
        <p className="text-[5.5px] font-bold uppercase tracking-[0.12em] text-[#6E675D]">Most Versatile</p>
        <p className="font-serif-display text-[11px]">Shirts</p>
      </div>
      <div className="rounded-[9px] bg-[#F3EFE7] px-2 py-1.5">
        <p className="text-[5.5px] font-bold uppercase tracking-[0.12em] text-[#6E675D]">Most Underused</p>
        <p className="font-serif-display text-[11px] text-[#97783F]">Formalwear</p>
      </div>
    </div>
  </div>
);

const CAL_THUMBS: Record<number, string> = {
  2: '/images/alt-minimal.jpg',
  5: '/images/alt-smart.jpg',
  8: '/images/alt-weekend.jpg',
  11: '/images/alt-smart.jpg',
  14: '/images/alt-minimal.jpg',
  17: '/images/alt-weekend.jpg',
  20: '/images/alt-smart.jpg',
  23: '/images/alt-minimal.jpg',
  26: '/images/alt-weekend.jpg',
};

const MockChronicle: React.FC = () => (
  <div className="flex h-full flex-col px-4 pb-3 pt-9">
    <p className="text-[6.5px] font-bold uppercase tracking-[0.16em] text-[#97783F]">Style Chronicle</p>
    <h3 className="mt-0.5 font-serif-display text-[18px] leading-tight">Your style, over time.</h3>
    <div className="mt-2 flex items-center justify-between">
      <div className="flex items-center rounded-full border border-[#E2DACD] bg-white p-0.5">
        <span className="rounded-full bg-[#1E1E1E] px-2.5 py-0.5 text-[6.5px] font-semibold text-[#F9F6F0]">Month</span>
        <span className="px-2.5 py-0.5 text-[6.5px] font-semibold text-[#6E675D]">Week</span>
      </div>
      <span className="font-serif-display text-[10px]">
        September <span className="text-[#97783F]">2026</span>
      </span>
    </div>
    <div className="mt-2 grid grid-cols-7 gap-[3px]">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <span key={i} className="text-center text-[5.5px] font-bold tracking-[0.1em] text-[#9A9184]">
          {d}
        </span>
      ))}
      {Array.from({ length: 31 }, (_, i) => {
        const day = i; // 1 offset blank
        if (day === 0) return <span key={i} className="aspect-square rounded-[5px] bg-[#F3EFE7] opacity-40" />;
        const thumb = CAL_THUMBS[day];
        return (
          <span key={i} className="relative aspect-square overflow-hidden rounded-[5px] bg-[#EFECE6]">
            {thumb ? (
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="absolute left-1 top-0.5 text-[5.5px] font-semibold text-[#6E675D]">{day}</span>
            )}
          </span>
        );
      })}
    </div>
    <div className="mt-2.5 space-y-1.5 border-t border-[#E2DACD] pt-2">
      {[
        { dot: '#1E1E1E', label: 'Most Worn', value: 'Black Blazer · 3x' },
        { dot: '#7C8974', label: 'Repeated Outfits', value: 'Minimal Edit · 2x' },
        { dot: '#BA9B67', label: 'Unused Pieces', value: 'Linen Shirt · 0x' },
      ].map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.dot }} />
            <span className="text-[6.5px] font-bold uppercase tracking-[0.12em]">{row.label}</span>
          </span>
          <span className="text-[6.5px] text-[#6E675D]">{row.value}</span>
        </div>
      ))}
    </div>
    <div className="mt-auto flex items-center justify-around rounded-full border border-[#E2DACD] bg-white px-2 py-1.5">
      <Home className="h-3 w-3 text-[#9A9184]" strokeWidth={1.5} />
      <Shirt className="h-3 w-3 text-[#9A9184]" strokeWidth={1.5} />
      <span className="flex flex-col items-center">
        <Sparkles className="h-3 w-3" strokeWidth={1.5} />
        <span className="mt-0.5 h-0.5 w-0.5 rounded-full bg-[#BA9B67]" />
      </span>
      <TrendingUp className="h-3 w-3 text-[#9A9184]" strokeWidth={1.5} />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, theme, onToggleTheme }) => {
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const heroPhoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sectionIds = ['features', 'screens', 'how', 'download', 'faq'];
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        let current = '';
        sectionIds.forEach((id) => {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 140) current = id;
        });
        setActiveSection(current);
        if (heroPhoneRef.current) {
          heroPhoneRef.current.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.06, 60)}px, 0)`;
        }
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (id && id !== 'app') {
      const el = document.getElementById(id);
      if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${APK_URL}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="editorial-bg paper-grain min-h-screen theme-text-primary relative">
      {/* Fixed navigation */}
      <header
        className="fixed inset-x-0 top-0 z-40 border-b transition-colors duration-200"
        style={{
          borderColor: scrolled ? 'var(--border-color)' : 'transparent',
          backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg-app) 90%, transparent)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-left cursor-pointer">
            <p className="eyebrow !text-[8px]">Wardrobe & Style Chronicle</p>
            <span className="font-serif-display text-[21px] leading-none theme-text-primary">Wardro</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Landing sections">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="relative min-h-[40px] px-3 text-[12px] font-semibold transition-colors cursor-pointer"
                style={{ color: activeSection === link.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {link.label}
                <span
                  className="absolute inset-x-3 bottom-1.5 h-[2px] rounded-full transition-opacity"
                  style={{ backgroundColor: 'var(--accent-ochre)', opacity: activeSection === link.id ? 1 : 0 }}
                />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggleTheme} aria-label="Toggle theme" className="circle-btn !h-10 !w-10">
              {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
            </button>
            <button type="button" onClick={onLaunchApp} className="hidden min-h-[40px] px-4 rounded-full border theme-border text-[11px] font-semibold uppercase tracking-[0.1em] sm:inline-flex items-center cursor-pointer">
              Open studio
            </button>
            <a
              href={APK_URL}
              download={APK_FILENAME}
              className="min-h-[40px] px-4 rounded-full pill-dark text-[11px] font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Download App
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:pt-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div data-reveal>
              <p className="eyebrow">The considered wardrobe, in your pocket</p>
              <h1 className="mt-4 font-serif-display text-[44px] leading-[1.04] sm:text-[58px] lg:text-[64px] theme-text-primary">
                Dress with intention.
                <br />
                <span className="italic" style={{ color: 'var(--accent-ochre-deep)' }}>
                  Remember every look.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-[1.6] theme-text-secondary">
                Wardro turns the clothes you already own into an edited lookbook — compose outfits across
                categories, plan them on a monthly chronicle, and understand your wardrobe through quiet, beautiful
                analytics.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={APK_URL}
                  download={APK_FILENAME}
                  className="group inline-flex min-h-[54px] items-center gap-2.5 rounded-full pill-dark px-7 text-[12px] font-semibold uppercase tracking-[0.12em] transition-transform hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" strokeWidth={1.5} />
                  Download App (APK)
                </a>
                <button
                  type="button"
                  onClick={onLaunchApp}
                  className="inline-flex min-h-[54px] items-center gap-2 rounded-full border theme-border px-6 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer hover:border-[#BA9B67]"
                >
                  Open the web studio <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { icon: ShieldCheck, label: 'Private by design' },
                  { icon: WifiOff, label: 'Works offline' },
                  { icon: HardDrive, label: 'On-device storage' },
                ].map((chip) => (
                  <span key={chip.label} className="inline-flex items-center gap-2 text-[12px] font-medium theme-text-secondary">
                    <chip.icon className="h-4 w-4" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero phone + floating chips */}
            <div className="relative mx-auto w-full max-w-[420px]" data-reveal style={{ transitionDelay: '120ms' }}>
              <div
                className="absolute -inset-10 rounded-full opacity-70 blur-3xl"
                style={{ background: 'radial-gradient(closest-side, rgba(186,155,103,0.28), rgba(124,137,116,0.14), transparent)' }}
              />
              <div ref={heroPhoneRef} className="relative will-change-transform">
                <PhoneFrame className="mx-auto aspect-[9/19] w-[280px] sm:w-[300px]">
                  <MockChronicle />
                </PhoneFrame>

                <div className="float-chip absolute -left-4 top-16 flex items-center gap-2 rounded-[14px] border theme-border px-3 py-2 shadow-sm sm:-left-10" style={{ backgroundColor: 'var(--bg-overlay)' }}>
                  <img src="/images/alt-minimal.jpg" alt="" className="h-9 w-9 rounded-[8px] object-cover" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--accent-ochre-deep)' }}>OOTD</p>
                    <p className="font-serif-display text-[13px] theme-text-primary">Minimal Edit</p>
                  </div>
                </div>

                <div className="float-chip absolute -right-2 top-40 rounded-[14px] border theme-border px-3 py-2 shadow-sm sm:-right-8" style={{ backgroundColor: 'var(--bg-overlay)', animationDelay: '1.4s' }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] theme-text-secondary">Shoes</p>
                  <p className="font-serif-display text-[18px] italic" style={{ color: 'var(--accent-ochre-deep)' }}>24%</p>
                  <div className="mt-1 h-1 w-16 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div className="h-full w-[24%] rounded-full" style={{ backgroundColor: 'var(--accent-ochre)' }} />
                  </div>
                </div>

                <div className="float-chip absolute -left-2 bottom-14 flex items-center gap-2 rounded-[14px] border theme-border px-3 py-2 shadow-sm sm:-left-8" style={{ backgroundColor: 'var(--bg-overlay)', animationDelay: '2.6s' }}>
                  <Calendar className="h-4 w-4" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] theme-text-secondary">Sep 18</p>
                    <p className="text-[11px] font-semibold theme-text-primary">Date Night</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="marquee border-y theme-border py-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
                {[
                  'Outfit of the Day',
                  'Three Ways to Wear It',
                  'Style Chronicle',
                  'Wardrobe Proportions',
                  'Wishlist Previews',
                  'Offline First',
                  'Import & Export',
                  'Light & Dark Editorial',
                ].map((phrase) => (
                  <span key={`${dup}-${phrase}`} className="flex items-center">
                    <span className="px-6 font-serif-display text-[18px] italic theme-text-secondary">{phrase}</span>
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: 'var(--accent-ochre)' }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section id="features" className="landing-section mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-xl" data-reveal>
            <p className="eyebrow">Features</p>
            <h2 className="mt-3 font-serif-display text-[34px] leading-[1.1] sm:text-[42px] theme-text-primary">
              An editorial toolkit for the clothes you own.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {/* Alternatives — wide */}
            <article className="editorial-card p-6 md:col-span-2" data-reveal>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Layers className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
                  <h3 className="mt-3 font-serif-display text-[24px] theme-text-primary">Outfit alternatives</h3>
                  <p className="mt-2 max-w-sm text-[13px] leading-[1.55] theme-text-secondary">
                    Pick one piece and see three considered ways to wear it — Minimal, Smart, Weekend — composed from
                    your own wardrobe and ready to wear today.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { img: '/images/alt-minimal.jpg', label: 'Minimal' },
                  { img: '/images/alt-smart.jpg', label: 'Smart' },
                  { img: '/images/alt-weekend.jpg', label: 'Weekend' },
                ].map((card) => (
                  <figure key={card.label} className="overflow-hidden rounded-[14px] border theme-border">
                    <img src={card.img} alt={`${card.label} flat-lay`} className="aspect-[4/5] w-full object-cover transition-transform duration-300 hover:scale-105" />
                    <figcaption className="px-3 py-2 font-serif-display text-[15px] theme-text-primary" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      {card.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </article>

            {/* Proportions */}
            <article className="editorial-card p-6" data-reveal style={{ transitionDelay: '80ms' }}>
              <TrendingUp className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} />
              <h3 className="mt-3 font-serif-display text-[24px] theme-text-primary">Wardrobe proportions</h3>
              <p className="mt-2 text-[13px] leading-[1.55] theme-text-secondary">
                Quiet analytics reveal what you own versus what you actually wear.
              </p>
              <div className="mt-5 space-y-2">
                {PROPORTIONS.slice(0, 4).map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-[10px] px-3 py-2" style={{ background: row.bg, color: row.fg }}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{row.label}</span>
                    <span className="font-serif-display text-[15px] italic">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Chronicle */}
            <article className="editorial-card p-6" data-reveal>
              <Calendar className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
              <h3 className="mt-3 font-serif-display text-[24px] theme-text-primary">Style chronicle</h3>
              <p className="mt-2 text-[13px] leading-[1.55] theme-text-secondary">
                A monthly calendar of every look, with occasions, notes, and most-worn insights.
              </p>
              <div className="mt-5 grid grid-cols-7 gap-1">
                {Array.from({ length: 21 }, (_, i) => {
                  const thumb = CAL_THUMBS[i + 1];
                  return (
                    <span key={i} className="aspect-square overflow-hidden rounded-[6px]" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
                    </span>
                  );
                })}
              </div>
            </article>

            {/* Wishlist */}
            <article className="editorial-card p-6" data-reveal style={{ transitionDelay: '80ms' }}>
              <Heart className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
              <h3 className="mt-3 font-serif-display text-[24px] theme-text-primary">Wishlist previews</h3>
              <p className="mt-2 text-[13px] leading-[1.55] theme-text-secondary">
                Paste any store link, see the piece in full, and jump back to the original product page when you are
                ready.
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-[14px] border theme-border p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <img src="/images/alt-weekend.jpg" alt="" className="h-14 w-14 rounded-[10px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold theme-text-primary">Striped Breton Tee</p>
                  <p className="text-[11px] theme-text-secondary">Myntra · saved link</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
              </div>
            </article>

            {/* Backup */}
            <article className="editorial-card p-6" data-reveal style={{ transitionDelay: '160ms' }}>
              <HardDrive className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} />
              <h3 className="mt-3 font-serif-display text-[24px] theme-text-primary">Yours to keep</h3>
              <p className="mt-2 text-[13px] leading-[1.55] theme-text-secondary">
                High-capacity on-device storage with one-tap JSON export and import. No cloud, no account, no lock-in.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Export .json', 'Import backup', 'Merge or replace'].map((chip) => (
                  <span key={chip} className="rounded-full border theme-border px-3 py-1.5 text-[11px] font-semibold theme-text-secondary" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* SCREENS */}
        <section id="screens" className="landing-section border-y theme-border py-20" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-xl text-center" data-reveal>
              <p className="eyebrow">The screens</p>
              <h2 className="mt-3 font-serif-display text-[34px] leading-[1.1] sm:text-[42px] theme-text-primary">
                Three screens. One daily ritual.
              </h2>
            </div>

            <div className="mt-12 flex snap-x snap-mandatory gap-8 overflow-x-auto pb-6 hide-scrollbar md:grid md:grid-cols-3 md:overflow-visible">
              {[
                { mock: <MockAlternatives />, caption: 'Outfit Alternatives', tilt: 'screen-tilt-left' },
                { mock: <MockProportions />, caption: 'Proportions', tilt: '' },
                { mock: <MockChronicle />, caption: 'Style Chronicle', tilt: 'screen-tilt-right' },
              ].map((screen, idx) => (
                <figure key={screen.caption} className="snap-center shrink-0" data-reveal style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className={`${screen.tilt} mx-auto w-[250px]`}>
                    <PhoneFrame className="aspect-[9/19] w-full">{screen.mock}</PhoneFrame>
                  </div>
                  <figcaption className="mt-6 text-center">
                    <p className="eyebrow !text-[10px]">{screen.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="landing-section mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-xl" data-reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-serif-display text-[34px] leading-[1.1] sm:text-[42px] theme-text-primary">
              From closet to chronicle in three moves.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                n: '01',
                icon: Camera,
                title: 'Upload your pieces',
                copy: 'Photograph complete outfits or individual garments. Add categories — including a default Complete Outfit slot — and tag them your way.',
              },
              {
                n: '02',
                icon: Layers,
                title: 'Compose the look',
                copy: 'Select two or more pieces across categories, name the look, set the occasion, and save it or wear it as today’s OOTD.',
              },
              {
                n: '03',
                icon: Calendar,
                title: 'Chronicle & understand',
                copy: 'Plan outfits on the monthly calendar, then let Proportions show what is versatile, what is repeated, and what awaits its first wear.',
              },
            ].map((step, idx) => (
              <article key={step.n} className="editorial-card relative overflow-hidden p-6" data-reveal style={{ transitionDelay: `${idx * 90}ms` }}>
                <span className="absolute -right-2 -top-5 font-serif-display text-[92px] italic leading-none opacity-[0.08] theme-text-primary">
                  {step.n}
                </span>
                <step.icon className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
                <p className="mt-4 eyebrow !text-[10px]">Step {step.n}</p>
                <h3 className="mt-1 font-serif-display text-[24px] theme-text-primary">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] theme-text-secondary">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* DOWNLOAD */}
        <section id="download" className="landing-section mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="editorial-card overflow-hidden" data-reveal>
            <div className="grid lg:grid-cols-2">
              <div className="p-7 sm:p-10">
                <p className="eyebrow">Get the app</p>
                <h2 className="mt-3 font-serif-display text-[34px] leading-[1.08] sm:text-[42px] theme-text-primary">
                  Carry your wardrobe
                  <br />
                  in your pocket.
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-[1.6] theme-text-secondary">
                  Install Wardro on Android and keep your lookbook, chronicle, and wishlist with you — fully
                  offline, fully private.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    'Android 8.0 or newer · universal APK',
                    'No account, no ads, no tracking',
                    'Your photos never leave your device',
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2.5 text-[13px] theme-text-secondary">
                      <Check className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} />
                      {line}
                    </li>
                  ))}
                </ul>

                <ol className="mt-7 space-y-2.5 border-t theme-border pt-6">
                  {[
                    'Download the APK below.',
                    'Allow installation from your browser when prompted.',
                    'Open Wardro and upload your first pieces.',
                  ].map((step, idx) => (
                    <li key={step} className="flex items-start gap-3 text-[13px] theme-text-secondary">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full pill-dark font-serif-display text-[12px] italic">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t theme-border p-7 sm:p-10 lg:border-l lg:border-t-0" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border theme-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] theme-text-secondary" style={{ backgroundColor: 'var(--bg-overlay)' }}>
                    <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} /> Android
                  </span>
                  <span className="rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--accent-sage-deep)', color: 'var(--accent-sage-deep)' }}>
                    Universal build
                  </span>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[18px] pill-dark">
                    <Layers className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-serif-display text-[26px] leading-none theme-text-primary">Wardro</p>
                    <p className="mt-1.5 text-[12px] theme-text-secondary">
                      {APP_VERSION} · {APK_FILENAME}
                    </p>
                  </div>
                </div>

                <a
                  href={APK_URL}
                  download={APK_FILENAME}
                  className="group mt-8 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[16px] pill-dark text-[13px] font-semibold uppercase tracking-[0.12em] transition-transform hover:-translate-y-0.5"
                >
                  <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" strokeWidth={1.5} />
                  Download App (APK)
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border theme-border text-[12px] font-semibold theme-text-primary transition-colors cursor-pointer hover:border-[#BA9B67]"
                >
                  {copied ? <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: 'var(--accent-sage-deep)' }} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                  {copied ? 'Link copied' : 'Copy download link'}
                </button>

                <p className="mt-5 rounded-[12px] border border-dashed theme-border px-4 py-3 font-mono text-[10.5px] leading-[1.6] theme-text-muted flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-sage-deep)' }} />
                  <span>
                    Android package ready (<span style={{ color: 'var(--accent-ochre-deep)' }}>wardro.apk</span> · 5.2 MB). Click above to install directly on your device.
                  </span>
                </p>

                <div className="mt-6 border-t theme-border pt-6">
                  <p className="text-[12px] theme-text-secondary">Prefer the browser?</p>
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="mt-2 inline-flex min-h-[46px] items-center gap-2 rounded-full border theme-border px-5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer hover:border-[#BA9B67]"
                  >
                    Open the web studio <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-section mx-auto max-w-3xl px-4 pb-24 sm:px-6">
          <div className="text-center" data-reveal>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-3 font-serif-display text-[32px] leading-[1.1] sm:text-[38px] theme-text-primary">
              Before you install.
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq, idx) => {
              const open = openFaq === idx;
              return (
                <div key={faq.q} className="editorial-card overflow-hidden" data-reveal style={{ transitionDelay: `${idx * 60}ms` }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : idx)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                  >
                    <span className="font-serif-display text-[18px] theme-text-primary">{faq.q}</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform duration-300"
                      strokeWidth={1.5}
                      style={{ transform: open ? 'rotate(180deg)' : 'none', color: 'var(--accent-ochre-deep)' }}
                    />
                  </button>
                  <div className={`faq-panel ${open ? 'open' : ''}`}>
                    <div>
                      <p className="px-5 pb-5 text-[13px] leading-[1.65] theme-text-secondary">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t theme-border py-16" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6" data-reveal>
            <Sparkles className="mx-auto h-6 w-6" strokeWidth={1.5} style={{ color: 'var(--accent-ochre)' }} />
            <h2 className="mt-4 font-serif-display text-[32px] leading-[1.1] sm:text-[40px] theme-text-primary">
              Your wardrobe is already enough.
              <br />
              <span className="italic" style={{ color: 'var(--accent-ochre-deep)' }}>Start wearing it on purpose.</span>
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href={APK_URL} download={APK_FILENAME} className="inline-flex min-h-[52px] items-center gap-2 rounded-full pill-dark px-7 text-[12px] font-semibold uppercase tracking-[0.12em]">
                <Download className="h-4 w-4" strokeWidth={1.5} /> Download App
              </a>
              <button type="button" onClick={onLaunchApp} className="inline-flex min-h-[52px] items-center gap-2 rounded-full border theme-border px-6 text-[12px] font-semibold uppercase tracking-[0.12em] cursor-pointer">
                <Plus className="h-4 w-4" strokeWidth={1.5} /> Try the web studio
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t theme-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-serif-display text-[22px] theme-text-primary">Wardro</p>
            <p className="mt-1 text-[12px] theme-text-secondary">Crafted for the considered wardrobe.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <button key={link.id} type="button" onClick={() => scrollTo(link.id)} className="text-[12px] font-semibold theme-text-secondary transition-colors cursor-pointer hover:text-[#BA9B67]">
                {link.label}
              </button>
            ))}
            <a href={APK_URL} download={APK_FILENAME} className="text-[12px] font-semibold theme-text-secondary transition-colors cursor-pointer hover:text-[#BA9B67]">
              Download App
            </a>
            <button type="button" onClick={onLaunchApp} className="text-[12px] font-semibold theme-text-secondary transition-colors cursor-pointer hover:text-[#BA9B67]">
              Open studio
            </button>
          </nav>
          <p className="text-[11px] theme-text-muted">© 2026 Wardro · {APP_VERSION}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
