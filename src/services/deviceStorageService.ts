import {
  AppPreferences,
  BackupPayload,
  CategoryDefinition,
  OotdRecord,
  PlannedOutfitEntry,
  SavedOutfit,
  WardrobeItem,
  WishlistItem,
} from '../types/outfit';

const DB_NAME = 'WardroDeviceDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'complete_outfit',
    label: 'Complete Outfit',
    shape: 'complete_outfit',
    isDefault: true,
    isCompleteOutfit: true,
  },
  {
    id: 'top',
    label: 'Top',
    shape: 'top',
    isDefault: true,
  },
  {
    id: 'bottom',
    label: 'Bottom',
    shape: 'bottom',
    isDefault: true,
  },
  {
    id: 'footwear',
    label: 'Footwear',
    shape: 'footwear',
    isDefault: true,
  },
  {
    id: 'accessories',
    label: 'Accessories',
    shape: 'accessories',
    isDefault: true,
  },
];

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'light',
};

export interface HydratedDeviceState {
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  planner: Record<string, PlannedOutfitEntry>;
  wishlist: WishlistItem[];
  ootd: OotdRecord | null;
  preferences: AppPreferences;
}

export interface DeviceStorageMetrics {
  usedBytes: number;
  quotaBytes: number;
  usedLabel: string;
  quotaLabel: string;
  percentUsed: number;
  isPersisted: boolean;
  engineLabel: string;
}

function openDeviceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Failed to open device storage'));
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDeviceDatabase();
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDeviceDatabase();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return false;
  }
}

/**
 * Requests browser persistent storage so uploaded wardrobe images
 * are stored safely on client device disk without eviction.
 */
export async function requestPersistentDeviceStorage(): Promise<boolean> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (already) return true;
      return await navigator.storage.persist();
    }
    return false;
  } catch {
    return false;
  }
}

function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function getDeviceStorageMetrics(
  stateSnapshot?: Partial<HydratedDeviceState>
): Promise<DeviceStorageMetrics> {
  let usedBytes = 0;
  let quotaBytes = 512 * 1024 * 1024; // 512 MB fallback estimate
  let isPersisted = false;

  try {
    if (navigator.storage?.persisted) {
      isPersisted = await navigator.storage.persisted();
    }
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.usage === 'number') usedBytes = estimate.usage;
      if (typeof estimate.quota === 'number' && estimate.quota > 0) {
        quotaBytes = estimate.quota;
      }
    }
  } catch {
    // Fallback below
  }

  // Ensure accurate payload sizing even before browser usage updates
  if (stateSnapshot) {
    try {
      const serialized = JSON.stringify(stateSnapshot);
      const payloadBytes = new Blob([serialized]).size;
      if (payloadBytes > usedBytes) {
        usedBytes = payloadBytes;
      }
    } catch {
      // Ignore
    }
  }

  const percentUsed =
    quotaBytes > 0
      ? Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10)
      : 0;

  return {
    usedBytes,
    quotaBytes,
    usedLabel: formatByteSize(usedBytes),
    quotaLabel: formatByteSize(quotaBytes),
    percentUsed,
    isPersisted,
    engineLabel: 'IndexedDB Client Device Storage',
  };
}

/**
 * Loads all user state from client device IndexedDB.
 * Starts completely clean (0 fake items) on first launch.
 */
export async function hydrateFromDeviceStorage(): Promise<HydratedDeviceState> {
  await requestPersistentDeviceStorage();

  const [
    storedCategories,
    storedWardrobe,
    storedOutfits,
    storedPlanner,
    storedWishlist,
    storedOotd,
    storedPrefs,
  ] = await Promise.all([
    idbGet<CategoryDefinition[]>('categories'),
    idbGet<WardrobeItem[]>('wardrobe'),
    idbGet<SavedOutfit[]>('savedOutfits'),
    idbGet<Record<string, PlannedOutfitEntry>>('planner'),
    idbGet<WishlistItem[]>('wishlist'),
    idbGet<OotdRecord | null>('ootd'),
    idbGet<AppPreferences>('preferences'),
  ]);

  // Ensure default categories (including Complete Outfit) always exist
  let categories: CategoryDefinition[] = DEFAULT_CATEGORIES;
  if (Array.isArray(storedCategories) && storedCategories.length > 0) {
    const existingIds = new Set(storedCategories.map((c) => c.id));
    const missingDefaults = DEFAULT_CATEGORIES.filter(
      (def) => !existingIds.has(def.id)
    );
    categories = [...missingDefaults, ...storedCategories];
  } else {
    await idbSet('categories', DEFAULT_CATEGORIES);
  }

  return {
    categories,
    wardrobe: Array.isArray(storedWardrobe) ? storedWardrobe : [],
    savedOutfits: Array.isArray(storedOutfits) ? storedOutfits : [],
    planner:
      storedPlanner && typeof storedPlanner === 'object' ? storedPlanner : {},
    wishlist: Array.isArray(storedWishlist) ? storedWishlist : [],
    ootd: storedOotd || null,
    preferences: storedPrefs
      ? { ...DEFAULT_PREFERENCES, ...storedPrefs }
      : { ...DEFAULT_PREFERENCES },
  };
}

export function buildExportBackupPayload(
  state: HydratedDeviceState
): BackupPayload {
  return {
    appName: 'Wardro',
    version: 2,
    exportedAt: new Date().toISOString(),
    categories: state.categories,
    wardrobe: state.wardrobe,
    savedOutfits: state.savedOutfits,
    planner: state.planner,
    wishlist: state.wishlist,
    ootd: state.ootd,
    preferences: state.preferences,
  };
}

export function downloadBackupJsonFile(state: HydratedDeviceState): string {
  const payload = buildExportBackupPayload(state);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `wardro-backup-${dateStamp}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}

export function parseAndValidateBackupJson(rawText: string): BackupPayload {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON structure.');
  }

  const categories: CategoryDefinition[] = Array.isArray(parsed.categories)
    ? parsed.categories
    : DEFAULT_CATEGORIES;

  // Ensure default categories exist
  const catIds = new Set(categories.map((c) => c.id));
  const mergedCategories = [
    ...DEFAULT_CATEGORIES.filter((d) => !catIds.has(d.id)),
    ...categories,
  ];

  const wardrobe: WardrobeItem[] = Array.isArray(parsed.wardrobe)
    ? parsed.wardrobe.filter(
        (i: unknown): i is WardrobeItem =>
          Boolean(i) &&
          typeof i === 'object' &&
          typeof (i as WardrobeItem).id === 'string' &&
          typeof (i as WardrobeItem).title === 'string'
      )
    : [];

  const savedOutfits: SavedOutfit[] = Array.isArray(parsed.savedOutfits)
    ? parsed.savedOutfits
    : [];

  const planner: Record<string, PlannedOutfitEntry> =
    parsed.planner && typeof parsed.planner === 'object' ? parsed.planner : {};

  const wishlist: WishlistItem[] = Array.isArray(parsed.wishlist)
    ? parsed.wishlist
    : [];

  const ootd: OotdRecord | null =
    parsed.ootd && typeof parsed.ootd === 'object' ? parsed.ootd : null;

  const preferences: AppPreferences =
    parsed.preferences && typeof parsed.preferences === 'object'
      ? {
          theme: parsed.preferences.theme === 'light' ? 'light' : 'dark',
        }
      : { ...DEFAULT_PREFERENCES };

  return {
    appName: 'Wardro',
    version: 2,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    categories: mergedCategories,
    wardrobe,
    savedOutfits,
    planner,
    wishlist,
    ootd,
    preferences,
  };
}

export function getTodayDateInfo(date: Date = new Date()): {
  dateKey: string;
  formattedDate: string;
} {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return { dateKey, formattedDate };
}
