"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface LogEntry {
  id: number;
  adminId: number;
  action: string;
  targetId?: number;
  details?: string;
  createdAt: string;
  admin?: { username?: string; firstName?: string };
}

export default function LogsPage() {
  const { data, isLoading } = useSWR<{ items: LogEntry[]; total: number }>(
    "/api/logs",
    fetcher
  );

  const columns: ColumnDef<LogEntry>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      header: "Admin",
      cell: ({ row }) => {
        const entry = row.original;
        return entry.admin?.username
          ? `@${entry.admin.username}`
          : (entry.admin?.firstName ?? `Admin ${entry.adminId}`);
      },
    },
    {
      accessorKey: "action",
      header: "Action",
    },
    {
      accessorKey: "targetId",
      header: "Target ID",
      cell: ({ row }) => row.original.targetId ?? "—",
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => row.original.details ?? "—",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString("en-US"),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
