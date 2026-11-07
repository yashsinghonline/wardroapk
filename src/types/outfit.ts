export type WireframeShape =
  | 'complete_outfit'
  | 'top'
  | 'bottom'
  | 'footwear'
  | 'accessories'
  | 'outerwear'
  | 'custom';

export interface CategoryDefinition {
  id: string;
  label: string;
  shape: WireframeShape;
  isDefault: boolean;
  isCompleteOutfit?: boolean;
}

export interface WardrobeItem {
  id: string;
  title: string;
  categoryId: string;
  imageUrl: string;
  notes?: string;
  tags: string[];
  createdAt: string;
}

export interface SavedOutfit {
  id: string;
  title: string;
  occasion: string;
  items: WardrobeItem[];
  createdAt: string;
}

export interface PlannedOutfitEntry {
  dateKey: string; // "YYYY-MM-DD"
  outfitId?: string;
  outfitTitle: string;
  occasion: string;
  notes?: string;
  items: WardrobeItem[];
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  platform: string;
  categoryId: string;
  notes?: string;
  createdAt: string;
}

export interface OotdRecord {
  dateKey: string; // "YYYY-MM-DD"
  formattedDate: string;
  title: string;
  occasion: string;
  items: WardrobeItem[];
  isUserCreated: boolean;
  updatedAt: string;
}

export interface AppPreferences {
  theme: 'dark' | 'light';
}

export interface BackupPayload {
  appName: 'Wardro' | 'OutfitCraft';
  version: number;
  exportedAt: string;
  categories: CategoryDefinition[];
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  planner: Record<string, PlannedOutfitEntry>;
  wishlist: WishlistItem[];
  ootd: OotdRecord | null;
  preferences: AppPreferences;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface LinkPreviewMetadata {
  url: string;
  title: string;
  imageUrl: string;
  platform: string;
  suggestedCategoryId: string;
  extractionSucceeded: boolean;
  fallbackReason?: string;
}
