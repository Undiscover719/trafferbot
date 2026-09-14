import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <SectionCards />
      <div className="grid gap-4">
        <ChartAreaInteractive />
      </div>
    </div>
  );
}
