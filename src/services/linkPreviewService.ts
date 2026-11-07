import { LinkPreviewMetadata } from '../types/outfit';

export function detectStorePlatform(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('amazon.') || host.includes('amzn.')) return 'Amazon';
    if (host.includes('flipkart.')) return 'Flipkart';
    if (host.includes('myntra.')) return 'Myntra';
    if (host.includes('ajio.')) return 'Ajio';
    if (host.includes('zara.')) return 'Zara';
    if (host.includes('hm.com') || host.includes('www2.hm.')) return 'H&M';
    if (host.includes('meesho.')) return 'Meesho';
    if (host.includes('nykaa')) return 'Nykaa Fashion';
    if (host.includes('uniqlo.')) return 'Uniqlo';
    if (host.includes('nike.')) return 'Nike';
    if (host.includes('adidas.')) return 'Adidas';
    if (host.includes('urbanic.')) return 'Urbanic';
    if (host.includes('westside.')) return 'Westside';
    if (host.includes('snitch.')) return 'Snitch';

    const cleanHost = host.replace(/^www\./, '').split('.')[0];
    return cleanHost
      ? cleanHost.charAt(0).toUpperCase() + cleanHost.slice(1)
      : 'Store';
  } catch {
    return 'Store';
  }
}

export function inferCategoryIdFromText(text: string): string {
  const lower = text.toLowerCase();

  if (
    /\b(co-ord|coord|suit|dress|gown|jumpsuit|romper|set|combo|complete outfit|saree|lehenga|kurta set)\b/.test(
      lower
    )
  ) {
    return 'complete_outfit';
  }

  if (
    /\b(shoe|shoes|sneaker|sneakers|boot|boots|loafer|loafers|sandal|sandals|slipper|slides|heels|trainer|runners|footwear|brogue|flat|flats)\b/.test(
      lower
    )
  ) {
    return 'footwear';
  }

  if (
    /\b(pant|pants|trouser|trousers|jean|jeans|denim|cargo|cargos|chino|chinos|short|shorts|skirt|legging|jogger|joggers|trackpant|bottom)\b/.test(
      lower
    )
  ) {
    return 'bottom';
  }

  if (
    /\b(watch|watches|sunglass|sunglasses|eyewear|bag|backpack|sling|wallet|belt|cap|hat|beanie|ring|necklace|bracelet|chain|jewel|jewelry|jewellery|scarf|tie|handbag|tote)\b/.test(
      lower
    )
  ) {
    return 'accessories';
  }

  return 'top';
}

export function extractTitleFromUrlSlug(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const segments = parsed.pathname
      .split('/')
      .map((s) => decodeURIComponent(s).trim())
      .filter(
        (s) =>
          s.length > 3 &&
          !/^(dp|gp|product|products|p|itm|item|s|search|buy|ref=.*)$/i.test(s) &&
          !/^[A-Z0-9]{8,14}$/.test(s)
      );

    if (segments.length === 0) return '';

    const best = segments.sort((a, b) => b.length - a.length)[0];
    const cleaned = best
      .replace(/[-_+]+/g, ' ')
      .replace(/\b(buy|online|india|for men|for women|shop)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length < 3) return '';
    return cleaned
      .split(' ')
      .slice(0, 9)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}

/**
 * Extracts OpenGraph product preview (image & title) for Wishlist items.
 * Never extracts or stores pricing.
 */
export async function extractWishlistLinkPreview(
  inputUrl: string
): Promise<LinkPreviewMetadata> {
  const normalizedUrl = /^https?:\/\//i.test(inputUrl.trim())
    ? inputUrl.trim()
    : `https://${inputUrl.trim()}`;

  const platform = detectStorePlatform(normalizedUrl);
  const slugTitle = extractTitleFromUrlSlug(normalizedUrl);
  const suggestedCategoryId = inferCategoryIdFromText(
    `${slugTitle} ${normalizedUrl}`
  );

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);

  try {
    const proxyEndpoint = `https://api.microlink.io?url=${encodeURIComponent(
      normalizedUrl
    )}`;
    const response = await fetch(proxyEndpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url: normalizedUrl,
        title: slugTitle || `${platform} Wishlist Item`,
        imageUrl: '',
        platform,
        suggestedCategoryId,
        extractionSucceeded: false,
        fallbackReason: `Could not auto-fetch preview image from ${platform}. You can paste an image URL or upload a screenshot below.`,
      };
    }

    const payload = await response.json();
    const data = payload?.data || {};

    const rawTitle: string = (data.title || '').trim();
    const cleanedTitle = rawTitle
      .replace(
        /\s*[-|:]\s*(Amazon\.in|Amazon\.com|Flipkart\.com|Myntra|Buy Online|Shop Online).*$/i,
        ''
      )
      .trim();

    const imageUrl: string = data.image?.url || data.logo?.url || '';
    const finalTitle = cleanedTitle || slugTitle || `${platform} Item`;
    const isBlockedPage =
      /robot|captcha|access denied|attention required|503|page not found/i.test(
        finalTitle
      ) || !imageUrl;

    if (isBlockedPage) {
      return {
        url: normalizedUrl,
        title: slugTitle || `${platform} Item`,
        imageUrl: '',
        platform,
        suggestedCategoryId: inferCategoryIdFromText(
          `${slugTitle} ${normalizedUrl}`
        ),
        extractionSucceeded: false,
        fallbackReason: `${platform} blocked automated preview scraping. Add a preview image URL or screenshot below if desired.`,
      };
    }

    return {
      url: normalizedUrl,
      title: finalTitle,
      imageUrl,
      platform,
      suggestedCategoryId: inferCategoryIdFromText(
        `${finalTitle} ${normalizedUrl}`
      ),
      extractionSucceeded: true,
    };
  } catch {
    window.clearTimeout(timeoutId);
    return {
      url: normalizedUrl,
      title: slugTitle || `${platform} Item`,
      imageUrl: '',
      platform,
      suggestedCategoryId,
      extractionSucceeded: false,
      fallbackReason:
        'Preview fetch timed out or offline. Confirm title and optional image below.',
    };
  }
}

/**
 * Processes an uploaded device image into a sharp, portable Data URL
 * suitable for high-capacity IndexedDB client storage & JSON backups.
 */
export function processUploadedImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 960;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Could not decode image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
