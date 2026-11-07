import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { WireframeShape } from '../types/outfit';
import { ApparelVisual } from './ApparelVisual';

export interface PreviewSlide {
  id: string;
  title: string;
  imageUrl: string;
  categoryLabel?: string;
  shape?: WireframeShape;
  subtitle?: string;
  notes?: string;
  externalUrl?: string;
  externalPlatform?: string;
}

interface FullImagePreviewModalProps {
  isOpen: boolean;
  slides: PreviewSlide[];
  initialIndex?: number;
  headerBadge?: string;
  headerTitle?: string;
  onClose: () => void;
}

export const FullImagePreviewModal: React.FC<FullImagePreviewModalProps> = ({
  isOpen,
  slides,
  initialIndex = 0,
  headerBadge,
  headerTitle,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, isOpen, slides]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && slides.length > 1) {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft' && slides.length > 1) {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  if (!isOpen || slides.length === 0) return null;

  const safeIndex = Math.min(activeIndex, slides.length - 1);
  const current = slides[safeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle || current.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl theme-surface border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-4 sm:px-5 py-3 border-b theme-border flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {headerBadge && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981]">
                  {headerBadge}
                </span>
              )}
              {current.categoryLabel && (
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[#3B82F6]">
                  {current.categoryLabel}
                </span>
              )}
              {slides.length > 1 && (
                <span className="font-mono-tech text-[11px] theme-text-muted">
                  ({safeIndex + 1} / {slides.length})
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold theme-text-primary truncate mt-0.5">
              {headerTitle || current.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close full image preview"
            className="w-11 h-11 rounded-xl theme-subtle border flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Uncropped Image Viewport */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[420px] theme-subtle flex items-center justify-center p-4 overflow-hidden">
          <ApparelVisual
            src={current.imageUrl}
            alt={current.title}
            shape={current.shape || 'complete_outfit'}
            label={current.categoryLabel || current.title}
            wireframeSize="lg"
            className="w-full h-full max-h-[62vh] object-contain rounded-xl"
          />

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous piece"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next piece"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Multi-Piece Thumbnail Strip (when viewing a multi-item day outfit) */}
        {slides.length > 1 && (
          <div className="px-4 py-2.5 border-t theme-border theme-subtle flex items-center justify-center gap-2 overflow-x-auto shrink-0">
            {slides.map((slide, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={`${slide.id}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-13 h-13 rounded-xl overflow-hidden border-2 p-0.5 transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30'
                      : 'theme-border opacity-65 hover:opacity-100'
                  }`}
                >
                  <ApparelVisual
                    src={slide.imageUrl}
                    alt={slide.title}
                    shape={slide.shape || 'top'}
                    wireframeSize="xs"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Footer Caption & Action */}
        <div className="px-4 sm:px-5 py-3.5 border-t theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold theme-text-primary truncate">
              {current.title}
            </p>
            {(current.subtitle || current.notes) && (
              <p className="text-xs theme-text-secondary truncate mt-0.5">
                {current.subtitle || current.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {current.externalUrl && (
              <a
                href={current.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Open on {current.externalPlatform || 'Store'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 rounded-xl theme-subtle border text-xs font-semibold theme-text-primary hover:border-[#3B82F6] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
