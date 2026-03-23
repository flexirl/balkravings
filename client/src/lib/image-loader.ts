// Custom image loader using wsrv.nl (images.weserv.nl)
// Free, unlimited image CDN proxy with WebP conversion, resizing, and global caching
// Docs: https://images.weserv.nl/docs/

interface ImageLoaderParams {
  src: string
  width: number
  quality?: number
}

export default function imageLoader({ src, width, quality }: ImageLoaderParams): string {
  // If already a data URL or relative path, return as-is
  if (src.startsWith('data:') || src.startsWith('blob:')) return src

  // For relative paths, return as-is (local assets)
  if (src.startsWith('/')) return src

  // Route through wsrv.nl for remote images
  // &w= resize width, &q= quality, &output=webp for modern format
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
    output: 'webp',
    fit: 'cover',
  })

  return `https://images.weserv.nl/?${params.toString()}`
}
