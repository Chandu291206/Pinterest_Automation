"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  isActive: boolean;
};

export function ProductRowActions({ id, isActive }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function toggleActive() {
    setErrorMessage("");
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update product.");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update product.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteProduct() {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    setErrorMessage("");
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to delete product.");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isActive ? "secondary" : "default"}
          onClick={toggleActive}
          disabled={isUpdating || isDeleting}
        >
          {isUpdating ? "Saving..." : isActive ? "Set Inactive" : "Set Active"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={deleteProduct}
          disabled={isUpdating || isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
