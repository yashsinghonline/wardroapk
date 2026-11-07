import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  FolderPlus,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CategoryDefinition, WardrobeItem } from '../types/outfit';
import { processUploadedImageFile } from '../services/linkPreviewService';
import { ApparelVisual } from './ApparelVisual';

interface AddWardrobeItemModalProps {
  isOpen: boolean;
  categories: CategoryDefinition[];
  initialCategoryId?: string;
  onClose: () => void;
  onAddItems: (items: WardrobeItem[]) => void;
  onOpenNewCategoryModal: () => void;
}

interface DraftUploadItem {
  tempId: string;
  title: string;
  imageUrl: string;
}

export const AddWardrobeItemModal: React.FC<AddWardrobeItemModalProps> = ({
  isOpen,
  categories,
  initialCategoryId,
  onClose,
  onAddItems,
  onOpenNewCategoryModal,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || categories[0]?.id || 'complete_outfit'
  );
  const [drafts, setDrafts] = useState<DraftUploadItem[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId(
        initialCategoryId || categories[0]?.id || 'complete_outfit'
      );
      setDrafts([]);
      setManualTitle('');
      setManualImageUrl('');
      setTagsInput('');
      setNotes('');
    }
  }, [isOpen, initialCategoryId, categories]);

  if (!isOpen) return null;

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    try {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/')
      );
      const processed: DraftUploadItem[] = [];
      for (const file of files) {
        try {
          const dataUrl = await processUploadedImageFile(file);
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .trim();
          processed.push({
            tempId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title:
              cleanName.length > 1
                ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
                : `${activeCategory?.label || 'Wardrobe'} Piece`,
            imageUrl: dataUrl,
          });
        } catch {
          // Skip unreadable image
        }
      }

      if (processed.length === 1 && drafts.length === 0) {
        setDrafts(processed);
        setManualTitle(processed[0].title);
      } else if (processed.length > 0) {
        setDrafts((prev) => [...prev, ...processed]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const nowIso = new Date().toISOString();

    if (drafts.length > 1) {
      // Batch add multiple uploaded photos
      const batchItems: WardrobeItem[] = drafts.map((d, idx) => ({
        id: `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        title: d.title.trim() || `${activeCategory?.label || 'Item'} #${idx + 1}`,
        categoryId: selectedCategoryId,
        imageUrl: d.imageUrl,
        notes: notes.trim() || undefined,
        tags: parsedTags,
        createdAt: nowIso,
      }));
      onAddItems(batchItems);
      onClose();
      return;
    }

    const singleImage =
      drafts.length === 1 ? drafts[0].imageUrl : manualImageUrl.trim();
    const singleTitle =
      manualTitle.trim() ||
      (drafts.length === 1 ? drafts[0].title.trim() : '') ||
      `${activeCategory?.label || 'Wardrobe'} Item`;

    const singleItem: WardrobeItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: singleTitle,
      categoryId: selectedCategoryId,
      imageUrl: singleImage,
      notes: notes.trim() || undefined,
      tags: parsedTags,
      createdAt: nowIso,
    };

    onAddItems([singleItem]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-wardrobe-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl theme-surface border shadow-2xl overflow-hidden animate-sheet-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-3 pb-3.5 border-b theme-border flex items-center justify-between gap-3">
          <div>
            <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mb-2.5 sm:hidden" />
            <h2
              id="upload-wardrobe-title"
              className="text-base font-semibold theme-text-primary tracking-tight flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#3B82F6]" />
              Upload Garment / Outfit Photo
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              Saved directly to high-capacity client device storage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="w-11 h-11 rounded-xl theme-subtle border flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-4 text-sm"
        >
          {/* Category Picker + Quick Add Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium theme-text-secondary">
                Category
              </span>
              <button
                type="button"
                onClick={onOpenNewCategoryModal}
                className="text-xs font-medium text-[#3B82F6] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Add Category</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const selected = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                        : 'theme-subtle theme-text-secondary hover:theme-text-primary'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop / Multi-Photo Device Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                : 'theme-subtle hover:border-[#3B82F6]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            {isProcessing ? (
              <div className="py-3 flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-[#3B82F6] animate-spin" />
                <p className="text-xs font-medium theme-text-primary">
                  Optimizing photo(s) for device storage...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-2xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center mb-1">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-semibold theme-text-primary">
                  Tap to upload photo(s) from device
                </p>
                <p className="text-[11px] theme-text-muted">
                  Supports single or multiple images (JPG, PNG, WEBP)
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Batch Preview Grid (when multiple photos chosen) */}
          {drafts.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold theme-text-primary">
                  {drafts.length} Photos Ready to Import
                </span>
                <button
                  type="button"
                  onClick={() => setDrafts([])}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.tempId}
                    className="rounded-xl theme-subtle border p-2 flex flex-col gap-2"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={draft.imageUrl}
                        alt={draft.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDrafts((prev) =>
                            prev.filter((d) => d.tempId !== draft.tempId)
                          )
                        }
                        aria-label="Remove photo"
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/70 text-white flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDrafts((prev) =>
                          prev.map((d, i) =>
                            i === index ? { ...d, title: val } : d
                          )
                        );
                      }}
                      placeholder="Item name"
                      className="w-full h-9 px-2.5 rounded-lg theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Item Preview + Title + Optional Image URL */}
          {drafts.length <= 1 && (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl theme-subtle border">
                <div className="w-16 h-16 rounded-xl overflow-hidden border theme-border shrink-0">
                  <ApparelVisual
                    src={drafts[0]?.imageUrl || manualImageUrl}
                    alt={manualTitle || 'Preview'}
                    shape={activeCategory?.shape || 'top'}
                    label={activeCategory?.label}
                    wireframeSize="sm"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="block text-[11px] font-medium theme-text-secondary">
                    Or paste direct image URL (optional)
                  </label>
                  <div className="relative">
                    <ImagePlus className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={manualImageUrl}
                      disabled={drafts.length === 1}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-10 pl-8 pr-3 rounded-xl theme-surface border text-xs theme-text-primary disabled:opacity-50 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="wardrobe-item-title"
                  className="block text-xs font-medium theme-text-secondary mb-1.5"
                >
                  Item Name
                </label>
                <input
                  id="wardrobe-item-title"
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`e.g., ${
                    activeCategory?.isCompleteOutfit
                      ? 'Linen Co-ord Set / Black Suit'
                      : 'White Oversized Tee'
                  }`}
                  className="w-full h-11 px-3.5 rounded-xl theme-surface border text-sm theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </>
          )}

          {/* Tags & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="wardrobe-item-tags"
                className="block text-xs font-medium theme-text-secondary mb-1.5"
              >
                Style Tags (optional)
              </label>
              <input
                id="wardrobe-item-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="casual, work, summer"
                className="w-full h-11 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div>
              <label
                htmlFor="wardrobe-item-notes"
                className="block text-xs font-medium theme-text-secondary mb-1.5"
              >
                Fit / Fabric Notes (optional)
              </label>
              <input
                id="wardrobe-item-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Relaxed fit, cotton"
                className="w-full h-11 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl theme-subtle border text-xs font-medium theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-[1.6] min-h-[46px] rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {drafts.length > 1
                  ? `Save ${drafts.length} Items to Wardrobe`
                  : 'Save to Wardrobe'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
