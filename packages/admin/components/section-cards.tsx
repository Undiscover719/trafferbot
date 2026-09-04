"use client"

import { useEffect, useState } from "react"
import { fetcher } from "@/lib/fetcher"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  UsersIcon,
  FileTextIcon,
  VideoIcon,
  WalletIcon,
  TrendingUpIcon,
  CoinsIcon,
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  pendingApplications: number
  pendingVideos: number
  pendingWithdrawals: number
  totalEarnings: string
  totalWithdrawn: string
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetcher<DashboardStats>("/api/stats").then(setStats).catch(console.error)
  }, [])

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardDescription>&nbsp;</CardDescription>
              <CardTitle className="text-2xl">&nbsp;</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  const pending = stats.pendingApplications + stats.pendingVideos + stats.pendingWithdrawals

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Пользователи</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalUsers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <UsersIcon />
              Всего
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Зарегистрировано в системе
          </div>
          <div className="text-muted-foreground">
            Все трафферы и модераторы
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>На модерации</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pending}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <FileTextIcon />
              Ожидание
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.pendingApplications} заявок, {stats.pendingVideos} видео, {stats.pendingWithdrawals} выводов
          </div>
          <div className="text-muted-foreground">
            Требуют рассмотрения
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Общий заработок</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {parseFloat(stats.totalEarnings).toFixed(2)} &#8381;
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Начислено
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Сумма всех начислений <CoinsIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            За всё время работы
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Выведено</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {parseFloat(stats.totalWithdrawn).toFixed(2)} &#8381;
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <WalletIcon />
              Выплачено
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Завершённые выводы <VideoIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Всего выплачено трафферам
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
