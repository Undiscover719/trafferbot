"use client";

import { useEffect, useState } from "react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, ChevronLeft, ChevronRight, CheckCheck } from "lucide-react";

interface Withdrawal {
  id: number;
  amount: string;
  requisites: string;
  status: string;
  processNote: string | null;
  createdAt: string;
  user: { id: number; firstName: string; username: string | null };
  method: { name: string };
  processor: { firstName: string } | null;
}

interface ListResponse {
  items: Withdrawal[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "completed"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "Все",
  pending: "Ожидание",
  approved: "Одобрены",
  rejected: "Отклонены",
  completed: "Выполнены",
};

function statusVariant(status: string) {
  if (status === "completed") return "default" as const;
  if (status === "approved") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
}

export default function WithdrawalsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("pending");

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    fetcher<ListResponse>(`/api/withdrawals?${params}`).then(setData).catch(console.error);
  };

  useEffect(() => { load(); }, [page, status]);

  const process = async (id: number, result: "approved" | "rejected" | "completed") => {
    await apiPatch("/api/withdrawals", { id, status: result });
    load();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Заявки на вывод</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {!data ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : data.items.length === 0 ? (
        <div className="text-muted-foreground">Нет заявок</div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Реквизиты</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.id}</TableCell>
                    <TableCell>
                      {w.user.firstName}
                      {w.user.username && (
                        <span className="ml-1 text-muted-foreground">@{w.user.username}</span>
                      )}
                    </TableCell>
                    <TableCell>{w.method.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {parseFloat(w.amount).toFixed(2)} ₽
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground" title={w.requisites}>
                      {w.requisites}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(w.status)}>{w.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString("ru")}
                    </TableCell>
                    <TableCell className="text-center">
                      {w.status === "pending" && (
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => process(w.id, "approved")} title="Одобрить">
                            <Check className="size-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => process(w.id, "rejected")} title="Отклонить">
                            <X className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {w.status === "approved" && (
                        <Button variant="ghost" size="sm" onClick={() => process(w.id, "completed")} title="Выполнено">
                          <CheckCheck className="size-4 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
