"use client";

import { useEffect, useState, useCallback } from "react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ADMIN_ROLES,
  type UserRole,
} from "@trafferbot/shared/constants";

const ROLE_LABELS: Record<string, string> = {
  moderator: "Модератор",
  financier: "Финансист",
  owner: "Владелец",
};

// Only editable roles (owner permissions are always full)
const EDITABLE_ROLES = ADMIN_ROLES.filter((r) => r !== "owner");

type Permissions = Record<string, string[]>;

export default function PermissionsPage() {
  const [perms, setPerms] = useState<Permissions>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetcher<Permissions>("/api/permissions")
      .then((data) => {
        setPerms(data);
        setLoaded(true);
      })
      .catch(console.error);
  }, []);

  const toggle = useCallback((role: string, permission: string) => {
    setPerms((prev) => {
      const current = prev[role] ?? [];
      const has = current.includes(permission);
      return {
        ...prev,
        [role]: has
          ? current.filter((p) => p !== permission)
          : [...current, permission],
      };
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiPatch("/api/permissions", perms);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (!loaded) return <div className="px-4 lg:px-6">Загрузка...</div>;

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Права ролей</h1>
        <Button onClick={save} disabled={saving}>
          <Save className="mr-1 size-4" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="grid gap-4">
        {EDITABLE_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{ROLE_LABELS[role] ?? role}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_PERMISSIONS.map((perm) => {
                  const checked = perms[role]?.includes(perm) ?? false;
                  return (
                    <label
                      key={perm}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(role, perm)}
                      />
                      <span className="text-sm">
                        {PERMISSION_LABELS[perm] ?? perm}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
