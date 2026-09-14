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

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  method: string;
  status: string;
  details?: string;
  createdAt: string;
  user?: { username?: string; firstName?: string };
}

export default function WithdrawalsPage() {
  const { data, isLoading } = useSWR<{ items: Withdrawal[]; total: number }>(
    "/api/withdrawals",
    fetcher
  );

  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success(
        action === "approved" ? "Withdrawal approved" : "Withdrawal rejected"
      );
      setSelected(null);
      mutate("/api/withdrawals");
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnDef<Withdrawal>[] = [
    { accessorKey: "id", header: "ID" },
    {
      header: "User",
      cell: ({ row }) => {
        const w = row.original;
        return w.user?.username
          ? `@${w.user.username}`
          : (w.user?.firstName ?? `User ${w.userId}`);
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
    },
    { accessorKey: "method", header: "Method" },
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
      header: "Requested",
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
      <h1 className="text-2xl font-semibold">Withdrawals</h1>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Withdrawal #{selected?.id}</DialogTitle>
            <DialogDescription>
              Requested by{" "}
              {selected?.user?.username
                ? `@${selected.user.username}`
                : (selected?.user?.firstName ?? `User ${selected?.userId}`)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Amount:</span>{" "}
              ${selected?.amount?.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Method:</span> {selected?.method}
            </div>
            {selected?.details && (
              <div>
                <span className="font-medium">Details:</span> {selected.details}
              </div>
            )}
          </div>

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
