import React, { useMemo } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import {
  CategoryDefinition,
  OotdRecord,
  PlannedOutfitEntry,
  SavedOutfit,
  WardrobeItem,
} from '../types/outfit';

interface ProportionsAnalyticsProps {
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  planner: Record<string, PlannedOutfitEntry>;
  ootd: OotdRecord | null;
  onBack: () => void;
  onUpload: () => void;
}

interface ProportionRow {
  key: string;
  label: string;
  subtitle: string;
  count: number;
  percent: number;
  usagePercent: number;
  bg: string;
  fg: string;
}

const ROW_STYLES: Record<
  string,
  { label: string; subtitle: string; bg: string; fg: string }
> = {
  tops: {
    label: 'Tops',
    subtitle: 'Essential basics & shirts',
    bg: '#1E1E1E',
    fg: '#F9F6F0',
  },
  shoes: {
    label: 'Shoes',
    subtitle: 'Footwear & boots',
    bg: '#BA9B67',
    fg: '#FFFDF8',
  },
  bottoms: {
    label: 'Bottoms',
    subtitle: 'Trousers, denim & skirts',
    bg: '#7C8974',
    fg: '#FFFDF8',
  },
  accessories: {
    label: 'Accessories',
    subtitle: 'Bags, jewelry & belts',
    bg: '#D9CFCC',
    fg: '#1C1B1A',
  },
  outerwear: {
    label: 'Outerwear',
    subtitle: 'Coats, blazers & complete looks',
    bg: '#E3DAD5',
    fg: '#1C1B1A',
  },
};

function bucketForCategory(cat: CategoryDefinition | undefined): string {
  if (!cat) return 'outerwear';
  switch (cat.shape) {
    case 'top':
      return 'tops';
    case 'footwear':
      return 'shoes';
    case 'bottom':
      return 'bottoms';
    case 'accessories':
      return 'accessories';
    default:
      return 'outerwear';
  }
}

export const ProportionsAnalytics: React.FC<ProportionsAnalyticsProps> = ({
  categories,
  wardrobe,
  savedOutfits,
  planner,
  ootd,
  onBack,
  onUpload,
}) => {
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const { rows, totalPieces, totalWears, mostVersatile, mostUnderused, insight } =
    useMemo(() => {
      const counts: Record<string, number> = {
        tops: 0,
        shoes: 0,
        bottoms: 0,
        accessories: 0,
        outerwear: 0,
      };
      const wears: Record<string, number> = {
        tops: 0,
        shoes: 0,
        bottoms: 0,
        accessories: 0,
        outerwear: 0,
      };

      wardrobe.forEach((item) => {
        counts[bucketForCategory(categoryMap.get(item.categoryId))] += 1;
      });

      const wearEntries: Array<{ items: WardrobeItem[] }> = [
        ...Object.values(planner),
        ...savedOutfits,
      ];
      if (ootd) wearEntries.push({ items: ootd.items });

      let totalWearCount = 0;
      wearEntries.forEach((entry) => {
        entry.items.forEach((item) => {
          wears[bucketForCategory(categoryMap.get(item.categoryId))] += 1;
          totalWearCount += 1;
        });
      });

      const total = wardrobe.length;
      const order = ['tops', 'shoes', 'bottoms', 'accessories', 'outerwear'];
      const builtRows: ProportionRow[] = order.map((key) => {
        const style = ROW_STYLES[key];
        const percent = total > 0 ? Math.round((counts[key] / total) * 100) : 0;
        const usagePercent =
          totalWearCount > 0 ? Math.round((wears[key] / totalWearCount) * 100) : 0;
        return {
          key,
          label: style.label,
          subtitle: style.subtitle,
          count: counts[key],
          percent,
          usagePercent,
          bg: style.bg,
          fg: style.fg,
        };
      });

      // Normalize rounding drift so the bar reads as a whole.
      if (total > 0) {
        const sum = builtRows.reduce((acc, r) => acc + r.percent, 0);
        if (sum !== 100) {
          const largest = builtRows.reduce((a, b) => (a.count >= b.count ? a : b));
          largest.percent += 100 - sum;
        }
      }

      const withPieces = builtRows.filter((r) => r.count > 0);
      const versatile =
        withPieces.length > 0
          ? withPieces.reduce((a, b) => (a.usagePercent >= b.usagePercent ? a : b))
          : null;
      const underused =
        withPieces.length > 0
          ? withPieces.reduce((a, b) => (a.usagePercent <= b.usagePercent ? a : b))
          : null;

      let quote =
        'Your wardrobe is a blank page — every piece you add writes the first line.';
      if (total > 0 && totalWearCount > 0) {
        const shoes = builtRows.find((r) => r.key === 'shoes')!;
        if (shoes.percent - shoes.usagePercent >= 8) {
          quote =
            'Your wardrobe is footwear-heavy compared with your actual usage.';
        } else {
          const top = builtRows.reduce((a, b) => (a.percent >= b.percent ? a : b));
          quote = `${top.label} anchor your closet at ${top.percent}% — lean into versatile pairings to stretch every piece further.`;
        }
      } else if (total > 0) {
        quote =
          'Log outfits in your Style Chronicle to reveal how your wardrobe is truly worn.';
      }

      return {
        rows: builtRows,
        totalPieces: total,
        totalWears: totalWearCount,
        mostVersatile: versatile,
        mostUnderused: underused,
        insight: quote,
      };
    }, [wardrobe, savedOutfits, planner, ootd, categoryMap]);

  return (
    <section className="editorial-card p-5 sm:p-7 animate-editorial-up">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} aria-label="Back" className="circle-btn">
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <span className="eyebrow">Proportions</span>
        <span className="w-11" />
      </div>

      <h2 className="font-serif-display text-[30px] sm:text-[36px] leading-[1.12] theme-text-primary max-w-md">
        A more balanced wardrobe.
      </h2>
      <p className="text-[13px] theme-text-secondary mt-2">
        {totalPieces > 0
          ? `${totalPieces} pieces · ${totalWears} logged wears`
          : 'Add pieces to reveal your closet distribution.'}
      </p>

      {/* Proportion bars */}
      <div className="mt-6 space-y-3">
        {rows.map((row, idx) => (
          <div
            key={row.key}
            className="relative overflow-hidden rounded-[16px] animate-bar-grow"
            style={{
              backgroundColor: row.bg,
              color: row.fg,
              animationDelay: `${idx * 70}ms`,
              minHeight: 64,
            }}
          >
            <div
              className="absolute inset-y-0 left-0 opacity-[0.16]"
              style={{
                width: `${Math.max(row.percent, totalPieces > 0 ? 4 : 0)}%`,
                backgroundColor: row.fg,
              }}
            />
            <div className="relative flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-[0.1em]">
                  {row.label}
                </p>
                <p className="text-[12px] opacity-80 mt-0.5 truncate">
                  {totalPieces > 0 ? row.subtitle : 'Awaiting your first pieces'}
                </p>
              </div>
              <span className="stat-serif text-[26px] sm:text-[28px] leading-none shrink-0">
                {totalPieces > 0 ? `${row.percent}%` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Insight quote */}
      <div
        className="mt-6 rounded-[16px] px-5 py-4 border-l-[3px]"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderLeftColor: 'var(--accent-ochre)',
        }}
      >
        <p className="font-serif-display italic text-[15px] leading-[1.5] theme-text-primary">
          “{insight}”
        </p>
      </div>

      {/* Key metrics */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-[16px] p-4 border theme-border" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] theme-text-secondary">
            Most Versatile
          </p>
          <p className="font-serif-display text-[22px] theme-text-primary mt-1.5">
            {mostVersatile ? mostVersatile.label : '—'}
          </p>
          <p className="text-[12px] theme-text-secondary mt-0.5">
            {mostVersatile && totalWears > 0
              ? `Used in ${mostVersatile.usagePercent}% of logged outfits`
              : 'Log outfits to reveal'}
          </p>
        </div>
        <div className="rounded-[16px] p-4 border theme-border" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] theme-text-secondary">
            Most Underused
          </p>
          <p className="font-serif-display text-[22px] mt-1.5" style={{ color: 'var(--accent-ochre-deep)' }}>
            {mostUnderused ? mostUnderused.label : '—'}
          </p>
          <p className="text-[12px] theme-text-secondary mt-0.5">
            {mostUnderused && totalWears > 0
              ? `${mostUnderused.usagePercent}% of wears · ${mostUnderused.count} pieces owned`
              : 'Style it this week'}
          </p>
        </div>
      </div>

      {totalPieces === 0 && (
        <button
          type="button"
          onClick={onUpload}
          className="mt-5 w-full min-h-[46px] rounded-[12px] pill-dark text-[12px] font-semibold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Add your first pieces
        </button>
      )}
    </section>
  );
};
