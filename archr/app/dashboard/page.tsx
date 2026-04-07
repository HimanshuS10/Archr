import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessTokenForUser } from "@/lib/google-calendar-server";
import { fetchCalendarEventsForServer } from "@/lib/calendar-events-server";
import type { InitialCalendarEvent } from "@/lib/calendar-events-server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  let initialEvents: InitialCalendarEvent[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const accessToken = await getGoogleAccessTokenForUser(supabase, user.id);
      initialEvents = await fetchCalendarEventsForServer(accessToken);
    }
  } catch {
    // If the token is missing or the fetch fails, the client will load events
    // on its own — this is a graceful fallback, not an error state.
  }

  return <DashboardShell initialEvents={initialEvents} />;
}
