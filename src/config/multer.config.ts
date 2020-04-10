import { environment } from './environment';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';

// Multer upload options
export const multerOptions = (path) => {
  const multerConfig = {
    // Storage properties
    storage: diskStorage({
      // Destination storage path details
      destination: (req: any, file: any, cb: any) => {
        const uploadPath = `${environment.uploadsPath}/${path}`;
        // Create folder if doesn't exist
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      // File modification details
      filename: (req: any, file: any, cb: any) => {
        // Calling the callback passing the random name generated with the original extension name
        cb(null, `${uuid()}${extname(file.originalname)}`);
      }
    })
  };
  return multerConfig;
};
