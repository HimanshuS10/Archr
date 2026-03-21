import CalendarView, {
  CalendarHandle,
} from "@/components/dashboard/CalendarView";
import { useRef, useState } from "react";

type DashboardProps = {
  isExpanded: boolean;
};

function Dashboard({ isExpanded }: DashboardProps) {
  const calendarRef = useRef<CalendarHandle | null>(null);
  const [title, setTitle] = useState("");
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
      className="h-screen overflow-hidden px-8 pt-2 pb-3 transition-[margin] duration-300"
      style={{ marginLeft: isExpanded ? 260 : 70 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => calendarRef.current?.prev()}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.next()}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            &gt;
          </button>
          <p className="px-1 text-sm font-semibold text-gray-800">{title}</p>
          <button
            type="button"
            onClick={() => calendarRef.current?.today()}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 text-sm shadow-sm">
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
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeView === item.view
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 h-[calc(100vh-5.75rem)]">
        <CalendarView ref={calendarRef} onTitleChange={setTitle} />
      </div>
    </main>
  );
}

export default Dashboard;
