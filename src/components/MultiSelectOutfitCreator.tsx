import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Layers,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CategoryDefinition,
  SavedOutfit,
  WardrobeItem,
} from '../types/outfit';
import { ApparelVisual } from './ApparelVisual';

interface MultiSelectOutfitCreatorProps {
  isOpen: boolean;
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  defaultMakeOotd?: boolean;
  onClose: () => void;
  onSaveOutfit: (outfit: SavedOutfit, alsoSetAsOotd: boolean) => void;
  onSetOotdOnly: (title: string, occasion: string, items: WardrobeItem[]) => void;
  onOpenUploadItem: () => void;
}

const OCCASION_PRESETS = [
  'Casual',
  'Work / Office',
  'Date Night',
  'Party / Event',
  'Travel',
  'Festive',
];

export const MultiSelectOutfitCreator: React.FC<
  MultiSelectOutfitCreatorProps
> = ({
  isOpen,
  categories,
  wardrobe,
  defaultMakeOotd = false,
  onClose,
  onSaveOutfit,
  onSetOotdOnly,
  onOpenUploadItem,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>('all');
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState('Casual');

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const selectedItems = useMemo(() => {
    const itemMap = new Map(wardrobe.map((i) => [i.id, i]));
    return selectedIds
      .map((id) => itemMap.get(id))
      .filter((x): x is WardrobeItem => Boolean(x));
  }, [selectedIds, wardrobe]);

  const distinctCategoryCount = useMemo(() => {
    return new Set(selectedItems.map((i) => i.categoryId)).size;
  }, [selectedItems]);

  const filteredWardrobe = useMemo(() => {
    if (activeCategoryFilter === 'all') return wardrobe;
    return wardrobe.filter((i) => i.categoryId === activeCategoryFilter);
  }, [wardrobe, activeCategoryFilter]);

  if (!isOpen) return null;

  const toggleItemSelection = (item: WardrobeItem) => {
    setSelectedIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id]
    );
  };

  // Require at least 2 items across 2 different categories (or 1 Complete Outfit item)
  const hasCompleteOutfitSelected = selectedItems.some(
    (item) => categoryMap.get(item.categoryId)?.isCompleteOutfit
  );
  const canCreateOutfit =
    (selectedItems.length >= 2 && distinctCategoryCount >= 2) ||
    (hasCompleteOutfitSelected && selectedItems.length >= 1);

  const handleCreateAndSave = (alsoSetOotd: boolean) => {
    if (!canCreateOutfit) return;
    const finalTitle =
      title.trim() ||
      `${occasion} Look (${selectedItems.length} piece${
        selectedItems.length === 1 ? '' : 's'
      })`;

    const newOutfit: SavedOutfit = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: finalTitle,
      occasion: occasion.trim() || 'Casual',
      items: selectedItems,
      createdAt: new Date().toISOString(),
    };

    onSaveOutfit(newOutfit, alsoSetOotd);
    setSelectedIds([]);
    setTitle('');
    onClose();
  };

  const handleCreateOotdDirect = () => {
    if (!canCreateOutfit) return;
    const finalTitle =
      title.trim() || `${occasion} Edit`;
    onSetOotdOnly(finalTitle, occasion.trim() || 'Casual', selectedItems);
    setSelectedIds([]);
    setTitle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multi-outfit-creator-title"
    >
      <div className="w-full h-[94vh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-t-3xl sm:rounded-2xl theme-surface border shadow-2xl flex flex-col overflow-hidden animate-sheet-up">
        {/* Header */}
        <div className="px-5 pt-3 pb-3.5 border-b theme-border flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mb-2.5 sm:hidden" />
            <h2
              id="multi-outfit-creator-title"
              className="text-base sm:text-lg font-semibold theme-text-primary tracking-tight flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#3B82F6]" />
              {defaultMakeOotd
                ? 'Create Outfit of the Day (OOTD)'
                : 'Compose Outfit from Multiple Categories'}
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              Select 2 or more pieces across different categories (or a Complete Outfit)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close outfit composer"
            className="w-11 h-11 rounded-xl theme-subtle border flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Pieces Live Tray */}
        <div className="px-5 py-3 border-b theme-border theme-subtle shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold theme-text-primary">
              Selected Pieces ({selectedItems.length})
              {distinctCategoryCount > 0 && (
                <span className="ml-1.5 font-normal theme-text-secondary">
                  across {distinctCategoryCount} categor
                  {distinctCategoryCount === 1 ? 'y' : 'ies'}
                </span>
              )}
            </span>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-red-400 hover:underline cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-xs theme-text-muted py-1.5">
              Tap items below from at least 2 different categories to build your outfit.
            </p>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {selectedItems.map((item) => {
                const cat = categoryMap.get(item.categoryId);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl theme-surface border shrink-0"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                      <ApparelVisual
                        src={item.imageUrl}
                        alt={item.title}
                        shape={cat?.shape || 'top'}
                        wireframeSize="xs"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="max-w-[110px]">
                      <span className="block font-mono-tech text-[9px] uppercase text-[#3B82F6] truncate">
                        {cat?.label || 'Item'}
                      </span>
                      <span className="block text-[11px] font-medium theme-text-primary truncate">
                        {item.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item)}
                      aria-label={`Remove ${item.title}`}
                      className="w-6 h-6 rounded-md hover:bg-red-500/15 theme-text-muted hover:text-red-400 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 py-2.5 border-b theme-border flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-medium border shrink-0 transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                : 'theme-subtle theme-text-secondary hover:theme-text-primary'
            }`}
          >
            All Categories ({wardrobe.length})
          </button>
          {categories.map((cat) => {
            const count = wardrobe.filter((i) => i.categoryId === cat.id).length;
            const active = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-medium border shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : 'theme-subtle theme-text-secondary hover:theme-text-primary'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Multi-Select Wardrobe Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {wardrobe.length === 0 ? (
            <div className="rounded-2xl theme-subtle border border-dashed p-8 text-center">
              <p className="text-sm font-semibold theme-text-primary">
                Your wardrobe is empty
              </p>
              <p className="text-xs theme-text-secondary mt-1 mb-4">
                Upload garment or complete outfit photos first so you can combine them into looks.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUploadItem();
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Wardrobe Photos</span>
              </button>
            </div>
          ) : filteredWardrobe.length === 0 ? (
            <div className="rounded-2xl theme-subtle border border-dashed p-6 text-center text-xs theme-text-secondary">
              No items in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredWardrobe.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const cat = categoryMap.get(item.categoryId);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItemSelection(item)}
                    className={`group relative rounded-xl border text-left overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30 theme-surface'
                        : 'theme-subtle hover:border-[#3B82F6]/50'
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <ApparelVisual
                        src={item.imageUrl}
                        alt={item.title}
                        shape={cat?.shape || 'top'}
                        label={cat?.label}
                        wireframeSize="md"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span
                        className={`absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                            : 'bg-black/55 border-white/25 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono-tech text-white">
                        {cat?.label || 'Item'}
                      </span>
                    </div>

                    <div className="p-2.5">
                      <p className="text-xs font-semibold theme-text-primary truncate">
                        {item.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Metadata + Save Outfit / Create OOTD Actions */}
        <div className="p-4 sm:p-5 border-t theme-border theme-subtle space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="composed-outfit-title"
                className="block text-[11px] font-medium theme-text-secondary mb-1"
              >
                Outfit Name
              </label>
              <input
                id="composed-outfit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Monochrome Office Look"
                className="w-full h-10 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div>
              <label
                htmlFor="composed-outfit-occasion"
                className="block text-[11px] font-medium theme-text-secondary mb-1"
              >
                Occasion
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="composed-outfit-occasion"
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Casual, Work, Party..."
                  className="flex-1 h-10 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          </div>

          {/* Occasion Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {OCCASION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setOccasion(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border shrink-0 transition-colors cursor-pointer ${
                  occasion === preset
                    ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                    : 'theme-surface theme-text-secondary hover:theme-text-primary'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {!canCreateOutfit && selectedItems.length > 0 && (
            <p className="text-[11px] text-amber-400">
              Select at least 1 more item from a different category (or pick a Complete Outfit piece) to create your outfit.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={!canCreateOutfit}
              onClick={() => handleCreateAndSave(false)}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-500 disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save Outfit ({selectedItems.length})</span>
            </button>

            <button
              type="button"
              disabled={!canCreateOutfit}
              onClick={handleCreateOotdDirect}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#10B981] hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-zinc-950 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Set as Outfit of the Day</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
