"use client";

import { useEffect, useState } from "react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Check, X, ChevronLeft, ChevronRight, ExternalLink, ImageIcon } from "lucide-react";

interface VideoItem {
  id: number;
  url: string;
  statsPhoto1: string | null;
  statsPhoto2: string | null;
  status: string;
  earnings: string | null;
  createdAt: string;
  user: { id: number; firstName: string; username: string | null };
  platform: { name: string };
  reviewer: { firstName: string } | null;
}

interface ListResponse {
  items: VideoItem[];
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

export default function VideosPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("pending");
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [earnings, setEarnings] = useState("");
  const [detailVideo, setDetailVideo] = useState<VideoItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    fetcher<ListResponse>(`/api/videos?${params}`).then(setData).catch(console.error);
  };

  useEffect(() => { load(); }, [page, status]);

  const approve = async (id: number) => {
    if (!earnings || isNaN(parseFloat(earnings))) return;
    await apiPatch("/api/videos", { id, status: "approved", earnings });
    setReviewId(null);
    setEarnings("");
    load();
  };

  const reject = async (id: number) => {
    await apiPatch("/api/videos", { id, status: "rejected" });
    load();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Видео на проверке</h1>

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
        <div className="text-muted-foreground">Нет видео</div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Платформа</TableHead>
                  <TableHead>Видео</TableHead>
                  <TableHead className="text-right">Начислено</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((video) => (
                  <TableRow key={video.id} className="cursor-pointer" onClick={() => setDetailVideo(video)}>
                    <TableCell>{video.id}</TableCell>
                    <TableCell>
                      {video.user.firstName}
                      {video.user.username && (
                        <span className="ml-1 text-muted-foreground">@{video.user.username}</span>
                      )}
                    </TableCell>
                    <TableCell>{video.platform.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ссылка <ExternalLink className="size-3" />
                        </a>
                        {(video.statsPhoto1 || video.statsPhoto2) && (
                          <ImageIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {video.earnings ? `${parseFloat(video.earnings).toFixed(2)} ₽` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(video.status)}>{video.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(video.createdAt).toLocaleDateString("ru")}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      {video.status === "pending" && (
                        <div className="flex items-center justify-center gap-1">
                          {reviewId === video.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Сумма"
                                value={earnings}
                                onChange={(e) => setEarnings(e.target.value)}
                                className="h-8 w-20 text-xs"
                              />
                              <Button size="sm" variant="ghost" onClick={() => approve(video.id)}>
                                <Check className="size-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setReviewId(null)}>
                                <X className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => { setReviewId(video.id); setEarnings(""); }} title="Одобрить">
                                <Check className="size-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => reject(video.id)} title="Отклонить">
                                <X className="size-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
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
      <Dialog open={!!detailVideo} onOpenChange={(open) => { if (!open) setDetailVideo(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Видео #{detailVideo?.id} — Статистика</DialogTitle>
          </DialogHeader>
          {detailVideo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Пользователь: </span>
                  {detailVideo.user.firstName}
                  {detailVideo.user.username && ` (@${detailVideo.user.username})`}
                </div>
                <div>
                  <span className="text-muted-foreground">Платформа: </span>
                  {detailVideo.platform.name}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Ссылка: </span>
                  <a href={detailVideo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {detailVideo.url}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[detailVideo.statsPhoto1, detailVideo.statsPhoto2].map((fileId, i) => (
                  <div key={i}>
                    <p className="mb-2 text-sm font-medium">Скриншот {i + 1}</p>
                    {fileId ? (
                      <img
                        src={`/api/telegram-file?file_id=${fileId}`}
                        alt={`Статистика ${i + 1}`}
                        className="aspect-square w-full cursor-zoom-in rounded-lg border object-cover"
                        onClick={() => {
                          const slides = [detailVideo.statsPhoto1, detailVideo.statsPhoto2]
                            .filter(Boolean)
                            .map((fid) => ({ src: `/api/telegram-file?file_id=${fid}` }));
                          setLightboxSlides(slides);
                          setDetailVideo(null);
                          setLightboxIndex(i);
                        }}
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-lg border text-muted-foreground">Нет фото</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </div>
  );
}
