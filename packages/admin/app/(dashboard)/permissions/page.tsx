"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ROLES = ["owner", "financier", "moderator"] as const;
const ALL_PERMISSIONS = [
  "view_users",
  "edit_users",
  "view_applications",
  "edit_applications",
  "view_videos",
  "edit_videos",
  "view_withdrawals",
  "edit_withdrawals",
  "view_logs",
  "view_stats",
  "manage_platforms",
  "manage_settings",
  "manage_permissions",
] as const;

type Role = (typeof ROLES)[number];
type Permission = (typeof ALL_PERMISSIONS)[number];
type PermissionsMap = Record<Role, Permission[]>;

export default function PermissionsPage() {
  const { data, isLoading } = useSWR<{ permissions: PermissionsMap }>(
    "/api/permissions",
    fetcher
  );

  const [local, setLocal] = useState<PermissionsMap | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.permissions) {
      setLocal(data.permissions as PermissionsMap);
    }
  }, [data]);

  const toggle = (role: Role, perm: Permission) => {
    if (!local) return;
    const current = local[role] ?? [];
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    setLocal({ ...local, [role]: updated });
  };

  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: local }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Permissions saved");
      mutate("/api/permissions");
    } catch {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !local) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading permissions…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Role Permissions</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">
                Permission
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center py-2 px-4 font-medium capitalize"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-t">
                <td className="py-2 pr-6">
                  <Label className="font-normal">{perm.replace(/_/g, " ")}</Label>
                </td>
                {ROLES.map((role) => (
                  <td key={role} className="text-center py-2 px-4">
                    <Checkbox
                      checked={(local[role] ?? []).includes(perm)}
                      onCheckedChange={() => toggle(role, perm)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
