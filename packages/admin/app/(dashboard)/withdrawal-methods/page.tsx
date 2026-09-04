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

interface Method {
  id: number;
  name: string;
  minAmount: string;
  isActive: boolean;
}

export default function WithdrawalMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [newName, setNewName] = useState("");
  const [newMin, setNewMin] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMin, setEditMin] = useState("");

  const load = () => {
    fetcher<Method[]>("/api/withdrawal-methods").then(setMethods).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim() || !newMin) return;
    await apiPost("/api/withdrawal-methods", { name: newName, minAmount: newMin });
    setNewName("");
    setNewMin("");
    load();
  };

  const update = async (id: number) => {
    await apiPatch("/api/withdrawal-methods", { id, name: editName, minAmount: editMin });
    setEditId(null);
    load();
  };

  const toggleActive = async (m: Method) => {
    await apiPatch("/api/withdrawal-methods", { id: m.id, isActive: !m.isActive });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить способ вывода?")) return;
    await apiDelete("/api/withdrawal-methods", { id });
    load();
  };

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Способы вывода</h1>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Название (напр. USDT TRC-20)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Мин. сумма"
          value={newMin}
          onChange={(e) => setNewMin(e.target.value)}
          className="w-32"
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
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Мин. сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.id}</TableCell>
                <TableCell>
                  {editId === m.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 w-48 text-xs"
                    />
                  ) : (
                    m.name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editId === m.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editMin}
                      onChange={(e) => setEditMin(e.target.value)}
                      className="ml-auto h-8 w-24 text-xs"
                    />
                  ) : (
                    `${parseFloat(m.minAmount).toFixed(2)} ₽`
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={m.isActive ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(m)}
                  >
                    {m.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {editId === m.id ? (
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => update(m.id)}>
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
                        onClick={() => { setEditId(m.id); setEditName(m.name); setEditMin(m.minAmount); }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
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
