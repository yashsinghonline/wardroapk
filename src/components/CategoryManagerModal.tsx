import React, { useState } from 'react';
import { FolderPlus, Plus, Trash2, X } from 'lucide-react';
import { CategoryDefinition, WireframeShape } from '../types/outfit';
import { CategoryWireframeSvg } from './ApparelVisual';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: CategoryDefinition[];
  itemCountsByCategory: Record<string, number>;
  onClose: () => void;
  onAddCategory: (category: CategoryDefinition) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const SHAPE_OPTIONS: Array<{ shape: WireframeShape; label: string }> = [
  { shape: 'outerwear', label: 'Outerwear / Layer' },
  { shape: 'complete_outfit', label: 'Full Outfit / Set' },
  { shape: 'top', label: 'Top / Shirt' },
  { shape: 'bottom', label: 'Bottom / Pants' },
  { shape: 'footwear', label: 'Footwear' },
  { shape: 'accessories', label: 'Accessory' },
  { shape: 'custom', label: 'Hanger / General' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  itemCountsByCategory,
  onClose,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [label, setLabel] = useState('');
  const [shape, setShape] = useState<WireframeShape>('outerwear');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const newCat: CategoryDefinition = {
      id: `cat_${slug}_${Date.now().toString(36).slice(-4)}`,
      label: trimmed,
      shape,
      isDefault: false,
      isCompleteOutfit: shape === 'complete_outfit',
    };

    onAddCategory(newCat);
    setLabel('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl theme-surface border shadow-2xl overflow-hidden animate-sheet-up max-h-[90vh] flex flex-col">
        <div className="px-5 pt-3 pb-3.5 border-b theme-border flex items-center justify-between">
          <div>
            <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mb-2.5 sm:hidden" />
            <h2
              id="category-manager-title"
              className="text-base font-semibold theme-text-primary tracking-tight flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-[#3B82F6]" />
              Wardrobe Categories
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              Includes Complete Outfit + custom categories
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories"
            className="w-11 h-11 rounded-xl theme-subtle border flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Create New Category Form */}
          <form
            onSubmit={handleCreate}
            className="p-3.5 rounded-2xl theme-subtle border space-y-3"
          >
            <label
              htmlFor="new-category-name"
              className="block text-xs font-semibold theme-text-primary"
            >
              Create Custom Category
            </label>

            <input
              id="new-category-name"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Jackets, Ethnic Wear, Gym, Bags"
              className="w-full h-11 px-3.5 rounded-xl theme-surface border text-sm theme-text-primary focus:outline-none focus:border-[#3B82F6]"
            />

            <div>
              <span className="block text-[11px] font-medium theme-text-secondary mb-1.5">
                Icon Silhouette
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPE_OPTIONS.map((opt) => {
                  const active = shape === opt.shape;
                  return (
                    <button
                      key={opt.shape}
                      type="button"
                      onClick={() => setShape(opt.shape)}
                      title={opt.label}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6]'
                          : 'theme-surface theme-text-secondary hover:theme-text-primary'
                      }`}
                    >
                      <CategoryWireframeSvg
                        shape={opt.shape}
                        className="w-5 h-5"
                      />
                      <span className="text-[9px] truncate w-full text-center">
                        {opt.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div>
            <span className="block text-xs font-semibold theme-text-secondary mb-2">
              Active Categories ({categories.length})
            </span>
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = itemCountsByCategory[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl theme-subtle border"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg theme-surface border flex items-center justify-center shrink-0">
                        <CategoryWireframeSvg
                          shape={cat.shape}
                          className="w-5 h-5 theme-text-secondary"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold theme-text-primary truncate">
                            {cat.label}
                          </span>
                          {cat.isCompleteOutfit && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#10B981]/15 text-[#10B981]">
                              Full Look
                            </span>
                          )}
                          {cat.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-tech theme-surface border theme-text-muted">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] theme-text-muted">
                          {count} item{count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        aria-label={`Delete ${cat.label} category`}
                        className="w-9 h-9 rounded-lg hover:bg-red-500/15 theme-text-muted hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
