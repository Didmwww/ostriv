import { PHOTO_JPEG_QUALITY, PHOTO_MAX_SIDE } from '../config';

/** Загружает файл как картинку в обход createImageBitmap (запасной путь для старых браузеров) */
function loadViaImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось открыть это фото'));
    };
    img.src = url;
  });
}

/**
 * Уменьшает фото до PHOTO_MAX_SIDE по длинной стороне и перекодирует в JPEG.
 * Учитывает поворот из EXIF (фото с телефона не окажется "лёжа") и
 * превращает HEIC/PNG в обычный JPEG, поэтому в хранилище попадает ~150–300 КБ вместо 5–10 МБ.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Выбери картинку');
  }

  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    source = await loadViaImage(file);
  }

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(width, height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof source.close === 'function') source.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY));
  if (!blob) throw new Error('Не удалось обработать фото');
  return blob;
}
