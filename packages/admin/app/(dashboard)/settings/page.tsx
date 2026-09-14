"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const { data, isLoading } = useSWR<{ items: Setting[] }>(
    "/api/settings",
    fetcher
  );

  const [local, setLocal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.items) {
      const map: Record<string, string> = {};
      for (const s of data.items) {
        map[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      }
      setLocal(map);
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(local).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: entries }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
      mutate("/api/settings");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-4 max-w-lg">
        {Object.entries(local).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key}>{key.replace(/_/g, " ")}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) =>
                setLocal((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          </div>
        ))}
        {Object.keys(local).length === 0 && (
          <p className="text-sm text-muted-foreground">No settings found.</p>
        )}
      </div>
    </div>
  );
}
