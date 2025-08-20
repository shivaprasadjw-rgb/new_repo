import CalendarList from "@/components/CalendarList";
import { tournaments } from "@/lib/data";

export const metadata = {
  title: "Schedule",
  description: "Calendar view of upcoming tournaments.",
};

export const revalidate = 300; // cache schedule page for 5 minutes

export default function SchedulePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Schedule</h1>
      <CalendarList tournaments={tournaments} />
    </div>
  );
}
