import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CategoryDefinition,
  PlannedOutfitEntry,
  SavedOutfit,
  WardrobeItem,
} from '../types/outfit';
import { getTodayDateInfo } from '../services/deviceStorageService';
import { ApparelVisual } from './ApparelVisual';
import { FullImagePreviewModal, PreviewSlide } from './FullImagePreviewModal';

interface StyleChronicleProps {
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  planner: Record<string, PlannedOutfitEntry>;
  onSavePlannedDate: (entry: PlannedOutfitEntry) => void;
  onRemovePlannedDate: (dateKey: string) => void;
  onPromoteToOotd: (entry: PlannedOutfitEntry) => void;
  onOpenComposeOutfit: () => void;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const OCCASION_CHIPS = [
  'Work / Office',
  'Casual',
  'Date Night',
  'Party / Event',
  'Travel',
  'Festive / Wedding',
];

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date);
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

export const StyleChronicle: React.FC<StyleChronicleProps> = ({
  categories,
  wardrobe,
  savedOutfits,
  planner,
  onSavePlannedDate,
  onRemovePlannedDate,
  onPromoteToOotd,
  onOpenComposeOutfit,
}) => {
  const todayInfo = useMemo(() => getTodayDateInfo(), []);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayInfo.dateKey);

  const existingPlan = planner[selectedDateKey];
  const [occasion, setOccasion] = useState(existingPlan?.occasion || 'Casual');
  const [outfitTitle, setOutfitTitle] = useState(existingPlan?.outfitTitle || '');
  const [notes, setNotes] = useState(existingPlan?.notes || '');
  const [selectedOutfitId, setSelectedOutfitId] = useState(existingPlan?.outfitId || '');
  const [customItemIds, setCustomItemIds] = useState<string[]>(
    existingPlan ? existingPlan.items.map((i) => i.id) : []
  );
  const [previewEntry, setPreviewEntry] = useState<{
    entry: PlannedOutfitEntry;
    index: number;
  } | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const selectDate = (key: string) => {
    setSelectedDateKey(key);
    const d = parseKey(key);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    const plan = planner[key];
    if (plan) {
      setOccasion(plan.occasion);
      setOutfitTitle(plan.outfitTitle);
      setNotes(plan.notes || '');
      setSelectedOutfitId(plan.outfitId || '');
      setCustomItemIds(plan.items.map((i) => i.id));
    } else {
      setOccasion('Casual');
      setOutfitTitle('');
      setNotes('');
      setSelectedOutfitId('');
      setCustomItemIds([]);
    }
  };

  useEffect(() => {
    // Keep editor in sync if the selected plan is removed externally.
    if (!planner[selectedDateKey] && existingPlan) {
      setOutfitTitle('');
      setNotes('');
      setSelectedOutfitId('');
      setCustomItemIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planner, selectedDateKey]);

  const navigate = (dir: 1 | -1) => {
    if (viewMode === 'month') {
      const next = new Date(viewYear, viewMonth + dir, 1);
      setViewYear(next.getFullYear());
      setViewMonth(next.getMonth());
    } else {
      const next = parseKey(selectedDateKey);
      next.setDate(next.getDate() + dir * 7);
      selectDate(toKey(next));
    }
  };

  const goToday = () => {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    selectDate(todayInfo.dateKey);
  };

  const monthCells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string | null }> = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, key: toKey(new Date(viewYear, viewMonth, d)) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const weekCells = useMemo(() => {
    const start = startOfWeekMonday(parseKey(selectedDateKey));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: d, key: toKey(d) };
    });
  }, [selectedDateKey]);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
      }),
    [viewYear, viewMonth]
  );

  const usage = useMemo(() => {
    const itemWears = new Map<string, { item: WardrobeItem; count: number }>();
    const comboCounts = new Map<string, { title: string; count: number; items: WardrobeItem[] }>();
    Object.values(planner).forEach((entry) => {
      entry.items.forEach((item) => {
        const existing = itemWears.get(item.id);
        if (existing) existing.count += 1;
        else itemWears.set(item.id, { item, count: 1 });
      });
      const signature = entry.items.map((i) => i.id).sort().join('|') || entry.outfitTitle;
      const combo = comboCounts.get(signature);
      if (combo) combo.count += 1;
      else comboCounts.set(signature, { title: entry.outfitTitle, count: 1, items: entry.items });
    });
    const mostWorn = [...itemWears.values()].sort((a, b) => b.count - a.count).slice(0, 4);
    const repeated = [...comboCounts.values()].filter((c) => c.count > 1).sort((a, b) => b.count - a.count).slice(0, 3);
    const wornIds = new Set(itemWears.keys());
    const unused = wardrobe.filter((i) => !wornIds.has(i.id)).slice(0, 4);
    return { mostWorn, repeated, unused };
  }, [planner, wardrobe]);

  const toggleCustomItem = (id: string) => {
    setSelectedOutfitId('');
    setCustomItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let resolvedItems: WardrobeItem[] = [];
    let resolvedTitle = outfitTitle.trim();
    let resolvedOutfitId: string | undefined;

    if (selectedOutfitId) {
      const found = savedOutfits.find((o) => o.id === selectedOutfitId);
      if (found) {
        resolvedItems = found.items;
        resolvedTitle = resolvedTitle || found.title;
        resolvedOutfitId = found.id;
      }
    } else if (customItemIds.length > 0) {
      const map = new Map(wardrobe.map((i) => [i.id, i]));
      resolvedItems = customItemIds
        .map((id) => map.get(id))
        .filter((x): x is WardrobeItem => Boolean(x));
    }

    if (!resolvedTitle) resolvedTitle = `${occasion.trim() || 'Planned'} Look`;

    onSavePlannedDate({
      dateKey: selectedDateKey,
      outfitId: resolvedOutfitId,
      outfitTitle: resolvedTitle,
      occasion: occasion.trim() || 'Casual',
      notes: notes.trim() || undefined,
      items: resolvedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const selectedDateLabel = parseKey(selectedDateKey).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const renderDayTile = (key: string, day: number, large = false) => {
    const plan = planner[key];
    const isSelected = key === selectedDateKey;
    const isToday = key === todayInfo.dateKey;
    const firstItem = plan?.items?.[0];
    return (
      <div
        key={key}
        role="button"
        tabIndex={0}
        onClick={() => selectDate(key)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectDate(key);
          }
        }}
        className={`relative ${large ? 'aspect-[4/5]' : 'aspect-square'} rounded-[10px] overflow-hidden border cursor-pointer transition-all duration-150 ${
          isSelected ? 'ring-2 ring-offset-1' : 'hover:-translate-y-0.5'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: isSelected ? 'var(--accent-ochre)' : 'var(--border-color)',
          ['--tw-ring-color' as string]: 'var(--accent-ochre)',
          ['--tw-ring-offset-color' as string]: 'var(--bg-app)',
        }}
      >
        {plan && firstItem ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewEntry({ entry: plan, index: 0 });
            }}
            aria-label={`Preview ${plan.outfitTitle}`}
            className="absolute inset-0 w-full h-full cursor-zoom-in"
          >
            <ApparelVisual
              src={firstItem.imageUrl}
              alt={plan.outfitTitle}
              shape={categoryMap.get(firstItem.categoryId)?.shape || 'complete_outfit'}
              wireframeSize="xs"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
            {plan.items.length > 1 && (
              <span className="absolute bottom-1 right-1 px-1 rounded bg-black/65 text-[9px] text-white font-medium">
                +{plan.items.length - 1}
              </span>
            )}
          </button>
        ) : null}
        <span
          className={`absolute top-1 left-1 min-w-[20px] h-5 px-1 rounded-[6px] text-[10px] font-semibold flex items-center justify-center ${
            plan && firstItem ? 'bg-black/55 text-white' : ''
          }`}
          style={
            plan && firstItem
              ? undefined
              : {
                  color: isToday ? '#F9F6F0' : 'var(--text-secondary)',
                  backgroundColor: isToday ? 'var(--accent-ink)' : 'transparent',
                }
          }
        >
          {day}
        </span>
        {large && plan && (
          <span className="absolute bottom-1 left-1 right-1 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
            {plan.occasion}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="editorial-card p-5 sm:p-7 animate-editorial-up">
      <p className="eyebrow">Style Chronicle</p>
      <h2 className="font-serif-display text-[30px] sm:text-[36px] leading-[1.1] theme-text-primary mt-1">
        Your style, over time.
      </h2>

      {/* Month / Week toggle */}
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center rounded-full p-1 border theme-border"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
        >
          {(['month', 'week'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`min-h-[36px] px-5 rounded-full text-[12px] font-semibold capitalize transition-all duration-150 cursor-pointer ${
                viewMode === mode ? 'pill-dark' : 'theme-text-secondary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={goToday}
          className="min-h-[36px] px-4 rounded-full border theme-border text-[12px] font-semibold theme-text-primary cursor-pointer"
        >
          Today
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => navigate(-1)} aria-label="Previous" className="circle-btn !w-10 !h-10">
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <h3 className="font-serif-display text-[22px] theme-text-primary">
              {monthLabel} <span style={{ color: 'var(--accent-ochre-deep)' }}>{viewYear}</span>
            </h3>
            <button type="button" onClick={() => navigate(1)} aria-label="Next" className="circle-btn !w-10 !h-10">
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold tracking-[0.1em] theme-text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((cell, idx) =>
                cell.day && cell.key ? (
                  renderDayTile(cell.key, cell.day)
                ) : (
                  <div key={`empty-${idx}`} className="aspect-square rounded-[10px] opacity-30" style={{ backgroundColor: 'var(--bg-subtle)' }} />
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {weekCells.map((cell) => renderDayTile(cell.key, cell.date.getDate(), true))}
            </div>
          )}

          {/* Usage breakdown */}
          <div className="mt-6 space-y-4">
            <UsageList
              title="Most Worn"
              dotColor="var(--accent-ink)"
              empty="Log outfits to see your staples."
              rows={usage.mostWorn.map((w) => ({
                label: w.item.title,
                value: `${w.count}x`,
                imageUrl: w.item.imageUrl,
                shape: categoryMap.get(w.item.categoryId)?.shape,
              }))}
            />
            <UsageList
              title="Repeated Outfits"
              dotColor="var(--accent-sage)"
              empty="No repeated combinations yet."
              rows={usage.repeated.map((r) => ({
                label: r.title,
                value: `${r.count}x`,
                imageUrl: r.items[0]?.imageUrl,
                shape: categoryMap.get(r.items[0]?.categoryId || '')?.shape,
              }))}
            />
            <UsageList
              title="Unused Pieces"
              dotColor="var(--accent-ochre)"
              empty="Every piece has been worn."
              rows={usage.unused.map((i) => ({
                label: i.title,
                value: '0x',
                imageUrl: i.imageUrl,
                shape: categoryMap.get(i.categoryId)?.shape,
              }))}
            />
          </div>
        </div>

        {/* Date editor */}
        <div className="lg:col-span-5 rounded-[20px] border theme-border p-4 sm:p-5" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div className="flex items-start justify-between gap-2 pb-3 border-b theme-border">
            <div>
              <p className="eyebrow !text-[10px]">Selected Date</p>
              <h3 className="font-serif-display text-[20px] theme-text-primary mt-0.5">{selectedDateLabel}</h3>
            </div>
            {existingPlan && (
              <button
                type="button"
                onClick={() => onRemovePlannedDate(selectedDateKey)}
                className="min-h-[36px] px-3 rounded-full border theme-border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Clear
              </button>
            )}
          </div>

          {existingPlan && existingPlan.items.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              {existingPlan.items.map((piece, idx) => (
                <button
                  key={`${piece.id}-${idx}`}
                  type="button"
                  onClick={() => setPreviewEntry({ entry: existingPlan, index: idx })}
                  className="w-14 h-14 rounded-[10px] overflow-hidden border theme-border shrink-0 cursor-zoom-in"
                  title={`Preview ${piece.title}`}
                >
                  <ApparelVisual
                    src={piece.imageUrl}
                    alt={piece.title}
                    shape={categoryMap.get(piece.categoryId)?.shape || 'top'}
                    wireframeSize="xs"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPreviewEntry({ entry: existingPlan, index: 0 })}
                className="min-h-[36px] px-3 rounded-full border theme-border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Maximize2 className="w-3 h-3" strokeWidth={1.5} /> Full
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] theme-text-secondary mb-1.5">
                Occasion
              </label>
              <input
                type="text"
                required
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Client meeting, wedding, brunch…"
                className="w-full h-11 px-3.5 rounded-[10px] border theme-border text-[13px] theme-text-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {OCCASION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setOccasion(chip)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer"
                    style={{
                      borderColor: occasion === chip ? 'var(--accent-sage)' : 'var(--border-color)',
                      backgroundColor: occasion === chip ? 'rgba(124,137,116,0.18)' : 'transparent',
                      color: occasion === chip ? 'var(--accent-sage-deep)' : 'var(--text-secondary)',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] theme-text-secondary">Saved Outfit</span>
                <button type="button" onClick={onOpenComposeOutfit} className="text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer" style={{ color: 'var(--accent-ochre-deep)' }}>
                  <Plus className="w-3 h-3" strokeWidth={1.5} /> Compose
                </button>
              </div>
              {savedOutfits.length === 0 ? (
                <p className="text-[12px] theme-text-muted rounded-[10px] border border-dashed theme-border p-3">
                  No saved outfits yet — pick pieces below or compose a look.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {savedOutfits.map((outfit) => {
                    const active = selectedOutfitId === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        type="button"
                        onClick={() => {
                          setSelectedOutfitId(active ? '' : outfit.id);
                          if (!active) {
                            setOutfitTitle(outfit.title);
                            setCustomItemIds([]);
                          }
                        }}
                        className="w-full p-2 rounded-[10px] border flex items-center justify-between gap-2 text-left cursor-pointer"
                        style={{
                          borderColor: active ? 'var(--accent-ochre)' : 'var(--border-color)',
                          backgroundColor: active ? 'rgba(186,155,103,0.12)' : 'var(--bg-overlay)',
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex -space-x-2 shrink-0">
                            {outfit.items.slice(0, 3).map((p) => (
                              <div key={p.id} className="w-8 h-8 rounded-[8px] overflow-hidden border theme-border">
                                <ApparelVisual src={p.imageUrl} alt={p.title} shape={categoryMap.get(p.categoryId)?.shape || 'top'} wireframeSize="xs" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold theme-text-primary truncate">{outfit.title}</p>
                            <p className="text-[11px] theme-text-muted">{outfit.occasion} · {outfit.items.length} pieces</p>
                          </div>
                        </div>
                        {active && <Check className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {wardrobe.length > 0 && (
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] theme-text-secondary mb-1.5">
                  Or pick pieces ({customItemIds.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {wardrobe.map((item) => {
                    const picked = customItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCustomItem(item.id)}
                        className="w-14 shrink-0 rounded-[10px] border p-1 cursor-pointer"
                        style={{
                          borderColor: picked ? 'var(--accent-ochre)' : 'var(--border-color)',
                          backgroundColor: picked ? 'rgba(186,155,103,0.12)' : 'var(--bg-overlay)',
                        }}
                      >
                        <div className="aspect-square rounded-[7px] overflow-hidden">
                          <ApparelVisual src={item.imageUrl} alt={item.title} shape={categoryMap.get(item.categoryId)?.shape || 'top'} wireframeSize="xs" className="w-full h-full object-cover" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="text"
                value={outfitTitle}
                onChange={(e) => setOutfitTitle(e.target.value)}
                placeholder="Look title"
                className="w-full h-10 px-3 rounded-[10px] border theme-border text-[12px] theme-text-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
              />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Styling / packing notes"
                className="w-full h-10 px-3 rounded-[10px] border theme-border text-[12px] theme-text-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="flex-1 min-h-[46px] rounded-[12px] pill-dark text-[12px] font-semibold uppercase tracking-[0.08em] inline-flex items-center justify-center gap-1.5 cursor-pointer">
                <Check className="w-4 h-4" strokeWidth={1.5} /> Save to date
              </button>
              {existingPlan && existingPlan.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => onPromoteToOotd(existingPlan)}
                  className="min-h-[46px] px-4 rounded-[12px] border text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--accent-sage)', color: 'var(--accent-sage-deep)' }}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.5} /> Wear as OOTD
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <FullImagePreviewModal
        isOpen={previewEntry !== null}
        slides={
          previewEntry
            ? previewEntry.entry.items.map(
                (piece): PreviewSlide => ({
                  id: piece.id,
                  title: piece.title,
                  imageUrl: piece.imageUrl,
                  categoryLabel: categoryMap.get(piece.categoryId)?.label,
                  shape: categoryMap.get(piece.categoryId)?.shape || 'top',
                  subtitle: piece.notes || previewEntry.entry.notes,
                })
              )
            : []
        }
        initialIndex={previewEntry?.index || 0}
        headerBadge={previewEntry?.entry.occasion}
        headerTitle={previewEntry ? `${previewEntry.entry.outfitTitle} · ${previewEntry.entry.dateKey}` : undefined}
        onClose={() => setPreviewEntry(null)}
      />
    </section>
  );
};

const UsageList: React.FC<{
  title: string;
  dotColor: string;
  empty: string;
  rows: Array<{ label: string; value: string; imageUrl?: string; shape?: import('../types/outfit').WireframeShape }>;
}> = ({ title, dotColor, empty, rows }) => (
  <div className="border-t theme-border pt-3">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] theme-text-primary">{title}</h4>
    </div>
    {rows.length === 0 ? (
      <p className="text-[12px] theme-text-muted pl-4">{empty}</p>
    ) : (
      <ul className="space-y-1.5">
        {rows.map((row, idx) => (
          <li key={`${row.label}-${idx}`} className="flex items-center justify-between gap-3 pl-4">
            <div className="flex items-center gap-2 min-w-0">
              {row.imageUrl && (
                <div className="w-7 h-7 rounded-[7px] overflow-hidden border theme-border shrink-0">
                  <ApparelVisual src={row.imageUrl} alt={row.label} shape={row.shape || 'top'} wireframeSize="xs" className="w-full h-full object-cover" />
                </div>
              )}
              <span className="text-[13px] theme-text-primary truncate">{row.label}</span>
            </div>
            <span className="stat-serif text-[16px] theme-text-secondary shrink-0">{row.value}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
