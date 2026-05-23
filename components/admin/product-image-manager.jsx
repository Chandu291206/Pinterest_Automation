"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function uploadSingleImage(file) {
  const data = new FormData();
  data.append("file", file);

  const response = await fetch("/api/upload-product-image", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Image upload failed.");
  }

  const payload = await response.json();
  return String(payload?.url ?? "").trim();
}

export function ProductImageManager({ productId, initialImages }) {
  const [images, setImages] = useState(initialImages || []);
  const [manualUrl, setManualUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function persist(nextImages) {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: nextImages,
        image_url: nextImages[0] || null,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Failed to save images.");
    }
  }

  async function onUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setMessage("");
    setIsSaving(true);

    try {
      const room = Math.max(0, 4 - images.length);
      const uploadList = files.slice(0, room);
      const urls = [];

      for (const file of uploadList) {
        const url = await uploadSingleImage(file);
        if (url) urls.push(url);
      }

      const next = [...images, ...urls].slice(0, 4);
      await persist(next);
      setImages(next);
      setMessage("Images updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  }

  async function onAddManual() {
    const value = manualUrl.trim();
    if (!value || images.length >= 4) return;

    setIsSaving(true);
    setMessage("");

    try {
      const next = [...images, value].slice(0, 4);
      await persist(next);
      setImages(next);
      setManualUrl("");
      setMessage("Images updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add image URL.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onRemove(url) {
    setIsSaving(true);
    setMessage("");

    try {
      const next = images.filter((item) => item !== url);
      await persist(next);
      setImages(next);
      setMessage("Image removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove image.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Input type="file" accept="image/*" multiple onChange={onUpload} disabled={isSaving || images.length >= 4} />
      </div>

      <div className="flex gap-2">
        <Input value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} placeholder="Paste Cloudinary image URL" />
        <Button type="button" variant="outline" onClick={onAddManual} disabled={isSaving || !manualUrl.trim() || images.length >= 4}>
          Add URL
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="space-y-2">
          {images.map((url, idx) => (
            <div key={url} className="flex items-center gap-2 rounded border p-2 text-xs">
              <span className="truncate">{idx + 1}. {url}</span>
              <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={() => onRemove(url)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
