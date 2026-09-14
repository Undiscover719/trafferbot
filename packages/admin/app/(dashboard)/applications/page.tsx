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

interface Application {
  id: number;
  userId: number;
  platformId: number;
  status: string;
  createdAt: string;
  user?: { username?: string; firstName?: string };
  platform?: { name: string };
  answers?: Record<string, string>;
}

export default function ApplicationsPage() {
  const { data, isLoading } = useSWR<{ items: Application[]; total: number }>(
    "/api/applications",
    fetcher
  );

  const [selected, setSelected] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success(
        action === "approved"
          ? "Application approved"
          : "Application rejected"
      );
      setSelected(null);
      mutate("/api/applications");
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      header: "User",
      cell: ({ row }) => {
        const app = row.original;
        return app.user?.username
          ? `@${app.user.username}`
          : (app.user?.firstName ?? `User ${app.userId}`);
      },
    },
    {
      header: "Platform",
      cell: ({ row }) => row.original.platform?.name ?? row.original.platformId,
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
      <h1 className="text-2xl font-semibold">Applications</h1>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application #{selected?.id}</DialogTitle>
            <DialogDescription>
              Submitted by{" "}
              {selected?.user?.username
                ? `@${selected.user.username}`
                : (selected?.user?.firstName ?? `User ${selected?.userId}`)}
              {" "}for{" "}
              <strong>{selected?.platform?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {selected?.answers && (
            <div className="space-y-2 text-sm">
              {Object.entries(selected.answers).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium capitalize">{key}:</span>{" "}
                  {value}
                </div>
              ))}
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
