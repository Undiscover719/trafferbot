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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, ChevronLeft, ChevronRight, ExternalLink, Eye } from "lucide-react";

interface Application {
  id: number;
  status: string;
  channelUrl: string;
  comment: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; firstName: string; lastName: string | null; username: string | null; telegramId: string };
  platform: { name: string; icon: string | null };
  reviewer: { firstName: string } | null;
}

interface ListResponse {
  items: Application[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "Все",
  pending: "Ожидание",
  approved: "Одобрены",
  rejected: "Отклонены",
};

function statusVariant(status: string) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

const STATUS_RU: Record<string, string> = {
  pending: "Ожидание",
  approved: "Одобрена",
  rejected: "Отклонена",
};

export default function ApplicationsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("pending");
  const [selected, setSelected] = useState<Application | null>(null);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    fetcher<ListResponse>(`/api/applications?${params}`).then(setData).catch(console.error);
  };

  useEffect(() => { load(); }, [page, status]);

  const review = async (id: number, result: "approved" | "rejected") => {
    await apiPatch("/api/applications", { id, status: result });
    setSelected(null);
    load();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Заявки на вступление</h1>

      <div className="mb-4 flex gap-2">
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
                  <TableHead>Платформа</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer" onClick={() => setSelected(app)}>
                    <TableCell>{app.id}</TableCell>
                    <TableCell>
                      {app.user.firstName}
                      {app.user.username && (
                        <span className="ml-1 text-muted-foreground">@{app.user.username}</span>
                      )}
                    </TableCell>
                    <TableCell>{app.platform.icon ?? ""} {app.platform.name}</TableCell>
                    <TableCell>
                      <a
                        href={app.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ссылка <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(app.status)}>{STATUS_RU[app.status] ?? app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString("ru")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(app); }} title="Просмотреть">
                          <Eye className="size-4" />
                        </Button>
                        {app.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); review(app.id, "approved"); }} title="Одобрить">
                              <Check className="size-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); review(app.id, "rejected"); }} title="Отклонить">
                              <X className="size-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Заявка #{selected.id}</DialogTitle>
                <DialogDescription>
                  Подана {new Date(selected.createdAt).toLocaleString("ru")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Пользователь</span>
                    <p className="font-medium">
                      {selected.user.firstName} {selected.user.lastName ?? ""}
                    </p>
                    {selected.user.username && (
                      <p className="text-muted-foreground">@{selected.user.username}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telegram ID</span>
                    <p className="font-medium">{selected.user.telegramId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Платформа</span>
                    <p className="font-medium">{selected.platform.icon ?? ""} {selected.platform.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Статус</span>
                    <p>
                      <Badge variant={statusVariant(selected.status)}>
                        {STATUS_RU[selected.status] ?? selected.status}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Ссылка на канал</span>
                  <p>
                    <a
                      href={selected.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                    >
                      {selected.channelUrl} <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </p>
                </div>

                {selected.comment && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Комментарий</span>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3">{selected.comment}</p>
                  </div>
                )}

                {selected.reviewer && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Рассмотрел</span>
                    <p className="font-medium">{selected.reviewer.firstName}</p>
                  </div>
                )}

                {selected.reviewNote && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Примечание модератора</span>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3">{selected.reviewNote}</p>
                  </div>
                )}
              </div>

              {selected.status === "pending" ? (
                <DialogFooter>
                  <Button variant="outline" onClick={() => review(selected.id, "rejected")}>
                    <X className="mr-1 size-4" /> Отклонить
                  </Button>
                  <Button onClick={() => review(selected.id, "approved")}>
                    <Check className="mr-1 size-4" /> Одобрить
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelected(null)}>Закрыть</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
