import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Share2, Sparkles } from 'lucide-react';
import {
  CategoryDefinition,
  SavedOutfit,
  WardrobeItem,
} from '../types/outfit';
import { ApparelVisual } from './ApparelVisual';
import { FullImagePreviewModal, PreviewSlide } from './FullImagePreviewModal';

interface OutfitAlternativesProps {
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  onBack: () => void;
  onShare: (title: string, text: string) => void;
  onCompose: () => void;
  onUpload: () => void;
  onWear: (title: string, occasion: string, items: WardrobeItem[]) => void;
}

interface AlternativeCard {
  id: string;
  label: string;
  occasion: string;
  breakdown: string;
  imageUrl: string;
  items: WardrobeItem[];
  isInspiration: boolean;
}

const INSPIRATION: Array<{
  label: string;
  occasion: string;
  breakdown: string;
  imageUrl: string;
}> = [
  {
    label: 'Minimal',
    occasion: 'Everyday',
    breakdown: 'Blazer · White Tee · Trousers',
    imageUrl: '/images/alt-minimal.jpg',
  },
  {
    label: 'Smart',
    occasion: 'Work / Office',
    breakdown: 'Blazer · Oxford Shirt · Tailored Trousers',
    imageUrl: '/images/alt-smart.jpg',
  },
  {
    label: 'Weekend',
    occasion: 'Casual',
    breakdown: 'Blazer · Striped Tee · Denim',
    imageUrl: '/images/alt-weekend.jpg',
  },
];

const STYLE_LABELS = ['Minimal', 'Smart', 'Weekend'];
const STYLE_OCCASIONS = ['Everyday', 'Work / Office', 'Casual'];

export const OutfitAlternatives: React.FC<OutfitAlternativesProps> = ({
  categories,
  wardrobe,
  savedOutfits,
  onBack,
  onShare,
  onCompose,
  onUpload,
  onWear,
}) => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [previewSlides, setPreviewSlides] = useState<PreviewSlide[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const anchor = useMemo(() => {
    if (wardrobe.length === 0) return null;
    const usage = new Map<string, number>();
    savedOutfits.forEach((o) =>
      o.items.forEach((i) => usage.set(i.id, (usage.get(i.id) || 0) + 1))
    );
    const blazer = wardrobe.find((i) =>
      /blazer|black|jacket|coat/i.test(i.title)
    );
    if (blazer) return blazer;
    const sorted = [...wardrobe].sort(
      (a, b) => (usage.get(b.id) || 0) - (usage.get(a.id) || 0)
    );
    return sorted[0];
  }, [wardrobe, savedOutfits]);

  const cards = useMemo<AlternativeCard[]>(() => {
    if (!anchor || wardrobe.length < 2) {
      return INSPIRATION.map((insp, idx) => ({
        id: `inspiration-${idx}`,
        label: insp.label,
        occasion: insp.occasion,
        breakdown: insp.breakdown,
        imageUrl: insp.imageUrl,
        items: [],
        isInspiration: true,
      }));
    }

    const otherPools = categories
      .filter((c) => c.id !== anchor.categoryId && !c.isCompleteOutfit)
      .map((c) => ({
        category: c,
        items: wardrobe.filter((i) => i.categoryId === c.id),
      }))
      .filter((p) => p.items.length > 0);

    return STYLE_LABELS.map((label, idx) => {
      const chosen: WardrobeItem[] = [anchor];
      otherPools.forEach((pool, poolIdx) => {
        const pick = pool.items[(idx + poolIdx) % pool.items.length];
        if (pick && !chosen.some((c) => c.id === pick.id)) chosen.push(pick);
      });
      // Ensure at least 2 pieces when possible
      if (chosen.length < 2) {
        const extra = wardrobe.find((i) => i.id !== anchor.id);
        if (extra) chosen.push(extra);
      }
      const breakdown = chosen
        .map((i) => i.title.split(' ').slice(0, 2).join(' '))
        .join(' · ');
      return {
        id: `alt-${idx}-${anchor.id}`,
        label,
        occasion: STYLE_OCCASIONS[idx],
        breakdown: breakdown || anchor.title,
        imageUrl: anchor.imageUrl,
        items: chosen,
        isInspiration: false,
      };
    });
  }, [anchor, wardrobe, categories, categoryMap]);

  const subtitle = anchor
    ? `STYLING THE ${anchor.title.toUpperCase().slice(0, 42)}`
    : 'STYLING THE CLASSIC BLACK BLAZER';

  const getCardStep = (el: HTMLDivElement) => {
    const firstCard = el.querySelector('article');
    if (firstCard) return firstCard.getBoundingClientRect().width + 16;
    return el.clientWidth * 0.82;
  };

  const scrollByCard = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * getCardStep(el), behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const step = Math.max(1, getCardStep(el));
    const idx = Math.round(el.scrollLeft / step);
    setActiveCard(Math.min(cards.length - 1, Math.max(0, idx)));
  };

  const openPreview = (card: AlternativeCard) => {
    if (card.isInspiration) {
      setPreviewSlides([
        {
          id: card.id,
          title: `${card.label} — Editorial Study`,
          imageUrl: card.imageUrl,
          categoryLabel: card.occasion,
          shape: 'complete_outfit',
          subtitle: card.breakdown,
        },
      ]);
      setPreviewIndex(0);
      return;
    }
    setPreviewSlides(
      card.items.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        categoryLabel: categoryMap.get(item.categoryId)?.label,
        shape: categoryMap.get(item.categoryId)?.shape || 'top',
        subtitle: item.notes,
      }))
    );
    setPreviewIndex(0);
  };

  return (
    <section className="editorial-card p-5 sm:p-7 animate-editorial-up">
      {/* Editorial header bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} aria-label="Back" className="circle-btn">
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <span className="eyebrow">Outfit Alternatives</span>
        <button
          type="button"
          onClick={() =>
            onShare(
              'Three ways to wear it.',
              `${subtitle}\n${cards.map((c) => `${c.label}: ${c.breakdown}`).join('\n')}`
            )
          }
          aria-label="Share outfit alternatives"
          className="circle-btn"
        >
          <Share2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-serif-display text-[30px] sm:text-[36px] leading-[1.1] theme-text-primary">
          Three ways to wear it.
        </h2>
        <p className="eyebrow mt-2 !text-[10px] sm:!text-[11px]">{subtitle}</p>
      </div>

      {/* Snap carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="snap-carousel hide-scrollbar flex gap-4 overflow-x-auto pb-2 -mx-1 px-1"
        >
          {cards.map((card, idx) => (
            <article
              key={card.id}
              className="snap-card shrink-0 w-[82%] sm:w-[46%] lg:w-[31%] rounded-[20px] border p-3 transition-transform duration-200 hover:-translate-y-1"
              style={{
                borderColor: idx === activeCard ? 'var(--accent-ochre)' : 'var(--border-color)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <button
                type="button"
                onClick={() => openPreview(card)}
                className="group relative block w-full aspect-[4/5] rounded-[14px] overflow-hidden border theme-border cursor-zoom-in"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
                aria-label={`Preview ${card.label} look`}
              >
                {card.isInspiration ? (
                  <img
                    src={card.imageUrl}
                    alt={`${card.label} editorial flat-lay`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <ApparelVisual
                    src={card.imageUrl}
                    alt={card.breakdown}
                    shape={categoryMap.get(anchor?.categoryId || '')?.shape || 'complete_outfit'}
                    label={card.label}
                    wireframeSize="lg"
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                {!card.isInspiration && card.items.length > 1 && (
                  <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
                    {card.items.slice(1, 4).map((piece) => (
                      <div
                        key={piece.id}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-white/60 bg-white/80"
                      >
                        <ApparelVisual
                          src={piece.imageUrl}
                          alt={piece.title}
                          shape={categoryMap.get(piece.categoryId)?.shape || 'top'}
                          wireframeSize="xs"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {card.isInspiration && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[9px] uppercase tracking-[0.12em] text-white">
                    Editorial study
                  </span>
                )}
              </button>

              <div className="pt-3 px-1">
                <h3 className="font-serif-display text-[20px] theme-text-primary">
                  {card.label}
                </h3>
                <p className="text-[12px] theme-text-secondary mt-0.5 line-clamp-1">
                  {card.breakdown}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {card.isInspiration ? (
                    <button
                      type="button"
                      onClick={onUpload}
                      className="flex-1 min-h-[40px] rounded-[10px] pill-dark text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Upload to personalize
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onWear(`${card.label} — ${anchor?.title || 'Look'}`, card.occasion, card.items)}
                        className="flex-1 min-h-[40px] rounded-[10px] pill-dark text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Wear today
                      </button>
                      <button
                        type="button"
                        onClick={onCompose}
                        className="min-h-[40px] px-3 rounded-[10px] border theme-border text-[11px] font-semibold theme-text-primary cursor-pointer"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Carousel controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {cards.map((c, idx) => (
              <span
                key={c.id}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: idx === activeCard ? 22 : 6,
                  backgroundColor: idx === activeCard ? 'var(--accent-ink)' : 'var(--border-strong)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scrollByCard(-1)} aria-label="Previous look" className="circle-btn !w-10 !h-10">
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={() => scrollByCard(1)} aria-label="Next look" className="circle-btn !w-10 !h-10">
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <FullImagePreviewModal
        isOpen={previewSlides !== null}
        slides={previewSlides || []}
        initialIndex={previewIndex}
        headerBadge="Outfit Alternatives"
        onClose={() => setPreviewSlides(null)}
      />
    </section>
  );
};
