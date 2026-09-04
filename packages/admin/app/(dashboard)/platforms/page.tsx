"use client";

import { useEffect, useState } from "react";
import { fetcher, apiPost, apiPatch, apiDelete } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

interface Platform {
  id: number;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const load = () => {
    fetcher<Platform[]>("/api/platforms")
      .then((data) => setPlatforms(data.sort((a, b) => a.id - b.id)))
      .catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    await apiPost("/api/platforms", { name: newName, icon: newIcon || undefined });
    setNewName("");
    setNewIcon("");
    load();
  };

  const update = async (id: number) => {
    await apiPatch("/api/platforms", { id, name: editName, icon: editIcon || null });
    setEditId(null);
    load();
  };

  const toggleActive = async (p: Platform) => {
    await apiPatch("/api/platforms", { id: p.id, isActive: !p.isActive });
    setPlatforms((prev) =>
      prev.map((item) => item.id === p.id ? { ...item, isActive: !item.isActive } : item)
    );
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить платформу?")) return;
    await apiDelete("/api/platforms", { id });
    load();
  };

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Платформы</h1>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Название"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Иконка (эмодзи)"
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          className="w-28"
        />
        <Button onClick={create}>
          <Plus className="mr-1 size-4" /> Добавить
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Иконка</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platforms.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <Input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="h-8 w-16 text-xs"
                    />
                  ) : (
                    p.icon ?? "—"
                  )}
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 w-40 text-xs"
                    />
                  ) : (
                    p.name
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={p.isActive ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(p)}
                  >
                    {p.isActive ? "Активна" : "Неактивна"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {editId === p.id ? (
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => update(p.id)}>
                        <Save className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditId(p.id); setEditName(p.name); setEditIcon(p.icon ?? ""); }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
