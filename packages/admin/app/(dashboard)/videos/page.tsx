"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Video {
  id: number;
  userId: number;
  url: string;
  status: string;
  createdAt: string;
  user?: { username?: string; firstName?: string };
}

export default function VideosPage() {
  const { data, isLoading } = useSWR<{ items: Video[]; total: number }>(
    "/api/videos",
    fetcher
  );

  const [selected, setSelected] = useState<Video | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success(action === "approved" ? "Video approved" : "Video rejected");
      setSelected(null);
      mutate("/api/videos");
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Video>[] = [
    { accessorKey: "id", header: "ID" },
    {
      header: "User",
      cell: ({ row }) => {
        const v = row.original;
        return v.user?.username
          ? `@${v.user.username}`
          : (v.user?.firstName ?? `User ${v.userId}`);
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "approved"
            ? "default"
            : status === "rejected"
            ? "destructive"
            : "secondary";
        return (
          <Badge variant={variant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
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
          onClick={() => setSelected(row.original)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Videos</h1>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Video #{selected?.id}</DialogTitle>
            <DialogDescription>
              Submitted by{" "}
              {selected?.user?.username
                ? `@${selected.user.username}`
                : (selected?.user?.firstName ?? `User ${selected?.userId}`)}
            </DialogDescription>
          </DialogHeader>

          {selected?.url && (
            <div className="mt-2">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline break-all"
              >
                {selected.url}
              </a>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              disabled={actionLoading || selected?.status !== "pending"}
              onClick={() => selected && handleAction(selected.id, "rejected")}
            >
              Reject
            </Button>
            <Button
              disabled={actionLoading || selected?.status !== "pending"}
              onClick={() => selected && handleAction(selected.id, "approved")}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
