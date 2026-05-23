"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function DraftCard({ pin }) {
  const router = useRouter();
  const [title, setTitle] = useState(pin.title || "");
  const [description, setDescription] = useState(pin.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function approve() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/pins/${pin.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, hashtags: pin.hashtags || [] }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to approve pin.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to approve pin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function reject() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/pins/${pin.id}/reject`, { method: "PATCH" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to reject pin.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reject pin.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{pin.product_name || "Draft pin"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pin.image_url ? <img src={pin.image_url} alt={title} className="w-full rounded-md border" /> : null}

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Title</p>
          <Textarea rows={2} value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Description</p>
          <Textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <div className="text-xs text-muted-foreground">{(pin.hashtags || []).join(" ")}</div>

        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}

        <div className="flex gap-2">
          <Button onClick={approve} disabled={isSaving}>{isSaving ? "Saving..." : "Approve"}</Button>
          <Button variant="secondary" onClick={reject} disabled={isSaving}>Reject</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewClientPage({ drafts }) {
  if (!drafts.length) {
    return <p className="text-sm text-muted-foreground">No draft pins waiting for review.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {drafts.map((pin) => (
        <DraftCard key={pin.id} pin={pin} />
      ))}
    </div>
  );
}
