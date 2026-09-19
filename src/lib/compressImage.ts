interface CompressOptions {
  maxDimension: number;
  quality: number;
}

export const PLAN_IMAGE_OPTIONS: CompressOptions = { maxDimension: 1600, quality: 0.82 };
export const FURNITURE_IMAGE_OPTIONS: CompressOptions = { maxDimension: 1600, quality: 0.82 };
export const ITEM_IMAGE_OPTIONS: CompressOptions = { maxDimension: 900, quality: 0.82 };

/**
 * 이미지 파일을 캔버스로 줄여 JPEG data URL로 만든다.
 * createImageBitmap의 imageOrientation: 'from-image' 옵션으로 휴대폰 사진의 EXIF 회전을 바로잡는다.
 */
export async function compressImage(file: File, options: CompressOptions): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, options.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지를 처리할 수 없습니다.');
    ctx.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', options.quality);
  } finally {
    bitmap.close();
  }
}
