"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  totalVideos: number;
  pendingVideos: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalPayouts: number;
}

export function SectionCards() {
  const { data, isLoading } = useSWR<Stats>("/api/stats", fetcher);

  const cards = [
    {
      title: "Total Users",
      value: data?.totalUsers ?? 0,
      description: "Registered bot users",
    },
    {
      title: "Applications",
      value: data?.totalApplications ?? 0,
      description: `${data?.pendingApplications ?? 0} pending review`,
    },
    {
      title: "Videos",
      value: data?.totalVideos ?? 0,
      description: `${data?.pendingVideos ?? 0} pending review`,
    },
    {
      title: "Withdrawals",
      value: data?.totalWithdrawals ?? 0,
      description: `${data?.pendingWithdrawals ?? 0} pending approval`,
    },
    {
      title: "Total Payouts",
      value: `$${(data?.totalPayouts ?? 0).toFixed(2)}`,
      description: "Approved withdrawal total",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-1" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-3 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
