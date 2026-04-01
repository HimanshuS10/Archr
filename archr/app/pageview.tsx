"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      track("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
