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

  async function toggleActive() {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteProduct() {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={toggleActive} disabled={isUpdating}>
        {isUpdating ? "Saving..." : isActive ? "Set Inactive" : "Set Active"}
      </Button>
      <Button size="sm" variant="destructive" onClick={deleteProduct} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
