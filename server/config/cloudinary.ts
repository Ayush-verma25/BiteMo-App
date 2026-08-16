import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Make sure env vars are loaded BEFORE cloudinary.config() runs.
// If your app already calls dotenv.config() in a top-level entry file
// (e.g. index.ts/server.ts) that runs before this module is imported,
// this call is harmless (dotenv won't override already-set vars).
dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

// Fail fast and loudly in dev/staging instead of getting a mystery 403
// deep inside an upload request.
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    "Cloudinary is misconfigured: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
      "and CLOUDINARY_API_SECRET must all be set in your environment. " +
      "Check your .env file and your hosting provider's env var settings.",
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
