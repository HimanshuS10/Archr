"use client";

import posthog from "posthog-js";

export type AnalyticsEventName = "$pageview" | (string & {});
export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function track(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
) {
  posthog.capture(event, properties);
}
