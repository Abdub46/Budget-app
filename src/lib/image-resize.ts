/**
 * Resizes and compresses an image file entirely in the browser (center-crop
 * to a square, downscale, re-encode as JPEG) before it's ever sent to the
 * server. No server-side image processing library is set up for this app,
 * and shipping a full-resolution photo to the database would be wasteful —
 * this keeps every avatar to a predictable, small size.
 */
export async function resizeImageToDataUrl(
  file: File,
  { maxSize = 256, quality = 0.85 }: { maxSize?: number; quality?: number } = {}
): Promise<string> {
  const bitmap = await loadImage(file);

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = maxSize;
  canvas.height = maxSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, maxSize, maxSize);

  return canvas.toDataURL('image/jpeg', quality);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    img.src = url;
  });
}