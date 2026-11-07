import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Camera,
  Download,
  FolderPlus,
  HardDrive,
  Heart,
  Home,
  Layers,
  Maximize2,
  Moon,
  Plus,
  Shirt,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  AppPreferences,
  BackupPayload,
  CategoryDefinition,
  OotdRecord,
  PlannedOutfitEntry,
  SavedOutfit,
  ToastMessage,
  WardrobeItem,
  WishlistItem,
} from './types/outfit';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PREFERENCES,
  getTodayDateInfo,
  HydratedDeviceState,
  hydrateFromDeviceStorage,
  idbSet,
} from './services/deviceStorageService';
import { ApparelVisual } from './components/ApparelVisual';
import { AddWardrobeItemModal } from './components/AddWardrobeItemModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MultiSelectOutfitCreator } from './components/MultiSelectOutfitCreator';
import { StyleChronicle } from './components/StyleChronicle';
import { OutfitAlternatives } from './components/OutfitAlternatives';
import { ProportionsAnalytics } from './components/ProportionsAnalytics';
import { WishlistView } from './components/WishlistView';
import { StorageAndBackupModal } from './components/StorageAndBackupModal';
import { ToastContainer } from './components/ToastContainer';
import { FullImagePreviewModal, PreviewSlide } from './components/FullImagePreviewModal';
import { LandingPage } from './components/LandingPage';

type ActiveTab = 'home' | 'wardrobe' | 'style' | 'insights';
type AppView = 'landing' | 'app';

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'style', label: 'Style', icon: Sparkles },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
];

export function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [planner, setPlanner] = useState<Record<string, PlannedOutfitEntry>>({});
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [ootd, setOotd] = useState<OotdRecord | null>(null);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);

  const [view, setView] = useState<AppView>(() =>
    typeof window !== 'undefined' && window.location.hash === '#app' ? 'app' : 'landing'
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [wardrobeView, setWardrobeView] = useState<'pieces' | 'wishlist'>('pieces');
  const [wardrobeCategoryFilter, setWardrobeCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadInitialCategory, setUploadInitialCategory] = useState<string | undefined>();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOutfitCreatorOpen, setIsOutfitCreatorOpen] = useState(false);
  const [creatorDefaultOotd, setCreatorDefaultOotd] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [previewSlides, setPreviewSlides] = useState<PreviewSlide[] | null>(null);
  const [previewHeader, setPreviewHeader] = useState<string | undefined>();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === '#app' ? 'app' : 'landing');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const launchApp = useCallback(() => {
    window.location.hash = '#app';
    setView('app');
    window.scrollTo({ top: 0 });
  }, []);

  const goToLanding = useCallback((target?: string) => {
    window.location.hash = target ? `#${target}` : '';
    setView('landing');
    if (!target) window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    let active = true;
    hydrateFromDeviceStorage().then((loaded) => {
      if (!active) return;
      setCategories(loaded.categories);
      setWardrobe(loaded.wardrobe);
      setSavedOutfits(loaded.savedOutfits);
      setPlanner(loaded.planner);
      setWishlist(loaded.wishlist);
      setPreferences(loaded.preferences);
      const today = getTodayDateInfo();
      if (loaded.ootd && loaded.ootd.dateKey === today.dateKey) {
        setOotd(loaded.ootd);
      } else if (loaded.planner[today.dateKey]) {
        const plannedToday = loaded.planner[today.dateKey];
        const autoOotd: OotdRecord = {
          dateKey: today.dateKey,
          formattedDate: today.formattedDate,
          title: plannedToday.outfitTitle,
          occasion: plannedToday.occasion,
          items: plannedToday.items,
          isUserCreated: true,
          updatedAt: new Date().toISOString(),
        };
        setOotd(autoOotd);
        idbSet('ootd', autoOotd);
      } else {
        setOotd(null);
      }
      setIsHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.theme === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', preferences.theme === 'dark' ? '#161411' : '#F9F6F0');
  }, [preferences.theme]);

  const handleToggleTheme = () => {
    const next: AppPreferences = { ...preferences, theme: preferences.theme === 'dark' ? 'light' : 'dark' };
    setPreferences(next);
    idbSet('preferences', next);
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const itemCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    wardrobe.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }, [wardrobe]);

  const handleAddWardrobeItems = (newItems: WardrobeItem[]) => {
    setWardrobe((prev) => {
      const updated = [...newItems, ...prev];
      idbSet('wardrobe', updated);
      return updated;
    });
    pushToast('success', newItems.length > 1 ? `Added ${newItems.length} pieces` : 'Added to wardrobe', 'Stored privately on your device.');
  };

  const handleDeleteWardrobeItem = (itemId: string) => {
    setWardrobe((prev) => {
      const updated = prev.filter((i) => i.id !== itemId);
      idbSet('wardrobe', updated);
      return updated;
    });
    pushToast('info', 'Piece removed', 'Deleted from your wardrobe.');
  };

  const handleAddCategory = (newCat: CategoryDefinition) => {
    setCategories((prev) => {
      const updated = [...prev, newCat];
      idbSet('categories', updated);
      return updated;
    });
    pushToast('success', `Category “${newCat.label}” created`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== categoryId);
      idbSet('categories', updated);
      return updated;
    });
    if (wardrobeCategoryFilter === categoryId) setWardrobeCategoryFilter('all');
    pushToast('info', 'Category removed');
  };

  const handleSetOotdDirect = (title: string, occasion: string, items: WardrobeItem[]) => {
    const today = getTodayDateInfo();
    const record: OotdRecord = {
      dateKey: today.dateKey,
      formattedDate: today.formattedDate,
      title,
      occasion,
      items,
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    setOotd(record);
    idbSet('ootd', record);
    pushToast('success', 'Outfit of the Day set', `“${title}” is active for today.`);
  };

  const handleSaveComposedOutfit = (outfit: SavedOutfit, alsoSetAsOotd: boolean) => {
    setSavedOutfits((prev) => {
      const updated = [outfit, ...prev];
      idbSet('savedOutfits', updated);
      return updated;
    });
    if (alsoSetAsOotd) {
      handleSetOotdDirect(outfit.title, outfit.occasion, outfit.items);
    } else {
      pushToast('success', 'Outfit saved', `“${outfit.title}” added to your lookbook.`);
    }
  };

  const handleShuffleOotd = () => {
    if (wardrobe.length === 0) {
      pushToast('warning', 'Wardrobe empty', 'Upload your pieces first to generate a look.');
      return;
    }
    const byCategory = new Map<string, WardrobeItem[]>();
    wardrobe.forEach((item) => {
      const arr = byCategory.get(item.categoryId) || [];
      arr.push(item);
      byCategory.set(item.categoryId, arr);
    });
    const completeIds = new Set(categories.filter((c) => c.isCompleteOutfit).map((c) => c.id));
    const completeItems = wardrobe.filter((i) => completeIds.has(i.categoryId));
    const nonComplete = [...byCategory.entries()].filter(([id]) => !completeIds.has(id));
    const chosen: WardrobeItem[] = [];
    if (completeItems.length > 0 && (nonComplete.length < 2 || Math.random() < 0.35)) {
      chosen.push(completeItems[Math.floor(Math.random() * completeItems.length)]);
      const shoes = byCategory.get('footwear');
      if (shoes?.length) chosen.push(shoes[Math.floor(Math.random() * shoes.length)]);
      const accs = byCategory.get('accessories');
      if (accs?.length) chosen.push(accs[Math.floor(Math.random() * accs.length)]);
    } else {
      nonComplete.forEach(([, pool]) => {
        if (pool.length) chosen.push(pool[Math.floor(Math.random() * pool.length)]);
      });
    }
    if (chosen.length === 0) chosen.push(wardrobe[Math.floor(Math.random() * wardrobe.length)]);
    handleSetOotdDirect(`Daily Wardrobe Mix (${chosen.length} pieces)`, 'Daily Style', chosen);
  };

  const handleDeleteSavedOutfit = (outfitId: string) => {
    setSavedOutfits((prev) => {
      const updated = prev.filter((o) => o.id !== outfitId);
      idbSet('savedOutfits', updated);
      return updated;
    });
    pushToast('info', 'Outfit removed');
  };

  const handleSavePlannedDate = (entry: PlannedOutfitEntry) => {
    setPlanner((prev) => {
      const updated = { ...prev, [entry.dateKey]: entry };
      idbSet('planner', updated);
      return updated;
    });
    const today = getTodayDateInfo();
    if (entry.dateKey === today.dateKey && entry.items.length > 0) {
      const record: OotdRecord = {
        dateKey: today.dateKey,
        formattedDate: today.formattedDate,
        title: entry.outfitTitle,
        occasion: entry.occasion,
        items: entry.items,
        isUserCreated: true,
        updatedAt: new Date().toISOString(),
      };
      setOotd(record);
      idbSet('ootd', record);
    }
    pushToast('success', `Planned for ${entry.dateKey}`, `${entry.outfitTitle} · ${entry.occasion}`);
  };

  const handleRemovePlannedDate = (dateKey: string) => {
    setPlanner((prev) => {
      const updated = { ...prev };
      delete updated[dateKey];
      idbSet('planner', updated);
      return updated;
    });
    pushToast('info', 'Date cleared', `Removed plan for ${dateKey}.`);
  };

  const handleAddWishlistItem = (item: WishlistItem) => {
    setWishlist((prev) => {
      const updated = [item, ...prev];
      idbSet('wishlist', updated);
      return updated;
    });
    pushToast('success', 'Saved to wishlist', `${item.title} (${item.platform})`);
  };

  const handleRemoveWishlistItem = (id: string) => {
    setWishlist((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      idbSet('wishlist', updated);
      return updated;
    });
    pushToast('info', 'Removed from wishlist');
  };

  const handleMoveWishlistToWardrobe = (wishItem: WishlistItem) => {
    const newItem: WardrobeItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: wishItem.title,
      categoryId: wishItem.categoryId,
      imageUrl: wishItem.imageUrl,
      notes: wishItem.notes ? `${wishItem.notes} (${wishItem.platform})` : `From ${wishItem.platform}`,
      tags: [wishItem.platform.toLowerCase()],
      createdAt: new Date().toISOString(),
    };
    handleAddWardrobeItems([newItem]);
    setWishlist((prev) => {
      const updated = prev.filter((w) => w.id !== wishItem.id);
      idbSet('wishlist', updated);
      return updated;
    });
  };

  const handleImportBackup = (payload: BackupPayload, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setCategories(payload.categories);
      setWardrobe(payload.wardrobe);
      setSavedOutfits(payload.savedOutfits);
      setPlanner(payload.planner);
      setWishlist(payload.wishlist);
      setOotd(payload.ootd);
      setPreferences(payload.preferences);
      Promise.all([
        idbSet('categories', payload.categories),
        idbSet('wardrobe', payload.wardrobe),
        idbSet('savedOutfits', payload.savedOutfits),
        idbSet('planner', payload.planner),
        idbSet('wishlist', payload.wishlist),
        idbSet('ootd', payload.ootd),
        idbSet('preferences', payload.preferences),
      ]);
      pushToast('success', 'Backup restored', `${payload.wardrobe.length} pieces · ${payload.savedOutfits.length} outfits.`);
      return;
    }
    const mergedCategories = [...categories];
    const catIds = new Set(categories.map((c) => c.id));
    payload.categories.forEach((c) => {
      if (!catIds.has(c.id)) mergedCategories.push(c);
    });
    const wardrobeIds = new Set(wardrobe.map((w) => w.id));
    const mergedWardrobe = [...wardrobe, ...payload.wardrobe.filter((w) => !wardrobeIds.has(w.id))];
    const outfitIds = new Set(savedOutfits.map((o) => o.id));
    const mergedOutfits = [...savedOutfits, ...payload.savedOutfits.filter((o) => !outfitIds.has(o.id))];
    const mergedPlanner = { ...planner, ...payload.planner };
    const wishIds = new Set(wishlist.map((w) => w.id));
    const mergedWishlist = [...wishlist, ...payload.wishlist.filter((w) => !wishIds.has(w.id))];
    setCategories(mergedCategories);
    setWardrobe(mergedWardrobe);
    setSavedOutfits(mergedOutfits);
    setPlanner(mergedPlanner);
    setWishlist(mergedWishlist);
    Promise.all([
      idbSet('categories', mergedCategories),
      idbSet('wardrobe', mergedWardrobe),
      idbSet('savedOutfits', mergedOutfits),
      idbSet('planner', mergedPlanner),
      idbSet('wishlist', mergedWishlist),
    ]);
    pushToast('success', 'Backup merged', `Wardrobe now has ${mergedWardrobe.length} pieces.`);
  };

  const handleShare = async (title: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(`${title}\n${text}`);
      pushToast('success', 'Copied to clipboard', 'Share your styling notes anywhere.');
    } catch {
      pushToast('info', 'Share ready', text.slice(0, 80));
    }
  };

  const openItemPreview = (item: WardrobeItem, header?: string) => {
    setPreviewHeader(header);
    setPreviewSlides([
      {
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        categoryLabel: categoryMap.get(item.categoryId)?.label,
        shape: categoryMap.get(item.categoryId)?.shape || 'top',
        subtitle: item.notes,
      },
    ]);
  };

  const todayInfo = useMemo(() => getTodayDateInfo(), []);
  const filteredWardrobe = useMemo(
    () => (wardrobeCategoryFilter === 'all' ? wardrobe : wardrobe.filter((i) => i.categoryId === wardrobeCategoryFilter)),
    [wardrobe, wardrobeCategoryFilter]
  );

  const currentDeviceSnapshot: HydratedDeviceState = useMemo(
    () => ({ categories, wardrobe, savedOutfits, planner, wishlist, ootd, preferences }),
    [categories, wardrobe, savedOutfits, planner, wishlist, ootd, preferences]
  );

  if (!isHydrated) {
    return (
      <div className="min-h-screen editorial-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-full border theme-border flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--bg-overlay)' }}>
            <Layers className="w-5 h-5 animate-pulse" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
          </div>
          <p className="eyebrow">Opening your wardrobe</p>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onLaunchApp={launchApp}
        theme={preferences.theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen editorial-bg paper-grain theme-text-primary flex flex-col relative">
      {/* Global header */}
      <header className="sticky top-0 z-30 border-b theme-border backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 88%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setActiveTab('home')} className="text-left cursor-pointer">
            <p className="eyebrow !text-[9px]">Wardrobe & Style Chronicle</p>
            <h1 className="font-serif-display text-[22px] leading-none theme-text-primary">Wardro</h1>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadInitialCategory(undefined);
                setIsUploadModalOpen(true);
              }}
              className="min-h-[42px] px-4 rounded-full pill-dark text-[11px] font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <button
              type="button"
              onClick={() => goToLanding('download')}
              aria-label="Get the Android app"
              title="Get the Android app"
              className="circle-btn"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={handleToggleTheme} aria-label="Toggle light and dark mode" className="circle-btn">
              {preferences.theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>
            <button type="button" onClick={() => setIsBackupModalOpen(true)} aria-label="Storage and backup" className="circle-btn">
              <HardDrive className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-safe-dock relative z-10">
        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-editorial-up">
            <section className="editorial-card overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-[420px]">
                  <img
                    src={ootd?.items[0]?.imageUrl || '/images/alt-minimal.jpg'}
                    alt={ootd ? ootd.title : 'Editorial flat-lay inspiration'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/55 text-[10px] uppercase tracking-[0.14em] text-white">
                    {ootd ? 'Today’s Outfit' : 'Editorial Inspiration'}
                  </span>
                  {ootd && ootd.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewHeader(ootd.title);
                        setPreviewSlides(
                          ootd.items.map((p) => ({
                            id: p.id,
                            title: p.title,
                            imageUrl: p.imageUrl,
                            categoryLabel: categoryMap.get(p.categoryId)?.label,
                            shape: categoryMap.get(p.categoryId)?.shape || 'top',
                          }))
                        );
                      }}
                      className="absolute bottom-4 right-4 circle-btn !bg-white/90"
                      aria-label="Preview today's outfit"
                    >
                      <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
                  <p className="eyebrow">{todayInfo.formattedDate}</p>
                  <h2 className="font-serif-display text-[32px] sm:text-[40px] leading-[1.08] theme-text-primary mt-2">
                    {ootd ? ootd.title : 'Begin your style chronicle.'}
                  </h2>
                  <p className="text-[14px] theme-text-secondary mt-3 max-w-md leading-[1.5]">
                    {ootd
                      ? `Occasion: ${ootd.occasion}. ${ootd.items.length} piece${ootd.items.length === 1 ? '' : 's'} composed from your own wardrobe.`
                      : 'Upload the pieces you own, compose looks across categories, and let your calendar remember what you wore.'}
                  </p>
                  {ootd && (
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto hide-scrollbar">
                      {ootd.items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openItemPreview(p, ootd.title)}
                          className="w-14 h-14 rounded-[10px] overflow-hidden border theme-border shrink-0 cursor-zoom-in"
                        >
                          <ApparelVisual src={p.imageUrl} alt={p.title} shape={categoryMap.get(p.categoryId)?.shape || 'top'} wireframeSize="xs" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-6">
                    <button type="button" onClick={handleShuffleOotd} className="min-h-[44px] px-5 rounded-full pill-dark text-[11px] font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-1.5 cursor-pointer">
                      <Shuffle className="w-4 h-4" strokeWidth={1.5} /> Shuffle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorDefaultOotd(true);
                        setIsOutfitCreatorOpen(true);
                      }}
                      className="min-h-[44px] px-5 rounded-full border theme-border text-[11px] font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} /> Create OOTD
                    </button>
                    <button type="button" onClick={() => setActiveTab('style')} className="min-h-[44px] px-5 rounded-full border theme-border text-[11px] font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-1.5 cursor-pointer">
                      <Calendar className="w-4 h-4" strokeWidth={1.5} /> Chronicle
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Upload Image', desc: 'Add pieces from your device', icon: Camera, action: () => setIsUploadModalOpen(true) },
                { label: 'Create Outfit', desc: 'Combine 2+ categories', icon: Layers, action: () => { setCreatorDefaultOotd(false); setIsOutfitCreatorOpen(true); } },
                { label: 'Add Category', desc: `${categories.length} categories`, icon: FolderPlus, action: () => setIsCategoryModalOpen(true) },
                { label: 'Wishlist', desc: `${wishlist.length} saved links`, icon: Heart, action: () => { setActiveTab('wardrobe'); setWardrobeView('wishlist'); } },
              ].map((tile) => (
                <button key={tile.label} type="button" onClick={tile.action} className="editorial-card p-4 text-left hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <tile.icon className="w-5 h-5 mb-3" strokeWidth={1.5} style={{ color: 'var(--accent-ochre-deep)' }} />
                  <p className="font-serif-display text-[18px] theme-text-primary">{tile.label}</p>
                  <p className="text-[12px] theme-text-secondary mt-0.5">{tile.desc}</p>
                </button>
              ))}
            </section>

            {/* Saved looks */}
            <section className="editorial-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="eyebrow">Lookbook</p>
                  <h3 className="font-serif-display text-[22px] theme-text-primary">Saved outfits</h3>
                </div>
                <button type="button" onClick={() => { setCreatorDefaultOotd(false); setIsOutfitCreatorOpen(true); }} className="min-h-[40px] px-4 rounded-full border theme-border text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Compose
                </button>
              </div>
              {savedOutfits.length === 0 ? (
                <p className="text-[13px] theme-text-secondary rounded-[14px] border border-dashed theme-border p-5 text-center">
                  No saved outfits yet. Compose a look from two or more pieces to begin your lookbook.
                </p>
              ) : (
                <div className="snap-carousel hide-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {savedOutfits.map((outfit) => (
                    <article key={outfit.id} className="snap-card shrink-0 w-[240px] rounded-[16px] border theme-border p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {outfit.items.slice(0, 4).map((p) => (
                          <div key={p.id} className="aspect-square rounded-[8px] overflow-hidden border theme-border">
                            <ApparelVisual src={p.imageUrl} alt={p.title} shape={categoryMap.get(p.categoryId)?.shape || 'top'} wireframeSize="xs" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className="font-serif-display text-[17px] theme-text-primary truncate">{outfit.title}</p>
                      <p className="text-[11px] theme-text-secondary">{outfit.occasion}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <button type="button" onClick={() => handleSetOotdDirect(outfit.title, outfit.occasion, outfit.items)} className="flex-1 min-h-[36px] rounded-full pill-dark text-[10px] font-semibold uppercase tracking-[0.08em] cursor-pointer">
                          Wear
                        </button>
                        <button type="button" onClick={() => handleDeleteSavedOutfit(outfit.id)} aria-label={`Delete ${outfit.title}`} className="w-9 h-9 rounded-full border theme-border flex items-center justify-center cursor-pointer" style={{ color: 'var(--danger)' }}>
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* WARDROBE */}
        {activeTab === 'wardrobe' && (
          <div className="space-y-5 animate-editorial-up">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <p className="eyebrow">Wardrobe</p>
                <h2 className="font-serif-display text-[30px] sm:text-[36px] leading-[1.1] theme-text-primary">The pieces you own.</h2>
              </div>
              <div className="inline-flex items-center rounded-full p-1 border theme-border" style={{ backgroundColor: 'var(--bg-overlay)' }}>
                {(['pieces', 'wishlist'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setWardrobeView(view)}
                    className={`min-h-[36px] px-5 rounded-full text-[12px] font-semibold capitalize cursor-pointer ${wardrobeView === view ? 'pill-dark' : 'theme-text-secondary'}`}
                  >
                    {view === 'pieces' ? `Pieces (${wardrobe.length})` : `Wishlist (${wishlist.length})`}
                  </button>
                ))}
              </div>
            </div>

            {wardrobeView === 'wishlist' ? (
              <WishlistView
                categories={categories}
                wishlist={wishlist}
                onAddWishlistItem={handleAddWishlistItem}
                onRemoveWishlistItem={handleRemoveWishlistItem}
                onMoveWishlistToWardrobe={handleMoveWishlistToWardrobe}
              />
            ) : (
              <section className="editorial-card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    <button type="button" onClick={() => setWardrobeCategoryFilter('all')} className={`min-h-[36px] px-4 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] border cursor-pointer ${wardrobeCategoryFilter === 'all' ? 'pill-dark border-transparent' : 'theme-border theme-text-secondary'}`}>
                      All
                    </button>
                    {categories.map((cat) => (
                      <button key={cat.id} type="button" onClick={() => setWardrobeCategoryFilter(cat.id)} className={`min-h-[36px] px-4 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] border cursor-pointer whitespace-nowrap ${wardrobeCategoryFilter === cat.id ? 'pill-dark border-transparent' : 'theme-border theme-text-secondary'}`}>
                        {cat.label} ({itemCountsByCategory[cat.id] || 0})
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="min-h-[40px] px-4 rounded-full border theme-border text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 cursor-pointer">
                      <FolderPlus className="w-3.5 h-3.5" strokeWidth={1.5} /> Category
                    </button>
                    <button type="button" onClick={() => { setUploadInitialCategory(wardrobeCategoryFilter === 'all' ? undefined : wardrobeCategoryFilter); setIsUploadModalOpen(true); }} className="min-h-[40px] px-4 rounded-full pill-dark text-[11px] font-semibold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 cursor-pointer">
                      <Camera className="w-3.5 h-3.5" strokeWidth={1.5} /> Upload
                    </button>
                  </div>
                </div>

                {filteredWardrobe.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed theme-border p-10 text-center">
                    <Camera className="w-8 h-8 mx-auto mb-3 theme-text-muted" strokeWidth={1.5} />
                    <p className="font-serif-display text-[20px] theme-text-primary">Your wardrobe awaits.</p>
                    <p className="text-[13px] theme-text-secondary mt-1 mb-5 max-w-sm mx-auto">Upload photos of complete outfits or individual pieces. Everything stays on your device.</p>
                    <button type="button" onClick={() => setIsUploadModalOpen(true)} className="min-h-[44px] px-6 rounded-full pill-dark text-[11px] font-semibold uppercase tracking-[0.1em] cursor-pointer">
                      Upload photos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {filteredWardrobe.map((item) => (
                      <article key={item.id} className="group rounded-[16px] border theme-border overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <button type="button" onClick={() => openItemPreview(item)} className="relative block w-full aspect-square cursor-zoom-in" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <ApparelVisual src={item.imageUrl} alt={item.title} shape={categoryMap.get(item.categoryId)?.shape || 'top'} label={categoryMap.get(item.categoryId)?.label} wireframeSize="md" className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]" />
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[9px] uppercase tracking-[0.1em] text-white">
                            {categoryMap.get(item.categoryId)?.label || 'Piece'}
                          </span>
                        </button>
                        <div className="p-2.5 flex items-start justify-between gap-1.5">
                          <p className="text-[12px] font-semibold theme-text-primary line-clamp-2 leading-snug">{item.title}</p>
                          <button type="button" onClick={() => handleDeleteWardrobeItem(item.id)} aria-label={`Delete ${item.title}`} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ color: 'var(--danger)' }}>
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            <OutfitAlternatives
              categories={categories}
              wardrobe={wardrobe}
              savedOutfits={savedOutfits}
              onBack={() => setActiveTab('home')}
              onShare={handleShare}
              onCompose={() => { setCreatorDefaultOotd(false); setIsOutfitCreatorOpen(true); }}
              onUpload={() => setIsUploadModalOpen(true)}
              onWear={handleSetOotdDirect}
            />
            <StyleChronicle
              categories={categories}
              wardrobe={wardrobe}
              savedOutfits={savedOutfits}
              planner={planner}
              onSavePlannedDate={handleSavePlannedDate}
              onRemovePlannedDate={handleRemovePlannedDate}
              onPromoteToOotd={(entry) => handleSetOotdDirect(entry.outfitTitle, entry.occasion, entry.items)}
              onOpenComposeOutfit={() => { setCreatorDefaultOotd(false); setIsOutfitCreatorOpen(true); }}
            />
          </div>
        )}

        {/* INSIGHTS */}
        {activeTab === 'insights' && (
          <ProportionsAnalytics
            categories={categories}
            wardrobe={wardrobe}
            savedOutfits={savedOutfits}
            planner={planner}
            ootd={ootd}
            onBack={() => setActiveTab('home')}
            onUpload={() => setIsUploadModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav aria-label="Primary" className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto rounded-full border theme-border backdrop-blur-md px-2 py-2 flex items-center justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-overlay) 92%, transparent)' }}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="relative flex-1 min-h-[48px] rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold">{item.label}</span>
                <span className="absolute bottom-1 w-1 h-1 rounded-full transition-opacity" style={{ backgroundColor: 'var(--accent-ochre)', opacity: active ? 1 : 0 }} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <AddWardrobeItemModal
        isOpen={isUploadModalOpen}
        categories={categories}
        initialCategoryId={uploadInitialCategory}
        onClose={() => setIsUploadModalOpen(false)}
        onAddItems={handleAddWardrobeItems}
        onOpenNewCategoryModal={() => setIsCategoryModalOpen(true)}
      />
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        itemCountsByCategory={itemCountsByCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
      <MultiSelectOutfitCreator
        isOpen={isOutfitCreatorOpen}
        categories={categories}
        wardrobe={wardrobe}
        defaultMakeOotd={creatorDefaultOotd}
        onClose={() => setIsOutfitCreatorOpen(false)}
        onSaveOutfit={handleSaveComposedOutfit}
        onSetOotdOnly={handleSetOotdDirect}
        onOpenUploadItem={() => setIsUploadModalOpen(true)}
      />
      <StorageAndBackupModal
        isOpen={isBackupModalOpen}
        currentState={currentDeviceSnapshot}
        onClose={() => setIsBackupModalOpen(false)}
        onImportBackup={handleImportBackup}
        onExportSuccess={(filename) => pushToast('success', 'Backup exported', `Downloaded ${filename}`)}
        onError={(msg) => pushToast('error', 'Import failed', msg)}
      />
      <FullImagePreviewModal
        isOpen={previewSlides !== null}
        slides={previewSlides || []}
        headerTitle={previewHeader}
        onClose={() => setPreviewSlides(null)}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
