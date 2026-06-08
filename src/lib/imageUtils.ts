/**
 * Merge legacy single image_url with new image_urls array.
 * Returns a deduplicated array of URLs.
 */
export function mergeImageUrls(
  legacySingle: string | null | undefined,
  multiArray: string[] | null | undefined
): string[] {
  const urls: string[] = [];
  
  // Add legacy single image first
  if (legacySingle) {
    urls.push(legacySingle);
  }
  
  // Add multi-image array
  if (Array.isArray(multiArray)) {
    for (const url of multiArray) {
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    }
  }
  
  return urls;
}
