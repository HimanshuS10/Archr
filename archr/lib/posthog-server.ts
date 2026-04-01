import { PostHog } from "posthog-node";

type CaptureServerEventInput = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

function getPostHogConfig() {
  const projectToken =
    process.env.POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    return null;
  }

  return { projectToken, host };
}

export async function captureServerEvent({
  distinctId,
  event,
  properties,
}: CaptureServerEventInput) {
  const config = getPostHogConfig();
  if (!config) {
    return;
  }

  const posthog = new PostHog(config.projectToken, {
    host: config.host,
  });

  try {
    posthog.capture({
      distinctId,
      event,
      properties,
    });
  } finally {
    await posthog.shutdown();
  }
}
