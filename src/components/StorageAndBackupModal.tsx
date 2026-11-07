import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { BackupPayload } from '../types/outfit';
import {
  DeviceStorageMetrics,
  downloadBackupJsonFile,
  getDeviceStorageMetrics,
  HydratedDeviceState,
  parseAndValidateBackupJson,
} from '../services/deviceStorageService';

interface StorageAndBackupModalProps {
  isOpen: boolean;
  currentState: HydratedDeviceState;
  onClose: () => void;
  onImportBackup: (payload: BackupPayload, mode: 'merge' | 'replace') => void;
  onExportSuccess: (filename: string) => void;
  onError: (message: string) => void;
}

export const StorageAndBackupModal: React.FC<StorageAndBackupModalProps> = ({
  isOpen,
  currentState,
  onClose,
  onImportBackup,
  onExportSuccess,
  onError,
}) => {
  const [metrics, setMetrics] = useState<DeviceStorageMetrics | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingBackup(null);
      getDeviceStorageMetrics(currentState).then(setMetrics);
    }
  }, [isOpen, currentState]);

  if (!isOpen) return null;

  const handleExportClick = () => {
    const filename = downloadBackupJsonFile(currentState);
    onExportSuccess(filename);
  };

  const handleBackupFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const validated = parseAndValidateBackupJson(reader.result as string);
        setPendingBackup(validated);
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : 'Invalid backup file. Please choose a valid Wardro JSON export.'
        );
      }
    };
    reader.onerror = () => onError('Unable to read backup file from device.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    onImportBackup(pendingBackup, importMode);
    setPendingBackup(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-backup-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl theme-surface border shadow-2xl overflow-hidden animate-sheet-up max-h-[90vh] flex flex-col">
        <div className="px-5 pt-3 pb-3.5 border-b theme-border flex items-center justify-between">
          <div>
            <div className="w-10 h-1 rounded-full bg-zinc-500/40 mx-auto mb-2.5 sm:hidden" />
            <h2
              id="storage-backup-title"
              className="text-base font-semibold theme-text-primary tracking-tight flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4 text-[#3B82F6]" />
              Device Storage &amp; Data Backup
            </h2>
            <p className="text-xs theme-text-secondary mt-0.5">
              High-capacity IndexedDB storage + portable JSON import/export
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close storage and backup modal"
            className="w-11 h-11 rounded-xl theme-subtle border flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Client Device Storage Telemetry */}
          <div className="p-4 rounded-2xl theme-subtle border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#10B981]" />
                <span className="font-semibold theme-text-primary">
                  Client Device Storage (IndexedDB)
                </span>
              </div>

              {metrics?.isPersisted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#10B981]/15 text-[#10B981]">
                  <ShieldCheck className="w-3 h-3" />
                  Persistent
                </span>
              )}
            </div>

            {metrics && (
              <>
                <div className="flex items-center justify-between font-mono-tech text-[11px] theme-text-secondary">
                  <span>Used: {metrics.usedLabel}</span>
                  <span>Device Quota: {metrics.quotaLabel}</span>
                </div>
                <div className="w-full h-2.5 rounded-full theme-surface overflow-hidden border theme-border">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-300"
                    style={{ width: `${Math.max(2, metrics.percentUsed)}%` }}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl theme-surface border">
                <span className="block font-mono-tech text-sm font-bold theme-text-primary">
                  {currentState.wardrobe.length}
                </span>
                <span className="text-[10px] theme-text-muted">Items</span>
              </div>
              <div className="p-2 rounded-xl theme-surface border">
                <span className="block font-mono-tech text-sm font-bold theme-text-primary">
                  {currentState.savedOutfits.length}
                </span>
                <span className="text-[10px] theme-text-muted">Outfits</span>
              </div>
              <div className="p-2 rounded-xl theme-surface border">
                <span className="block font-mono-tech text-sm font-bold theme-text-primary">
                  {Object.keys(currentState.planner).length}
                </span>
                <span className="text-[10px] theme-text-muted">Planned</span>
              </div>
              <div className="p-2 rounded-xl theme-surface border">
                <span className="block font-mono-tech text-sm font-bold theme-text-primary">
                  {currentState.wishlist.length}
                </span>
                <span className="text-[10px] theme-text-muted">Wishlist</span>
              </div>
            </div>
          </div>

          {/* Export Data Section */}
          <div className="p-4 rounded-2xl theme-subtle border space-y-2.5">
            <h3 className="text-sm font-semibold theme-text-primary">
              Export Data Backup
            </h3>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Download a full JSON archive containing all your uploaded wardrobe photos, custom categories, saved outfits, monthly planner dates, and wishlist links.
            </p>
            <button
              type="button"
              onClick={handleExportClick}
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Wardrobe &amp; Planner (.json)</span>
            </button>
          </div>

          {/* Import Data Section */}
          <div className="p-4 rounded-2xl theme-subtle border space-y-3">
            <h3 className="text-sm font-semibold theme-text-primary">
              Import Data Backup
            </h3>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Restore your wardrobe from a previously exported Wardro JSON file.
            </p>

            {/* Merge vs Replace Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`min-h-[40px] px-3 rounded-xl font-medium border transition-colors cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6]'
                    : 'theme-surface theme-text-secondary'
                }`}
              >
                Merge with Current
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`min-h-[40px] px-3 rounded-xl font-medium border transition-colors cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6]'
                    : 'theme-surface theme-text-secondary'
                }`}
              >
                Replace All Data
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleBackupFileSelected}
              className="hidden"
            />

            {!pendingBackup ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[44px] px-4 rounded-xl theme-surface hover:border-[#3B82F6] border text-xs font-semibold theme-text-primary inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#10B981]" />
                <span>Choose Backup File (.json)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl theme-surface border border-[#10B981]/50 space-y-2.5">
                <div className="flex items-center gap-2 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Backup Verified &amp; Ready to Import</span>
                </div>
                <p className="text-[11px] theme-text-secondary">
                  Contains {pendingBackup.wardrobe.length} wardrobe items,{' '}
                  {pendingBackup.savedOutfits.length} outfits,{' '}
                  {Object.keys(pendingBackup.planner).length} planned dates, and{' '}
                  {pendingBackup.wishlist.length} wishlist links.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingBackup(null)}
                    className="flex-1 min-h-[40px] rounded-xl theme-subtle border font-medium theme-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="flex-[1.5] min-h-[40px] rounded-xl bg-[#10B981] hover:bg-emerald-500 font-semibold text-zinc-950 cursor-pointer"
                  >
                    Confirm {importMode === 'merge' ? 'Merge' : 'Replace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
