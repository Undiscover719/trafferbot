"use client";

import { useEffect, useState } from "react";
import { fetcher } from "@/lib/fetcher";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: { firstName: string; username: string | null };
}

interface ListResponse {
  items: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export default function LogsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    fetcher<ListResponse>(`/api/logs?${params}`).then(setData).catch(console.error);
  };

  useEffect(() => { load(); }, [page]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Логи администраторов</h1>

      {!data ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : data.items.length === 0 ? (
        <div className="text-muted-foreground">Нет записей</div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Администратор</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Цель</TableHead>
                  <TableHead>Детали</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>
                      {log.admin.firstName}
                      {log.admin.username && (
                        <span className="ml-1 text-muted-foreground">@{log.admin.username}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.targetType ? `${log.targetType} #${log.targetId}` : "—"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("ru")}
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
