import type { Request } from "express";
import type { ObjectResponder } from "./common";
import type { ObjectQueryRequest } from "./types";

type AnalyticsPayload = Record<string, unknown>;

type ClientAnalyticsEvent = {
  eventName?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
  occurredAt?: unknown;
  page?: unknown;
  referrer?: unknown;
  payload?: unknown;
};

const ANALYTICS_ENABLED =
  process.env.ANALYTICS_ENABLED === "true" ||
  process.env.TALLSTUFF_ENV === "prod";

const BOT_USER_AGENT_RE =
  /bot|crawler|spider|crawling|preview|slurp|bingbot|googlebot|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|pinterest|slackbot|discordbot|claudebot|gptbot|perplexitybot/i;

const MAX_STRING_LENGTH = 512;
const MAX_ARRAY_LENGTH = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function limitString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map(sanitizeValue);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key.slice(0, 80),
        sanitizeValue(entryValue),
      ])
    );
  }

  return undefined;
}

function sanitizePayload(value: unknown): AnalyticsPayload {
  if (!isRecord(value)) return {};
  return sanitizeValue(value) as AnalyticsPayload;
}

function isLikelyBot(userAgent: string | undefined): boolean {
  return userAgent ? BOT_USER_AGENT_RE.test(userAgent) : false;
}

function roundCoordinate(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.round(value * 1000) / 1000;
}

function roundedCoordinates(coords: { latitude: number; longitude: number } | undefined) {
  if (!coords) return undefined;
  return {
    latitude: roundCoordinate(coords.latitude),
    longitude: roundCoordinate(coords.longitude),
  };
}

function requestContext(req: Request) {
  const userAgent = req.get("user-agent");
  return {
    visitorId: limitString(req.get("x-tsnm-visitor-id")),
    sessionId: limitString(req.get("x-tsnm-session-id")),
    userAgent,
    isLikelyBot: isLikelyBot(userAgent),
    referer: limitString(req.get("referer")),
    path: req.path,
  };
}

function writeAnalyticsLog(
  eventName: string,
  payload: AnalyticsPayload,
  req: Request,
  contextOverrides: Partial<ReturnType<typeof requestContext>> = {}
) {
  if (!ANALYTICS_ENABLED) return false;

  const ctx = requestContext(req);
  console.log(
    JSON.stringify({
      severity: "INFO",
      message: "product_analytics_event",
      eventNamespace: "tallstuffnearme.analytics",
      eventName,
      ...ctx,
      ...contextOverrides,
      payload,
    })
  );
  return true;
}

export function recordClientAnalyticsEvent(body: ClientAnalyticsEvent, req: Request) {
  const eventName = limitString(body.eventName);
  if (!eventName) return false;
  const visitorId = limitString(body.visitorId);
  const sessionId = limitString(body.sessionId);

  return writeAnalyticsLog(
    eventName,
    {
      occurredAt: limitString(body.occurredAt),
      page: limitString(body.page),
      referrer: limitString(body.referrer),
      ...sanitizePayload(body.payload),
    },
    req,
    { visitorId, sessionId }
  );
}

export function recordObjectSearch(
  req: Request,
  query: ObjectQueryRequest,
  result: ObjectResponder,
  durationMs: number
) {
  return writeAnalyticsLog(
    "objects_search",
    {
      durationMs,
      resultCount: result.features.length,
      minHeight: query.minHeight,
      maxHeight: query.maxHeight,
      limit: query.limit,
      excludedObjectTypeCount: query.excludeObjectTypes?.length ?? 0,
      excludedObjectTypes: query.excludeObjectTypes ?? [],
      center: roundedCoordinates(query.center),
      bounds: {
        sw: roundedCoordinates(query.bounds.sw),
        ne: roundedCoordinates(query.bounds.ne),
      },
    },
    req
  );
}
