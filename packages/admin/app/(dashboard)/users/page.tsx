"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: string;
  balance: number;
  createdAt: string;
}

const ROLES = ["owner", "financier", "moderator", "traffer", "shnyr"];

export default function UsersPage() {
  const { data, isLoading } = useSWR<{ items: User[]; total: number }>(
    "/api/users",
    fetcher
  );

  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState({ role: "", balance: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (user: User) => {
    setSelected(user);
    setForm({ role: user.role, balance: String(user.balance) });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.role,
          balance: Number(form.balance),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success("User updated");
      setSelected(null);
      mutate("/api/users");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    { accessorKey: "id", header: "ID" },
    {
      header: "Username",
      cell: ({ row }) =>
        row.original.username
          ? `@${row.original.username}`
          : (row.original.firstName ?? "—"),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => `$${row.original.balance.toFixed(2)}`,
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openEdit(row.original)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Editing{" "}
              {selected?.username
                ? `@${selected.username}`
                : (selected?.firstName ?? `User ${selected?.id}`)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="balance">Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
