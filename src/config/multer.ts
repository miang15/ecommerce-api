import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

export default upload;
