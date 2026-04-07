import { EVENT_COLOR_BY_ID, withOpacity, getPastelColor } from "@/lib/calendar-colors";

// The shape CalendarView expects — keep in sync with the type in CalendarView.tsx
export type InitialCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  classNames?: string[];
  extendedProps?: { colorId?: string; locked?: boolean };
};

type RawGoogleItem = {
  id: string;
  summary?: string;
  status?: string;
  colorId?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
};

export async function fetchCalendarEventsForServer(
  accessToken: string,
): Promise<InitialCalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "10000",
    showDeleted: "false",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      // cache this for 60 seconds so rapid navigations reuse the same fetch
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) return [];

  const data = await res.json();
  const items: RawGoogleItem[] = data.items ?? [];

  return items
    .filter(
      (item) =>
        item.status !== "cancelled" &&
        item.transparency !== "transparent" &&
        Boolean(item.start?.dateTime || item.start?.date),
    )
    .map((item) => {
      const isLocked = item.extendedProperties?.private?.locked === "true";
      const colorEntry = EVENT_COLOR_BY_ID[String(item.colorId)];
      const pastel = !colorEntry ? getPastelColor(item.id) : null;

      return {
        ...(colorEntry
          ? {
              backgroundColor: withOpacity(colorEntry.hex, 0.15),
              borderColor: withOpacity(colorEntry.hex, 0.4),
              textColor: colorEntry.hex,
            }
          : pastel
          ? {
              backgroundColor: pastel.bg,
              borderColor: pastel.border,
              textColor: pastel.text,
            }
          : {}),
        id: item.id,
        title: item.summary || "Untitled event",
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        classNames: isLocked ? ["fc-event-locked"] : [],
        extendedProps: {
          colorId: item.colorId ? String(item.colorId) : undefined,
          locked: isLocked,
        },
      };
    });
}
