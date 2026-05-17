import { BACKEND_URL } from "./constants";
import { analyticsHeaders } from "./analytics";
import type { ObjectQueryRequest, ObjectGeoJson } from "./types";

export async function fetchObjects(
  params: ObjectQueryRequest,
  signal?: AbortSignal
): Promise<ObjectGeoJson> {
  const res = await fetch(`${BACKEND_URL}/objects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...analyticsHeaders() },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
