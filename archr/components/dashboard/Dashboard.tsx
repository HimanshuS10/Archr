import CalendarView, {
  CalendarHandle,
} from "@/components/dashboard/CalendarView";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";

type DashboardProps = {
  isExpanded: boolean;
};

function Dashboard({ isExpanded }: DashboardProps) {
  const calendarRef = useRef<CalendarHandle | null>(null);
  const [title, setTitle] = useState("Calendar");
  const [activeView, setActiveView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("timeGridWeek");

  const handleViewChange = (
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay",
  ) => {
    setActiveView(view);
    calendarRef.current?.changeView(view);
  };

  return (
    <main
      className="max-h-screen px-8 py-10 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 260 : 70 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Calendar03Icon} />
          <h1 className="text-2xl font-semibold">Calendar - </h1>
          <h1 className="text-2xl font-light">{title}</h1>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => calendarRef.current?.prev()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.next()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.today()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          {(
            [
              { label: "Month", view: "dayGridMonth" },
              { label: "Week", view: "timeGridWeek" },
              { label: "Day", view: "timeGridDay" },
            ] as const
          ).map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => handleViewChange(item.view)}
              className={`rounded-full px-4 py-2 transition ${
                activeView === item.view
                  ? "bg-blue-500/30 text-blue-100"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <CalendarView ref={calendarRef} onTitleChange={setTitle} />
      </div>
    </main>
  );
}

export default Dashboard;
