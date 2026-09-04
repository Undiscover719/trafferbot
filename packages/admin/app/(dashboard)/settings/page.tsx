"use client";

import { useEffect, useState } from "react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

interface Setting {
  id: number;
  key: string;
  value: unknown;
}

const SETTING_LABELS: Record<string, string> = {
  referral_percent: "Реферальный процент (%)",
  welcome_text: "Приветственное сообщение",
  rules_text: "Правила",
  project_links: "Ссылки проекта (JSON)",
  notify_group_id: "ID группы для уведомлений",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetcher<Setting[]>("/api/settings").then((data) => {
      setSettings(data);
      const vals: Record<string, string> = {};
      data.forEach((s) => {
        vals[s.key] =
          typeof s.value === "string" ? s.value : JSON.stringify(s.value, null, 2);
      });
      setValues(vals);
    }).catch(console.error);
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    let value: unknown = values[key];

    // Try to parse as JSON for structured values
    if (key === "project_links" || key === "referral_percent" || key === "notify_group_id") {
      try {
        value = JSON.parse(values[key]);
      } catch {
        // Keep as string
      }
    }

    await apiPatch("/api/settings", { key, value });
    setSaving(null);
  };

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Настройки</h1>

      <div className="grid gap-4">
        {settings.map((s) => (
          <Card key={s.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {SETTING_LABELS[s.key] ?? s.key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {s.key === "referral_percent" || s.key === "notify_group_id" ? (
                  <Input
                    type={s.key === "referral_percent" ? "number" : "text"}
                    step={s.key === "referral_percent" ? "0.1" : undefined}
                    min={s.key === "referral_percent" ? "0" : undefined}
                    max={s.key === "referral_percent" ? "100" : undefined}
                    placeholder={s.key === "notify_group_id" ? "-100123456789" : undefined}
                    value={values[s.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                    }
                    className="max-w-xs"
                  />
                ) : (
                  <textarea
                    value={values[s.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                    }
                    rows={s.key === "project_links" ? 6 : 3}
                    className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <Button
                  onClick={() => save(s.key)}
                  disabled={saving === s.key}
                  variant="outline"
                  className="shrink-0"
                >
                  <Save className="mr-1 size-4" />
                  {saving === s.key ? "..." : "Сохранить"}
                </Button>
              </div>
              {s.key === "project_links" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Формат: {`[{"name": "Telegram", "url": "https://t.me/..."}]`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
