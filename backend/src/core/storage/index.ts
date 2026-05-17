import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { config } from '../../config';
import { logger } from '../logger';
import fs from 'fs';

export const ensureUploadDirs = (): void => {
  const dirs = ['uploads/images', 'uploads/documents', 'uploads/voices', 'uploads/avatars'];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

const storage = multer.memoryStorage();

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPEG, PNG, WebP'));
  }
};

const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم'));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: imageFilter,
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFilter,
});

export const processAndSaveImage = async (
  buffer: Buffer,
  subfolder: string = 'images',
  width: number = 800
): Promise<string> => {
  const filename = `${uuidv4()}.webp`;
  const outputPath = path.join('uploads', subfolder, filename);

  await sharp(buffer)
    .resize(width, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(outputPath);

  logger.debug(`Image saved: ${outputPath}`);
  return `/${outputPath}`;
};

export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
