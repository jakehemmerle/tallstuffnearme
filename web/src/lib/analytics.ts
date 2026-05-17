"use client";

import type { ObjectGeoJsonProperties } from "@/lib/types";
import type { Feature, Point } from "geojson";

type AnalyticsPayload = Record<string, unknown>;

const VISITOR_COOKIE = "tsnm_visitor_id";
const SESSION_STORAGE_KEY = "tsnm_session_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const PRODUCT_EVENT_URL = "/analytics";
const PRODUCTION_HOSTS = new Set(["tallshitnearme.com", "www.tallshitnearme.com"]);

const startedAt = Date.now();
let sessionEndSent = false;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function analyticsEnabled() {
  if (!isBrowser()) return false;
  const host = window.location.hostname;
  return PRODUCTION_HOSTS.has(host) || host.startsWith("tallshit-prod-app-");
}

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function writeVisitorCookie(visitorId: string) {
  document.cookie = [
    `${VISITOR_COOKIE}=${visitorId}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function getAnalyticsIds() {
  if (!analyticsEnabled()) return null;

  let visitorId = readCookie(VISITOR_COOKIE);
  if (!visitorId) {
    visitorId = randomId();
  }
  writeVisitorCookie(visitorId);

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = randomId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return { visitorId, sessionId };
}

export function analyticsHeaders(): HeadersInit {
  const ids = getAnalyticsIds();
  if (!ids) return {};
  return {
    "X-TSNM-Visitor-Id": ids.visitorId,
    "X-TSNM-Session-Id": ids.sessionId,
  };
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  const ids = getAnalyticsIds();
  if (!ids) return;

  const body = JSON.stringify({
    eventName,
    visitorId: ids.visitorId,
    sessionId: ids.sessionId,
    occurredAt: new Date().toISOString(),
    page: window.location.pathname,
    referrer: document.referrer,
    payload,
  });

  fetch(PRODUCT_EVENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never interrupt product use.
  });
}

function sendBeaconEvent(eventName: string, payload: AnalyticsPayload = {}) {
  const ids = getAnalyticsIds();
  if (!ids || !navigator.sendBeacon) return false;

  const body = JSON.stringify({
    eventName,
    visitorId: ids.visitorId,
    sessionId: ids.sessionId,
    occurredAt: new Date().toISOString(),
    page: window.location.pathname,
    referrer: document.referrer,
    payload,
  });

  return navigator.sendBeacon(
    PRODUCT_EVENT_URL,
    new Blob([body], { type: "application/json" })
  );
}

export function startAnalyticsSession() {
  if (!analyticsEnabled()) return () => {};

  trackEvent("page_view", {
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  const sendSessionEnd = () => {
    if (sessionEndSent) return;
    sessionEndSent = true;
    sendBeaconEvent("session_end", {
      durationMs: Date.now() - startedAt,
      url: window.location.href,
    });
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      sendSessionEnd();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", sendSessionEnd);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", sendSessionEnd);
  };
}

export function objectAnalyticsPayload(
  feature: Feature<Point, ObjectGeoJsonProperties>
) {
  const [longitude, latitude] = feature.geometry.coordinates;
  const props = feature.properties;

  return {
    oasNumber: props.OASNumber,
    objectType: props.ObjectType,
    agl: props.AGL,
    amsl: props.AMSL,
    city: props.City,
    state: props.State,
    distanceFromLocation: props.distanceFromLocation,
    latitude,
    longitude,
  };
}
