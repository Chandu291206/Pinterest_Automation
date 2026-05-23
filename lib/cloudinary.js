import "server-only";

import crypto from "node:crypto";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials.");
  }

  return { cloudName, apiKey, apiSecret };
}

function buildSignature(params, apiSecret) {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((key) => `${key}=${params[key]}`).join("&");
  return crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export async function uploadImageToCloudinary({ fileBuffer, filename, folder = "products" }) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    timestamp,
    use_filename: "true",
    unique_filename: "true",
  };

  const signature = buildSignature(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), filename || `upload-${Date.now()}.jpg`);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("use_filename", "true");
  formData.append("unique_filename", "true");
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const secureUrl = String(payload?.secure_url ?? "").trim();

  if (!secureUrl) {
    throw new Error("Cloudinary response did not include secure_url.");
  }

  return secureUrl;
}
