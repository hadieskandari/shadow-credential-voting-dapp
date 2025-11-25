const DEFAULT_BLOB_BANNER =
  "https://a1w0yyqwfjrlo4bb.public.blob.vercel-storage.com/shadow-banner.jpg";

export const SHARE_BANNER_IMAGE =
  process.env.NEXT_PUBLIC_SHARE_BANNER_IMAGE ?? DEFAULT_BLOB_BANNER;

export const SHARE_BANNER_SHORT =
  process.env.NEXT_PUBLIC_SHARE_BANNER_SHORT ?? DEFAULT_BLOB_BANNER;
