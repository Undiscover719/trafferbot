"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Search, ChevronLeft, ChevronRight, Pencil, ExternalLink } from "lucide-react";

interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  role: string;
  balance: string;
  totalEarned: string;
  isBanned: boolean;
  referralCode: string;
  createdAt: string;
}

interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

interface HistoryVideo {
  id: number;
  url: string;
  status: string;
  earnings: string | null;
  createdAt: string;
  platform: { name: string };
}

interface HistoryWithdrawal {
  id: number;
  amount: string;
  status: string;
  requisites: string;
  createdAt: string;
  method: { name: string };
}

interface HistoryApplication {
  id: number;
  status: string;
  channelUrl: string;
  createdAt: string;
  platform: { name: string };
}

interface UserHistory {
  videos: HistoryVideo[];
  withdrawals: HistoryWithdrawal[];
  applications: HistoryApplication[];
}

const ROLES = ["shnyr", "traffer", "moderator", "financier", "owner"] as const;
const ROLE_RANK: Record<string, number> = {
  shnyr: 0,
  traffer: 1,
  moderator: 2,
  financier: 2,
  owner: 3,
};
const ROLE_LABELS: Record<string, string> = {
  shnyr: "Шнырь",
  traffer: "Траффер",
  moderator: "Модератор",
  financier: "Финансист",
  owner: "Владелец",
};
// Roles that can change other users' roles
const CAN_CHANGE_ROLES = new Set(["moderator", "owner"]);

const STATUS_RU: Record<string, string> = {
  pending: "Ожидание",
  approved: "Одобрено",
  rejected: "Отклонено",
  completed: "Выполнено",
};

function statusVariant(status: string) {
  if (status === "approved" || status === "completed") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const myRole = (session?.user as { role?: string } | undefined)?.role ?? "moderator";
  const myRank = ROLE_RANK[myRole] ?? 0;
  const allowedRoles = useMemo(
    () => ROLES.filter((r) => ROLE_RANK[r] <= myRank),
    [myRank]
  );

  const [data, setData] = useState<UsersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editBanned, setEditBanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<UserHistory | null>(null);

  const load = (p: number, s: string) => {
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (s) params.set("search", s);
    fetcher<UsersResponse>(`/api/users?${params}`).then(setData).catch(console.error);
  };

  useEffect(() => { load(page, search); }, [page]);

  const handleSearch = () => { setPage(1); load(1, search); };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditBanned(user.isBanned);
    setHistory(null);
    fetcher<UserHistory>(`/api/users/${user.id}/history`)
      .then(setHistory)
      .catch(console.error);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    await apiPatch(`/api/users/${editUser.id}`, {
      role: editRole,
      isBanned: editBanned,
    });
    setSaving(false);
    setEditUser(null);
    load(page, search);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="px-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">Пользователи</h1>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Поиск по имени или username..."
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">Найти</Button>
      </div>

      {!data ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead className="text-right">Баланс</TableHead>
                  <TableHead className="text-right">Заработано</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => openEdit(user)}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName ?? ""}
                      {user.isBanned && (
                        <Badge variant="destructive" className="ml-2">бан</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.username ? `@${user.username}` : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{parseFloat(user.balance).toFixed(2)} &#8381;</TableCell>
                    <TableCell className="text-right">{parseFloat(user.totalEarned).toFixed(2)} &#8381;</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                        title="Редактировать"
                      >
                        <Pencil className="size-4" />
                      </Button>
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

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {editUser && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editUser.firstName} {editUser.lastName ?? ""}
                </DialogTitle>
                <DialogDescription>
                  {editUser.username ? `@${editUser.username}` : `ID: ${editUser.telegramId}`}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Профиль</TabsTrigger>
                  <TabsTrigger value="videos" className="flex-1">
                    Видео {history ? `(${history.videos.length})` : ""}
                  </TabsTrigger>
                  <TabsTrigger value="withdrawals" className="flex-1">
                    Выводы {history ? `(${history.withdrawals.length})` : ""}
                  </TabsTrigger>
                  <TabsTrigger value="applications" className="flex-1">
                    Заявки {history ? `(${history.applications.length})` : ""}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Telegram ID</span>
                      <p className="font-medium">{editUser.telegramId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Реферальный код</span>
                      <p className="font-medium">{editUser.referralCode ?? "\u2014"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Баланс</span>
                      <p className="font-medium">{parseFloat(editUser.balance).toFixed(2)} &#8381;</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Всего заработано</span>
                      <p className="font-medium">{parseFloat(editUser.totalEarned).toFixed(2)} &#8381;</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Регистрация</span>
                      <p className="font-medium">{new Date(editUser.createdAt).toLocaleDateString("ru")}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Роль</Label>
                    <Select value={editRole} onValueChange={setEditRole} disabled={!CAN_CHANGE_ROLES.has(myRole) || myRank <= (ROLE_RANK[editUser.role] ?? 0)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label>Статус</Label>
                    <Button
                      variant={editBanned ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setEditBanned(!editBanned)}
                      disabled={myRank <= (ROLE_RANK[editUser.role] ?? 0)}
                    >
                      {editBanned ? "Заблокирован" : "Активен"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="pt-2">
                  {!history ? (
                    <p className="text-muted-foreground text-sm">Загрузка...</p>
                  ) : history.videos.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Нет видео</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Платформа</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-right">Начислено</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.videos.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell>{v.id}</TableCell>
                              <TableCell>{v.platform.name}</TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(v.status)}>{STATUS_RU[v.status] ?? v.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {v.earnings ? `${parseFloat(v.earnings).toFixed(2)} \u20BD` : "\u2014"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(v.createdAt).toLocaleDateString("ru")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="withdrawals" className="pt-2">
                  {!history ? (
                    <p className="text-muted-foreground text-sm">Загрузка...</p>
                  ) : history.withdrawals.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Нет выводов</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Способ</TableHead>
                            <TableHead className="text-right">Сумма</TableHead>
                            <TableHead>Реквизиты</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.withdrawals.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>{w.id}</TableCell>
                              <TableCell>{w.method.name}</TableCell>
                              <TableCell className="text-right font-medium">
                                {parseFloat(w.amount).toFixed(2)} &#8381;
                              </TableCell>
                              <TableCell className="max-w-32 truncate text-muted-foreground" title={w.requisites}>
                                {w.requisites}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(w.status)}>{STATUS_RU[w.status] ?? w.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(w.createdAt).toLocaleDateString("ru")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="applications" className="pt-2">
                  {!history ? (
                    <p className="text-muted-foreground text-sm">Загрузка...</p>
                  ) : history.applications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Нет заявок</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Платформа</TableHead>
                            <TableHead>Канал</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.applications.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{a.id}</TableCell>
                              <TableCell>{a.platform.name}</TableCell>
                              <TableCell>
                                <a
                                  href={a.channelUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Ссылка <ExternalLink className="size-3" />
                                </a>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(a.status)}>{STATUS_RU[a.status] ?? a.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(a.createdAt).toLocaleDateString("ru")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>Отмена</Button>
                <Button onClick={saveEdit} disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
