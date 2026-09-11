"use client";

import { useEffect } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
const OPT_OUT_KEY = "tindahan:analytics-opt-out";

function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false; // private browsing / storage blocked — fall back to tracking as normal
  }
}

/**
 * Drops events from local dev servers, from automated browsers (Playwright,
 * Puppeteer, Selenium — anything that sets navigator.webdriver) whether
 * they're pointed at localhost or the live deployed site, and from any
 * browser that's visited the site with ?analytics=off (see below). Exported
 * standalone so the filtering rule itself is easy to unit test without
 * rendering the component.
 */
export function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (typeof navigator !== "undefined" && navigator.webdriver) return null;
  if (typeof localStorage !== "undefined" && isOptedOut()) return null;

  let hostname: string;
  try {
    hostname = new URL(event.url).hostname;
  } catch {
    return null; // malformed URL — drop rather than risk skewed data
  }
  if (LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) return null;
  return event;
}

/**
 * A human browsing the live site looks identical to a real customer at the
 * network level, so there's no automatic signal to exclude "yourself" the
 * way there is for bots. Instead: visit the site once with ?analytics=off
 * and that browser stops sending events from then on (persisted via
 * localStorage, so it survives reloads and new tabs). ?analytics=on reverses
 * it. Either way the param is stripped from the URL right after.
 */
function useAnalyticsOptOutParam() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("analytics");
    if (value !== "off" && value !== "on") return;
    try {
      if (value === "off") localStorage.setItem(OPT_OUT_KEY, "1");
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch {
      // private browsing / storage blocked — nothing to persist
    }
    params.delete("analytics");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : "") + window.location.hash);
  }, []);
}

export function FilteredAnalytics() {
  useAnalyticsOptOutParam();
  return <Analytics beforeSend={beforeSend} />;
}
