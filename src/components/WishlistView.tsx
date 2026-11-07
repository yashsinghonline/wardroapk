import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Heart,
  Link2,
  Loader2,
  Maximize2,
  Plus,
  Shirt,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CategoryDefinition,
  LinkPreviewMetadata,
  WishlistItem,
} from '../types/outfit';
import {
  extractWishlistLinkPreview,
  processUploadedImageFile,
} from '../services/linkPreviewService';
import { ApparelVisual } from './ApparelVisual';
import { FullImagePreviewModal, PreviewSlide } from './FullImagePreviewModal';

interface WishlistViewProps {
  categories: CategoryDefinition[];
  wishlist: WishlistItem[];
  onAddWishlistItem: (item: WishlistItem) => void;
  onRemoveWishlistItem: (id: string) => void;
  onMoveWishlistToWardrobe: (item: WishlistItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  categories,
  wishlist,
  onAddWishlistItem,
  onRemoveWishlistItem,
  onMoveWishlistToWardrobe,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [draftPreview, setDraftPreview] = useState<LinkPreviewMetadata | null>(
    null
  );
  const [draftTitle, setDraftTitle] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [draftCategoryId, setDraftCategoryId] = useState(
    categories[0]?.id || 'complete_outfit'
  );
  const [draftNotes, setDraftNotes] = useState('');
  const [previewItem, setPreviewItem] = useState<WishlistItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExtractPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    setIsFetchingPreview(true);
    try {
      const meta = await extractWishlistLinkPreview(trimmed);
      setDraftPreview(meta);
      setDraftTitle(meta.title);
      setDraftImageUrl(meta.imageUrl);
      const validCat = categories.some((c) => c.id === meta.suggestedCategoryId)
        ? meta.suggestedCategoryId
        : categories[0]?.id || 'top';
      setDraftCategoryId(validCat);
      setDraftNotes('');
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleUploadPreviewShot = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processUploadedImageFile(file);
      setDraftImageUrl(compressed);
    } catch {
      // Ignore
    }
  };

  const handleSaveToWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPreview) return;

    const newItem: WishlistItem = {
      id: `wish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: draftTitle.trim() || `${draftPreview.platform} Product`,
      url: draftPreview.url,
      imageUrl: draftImageUrl.trim(),
      platform: draftPreview.platform,
      categoryId: draftCategoryId,
      notes: draftNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddWishlistItem(newItem);
    setDraftPreview(null);
    setUrlInput('');
    setDraftTitle('');
    setDraftImageUrl('');
    setDraftNotes('');
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-5">
      {/* Top Link Paste & Live Preview Extractor Card */}
      <section
        aria-label="Add Product Link to Wishlist"
        className="rounded-2xl theme-surface border p-4 sm:p-5"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold theme-text-primary tracking-tight">
              Shopping Wishlist
            </h2>
            <p className="text-xs theme-text-secondary">
              Paste any store product URL to preview it and jump back to the original store anytime
            </p>
          </div>
        </div>

        <form
          onSubmit={handleExtractPreview}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 theme-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste product link (Amazon, Flipkart, Myntra, Zara, H&M...)"
              aria-label="Product link URL"
              className="w-full h-11 pl-10 pr-3.5 rounded-xl theme-subtle border text-xs sm:text-sm theme-text-primary focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <button
            type="submit"
            disabled={isFetchingPreview || !urlInput.trim()}
            className="min-h-[44px] px-5 rounded-xl bg-[#3B82F6] hover:bg-blue-500 disabled:opacity-45 text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            {isFetchingPreview ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching Preview...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Preview Link</span>
              </>
            )}
          </button>
        </form>

        {/* Extracted Link Preview Confirmation Box */}
        {draftPreview && (
          <form
            onSubmit={handleSaveToWishlist}
            className="mt-4 p-4 rounded-2xl theme-subtle border space-y-4 animate-sheet-up"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold theme-text-primary">
                Product Link Preview ({draftPreview.platform})
              </span>
              <a
                href={draftPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#3B82F6] hover:underline inline-flex items-center gap-1"
              >
                <span>Test Original Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {draftPreview.fallbackReason && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{draftPreview.fallbackReason}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Visual Preview Thumbnail (Complete Uncropped View) */}
              <div className="w-full sm:w-36 h-44 sm:h-36 rounded-xl overflow-hidden border theme-border theme-surface flex items-center justify-center p-2 shrink-0">
                <ApparelVisual
                  src={draftImageUrl}
                  alt={draftTitle || 'Product preview'}
                  shape={
                    categoryMap.get(draftCategoryId)?.shape || 'complete_outfit'
                  }
                  label={draftPreview.platform}
                  wireframeSize="md"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium theme-text-secondary mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl theme-surface border text-xs sm:text-sm theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium theme-text-secondary mb-1">
                      Category
                    </label>
                    <select
                      value={draftCategoryId}
                      onChange={(e) => setDraftCategoryId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium theme-text-secondary mb-1">
                      Preview Image URL or Screenshot
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={draftImageUrl}
                        onChange={(e) => setDraftImageUrl(e.target.value)}
                        placeholder="https://...jpg"
                        className="flex-1 min-w-0 h-10 px-2.5 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadPreviewShot}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload product screenshot"
                        className="w-10 h-10 rounded-xl theme-surface border flex items-center justify-center theme-text-secondary hover:theme-text-primary cursor-pointer shrink-0"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium theme-text-secondary mb-1">
                    Notes (size, color, styling idea — optional)
                  </label>
                  <input
                    type="text"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    placeholder="Size M, pairs well with black trousers"
                    className="w-full h-10 px-3 rounded-xl theme-surface border text-xs theme-text-primary focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDraftPreview(null)}
                className="min-h-[42px] px-4 rounded-xl theme-surface border text-xs font-medium theme-text-secondary hover:theme-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-[#10B981] hover:bg-emerald-500 text-xs font-semibold text-zinc-950 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save to Wishlist</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Saved Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div className="rounded-2xl theme-surface border border-dashed p-10 text-center">
          <Heart className="w-8 h-8 theme-text-muted mx-auto mb-2.5" />
          <h3 className="text-sm font-semibold theme-text-primary">
            Your wishlist is empty
          </h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-md mx-auto">
            Paste any product URL above to preview the item, save it locally, and jump straight back to the original store whenever you are ready.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item) => {
            const cat = categoryMap.get(item.categoryId);
            return (
              <article
                key={item.id}
                className="rounded-2xl theme-surface border overflow-hidden flex flex-col justify-between transition-all hover:border-[#3B82F6]/60"
              >
                <div>
                  {/* Complete Uncropped Image Showcase — Click to Pop Up Full Image Preview */}
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    aria-label={`Preview full image of ${item.title}`}
                    className="group relative w-full h-60 sm:h-64 theme-subtle border-b theme-border flex items-center justify-center p-3 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                  >
                    <ApparelVisual
                      src={item.imageUrl}
                      alt={item.title}
                      shape={cat?.shape || 'top'}
                      label={cat?.label || item.platform}
                      wireframeSize="lg"
                      className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[11px] font-medium text-white">
                      {item.platform}
                    </span>
                    <span
                      title="View full image"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-black/65 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                    {cat && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono-tech text-zinc-200">
                        {cat.label}
                      </span>
                    )}
                  </button>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold theme-text-primary line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    {item.notes && (
                      <p className="text-xs theme-text-secondary mt-1.5 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Redirect to Original Product Site + Move to Wardrobe */}
                <div className="px-4 pb-4 pt-1 flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[42px] px-3 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open on {item.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onMoveWishlistToWardrobe(item)}
                    title="Move item to my Wardrobe"
                    className="min-h-[42px] px-3 rounded-xl theme-subtle border text-xs font-medium theme-text-primary hover:border-[#10B981] inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Shirt className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="hidden sm:inline">Own</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveWishlistItem(item.id)}
                    aria-label={`Remove ${item.title} from wishlist`}
                    className="w-10 h-10 rounded-xl theme-subtle border theme-text-muted hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full Image Preview Modal for Wishlist Items */}
      <FullImagePreviewModal
        isOpen={previewItem !== null}
        slides={
          previewItem
            ? ([
                {
                  id: previewItem.id,
                  title: previewItem.title,
                  imageUrl: previewItem.imageUrl,
                  categoryLabel:
                    categoryMap.get(previewItem.categoryId)?.label ||
                    previewItem.platform,
                  shape:
                    categoryMap.get(previewItem.categoryId)?.shape || 'top',
                  notes: previewItem.notes,
                  externalUrl: previewItem.url,
                  externalPlatform: previewItem.platform,
                },
              ] satisfies PreviewSlide[])
            : []
        }
        headerBadge={previewItem?.platform}
        headerTitle={previewItem?.title}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
};
