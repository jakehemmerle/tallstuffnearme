# Analytics

Production analytics are first-party events written as structured JSON logs from
Cloud Run stdout. They live in the `tallshitnearme-app` project's `_Default`
Cloud Logging bucket, which is configured for 365-day retention and Log
Analytics.

## Event Model

The browser sets a long-lived `tsnm_visitor_id` cookie and a per-tab
`tsnm_session_id` in `sessionStorage`. Analytics only runs on production hosts.
Staging and local development do not emit product analytics.

Frontend events:

- `page_view`
- `session_end`
- `object_detail_open`
- `google_maps_click`
- `filter_toggle`

Backend events:

- `objects_search`

All events include `eventNamespace="tallstuffnearme.analytics"`, `eventName`,
`visitorId`, `sessionId`, `userAgent`, `isLikelyBot`, and event-specific
payload fields. Search location context is rounded to 3 decimal places.

## Logging Queries

Tail product analytics events:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="tallshit-prod-app"
   logName="projects/tallshitnearme-app/logs/run.googleapis.com%2Fstdout"
   jsonPayload.eventNamespace="tallstuffnearme.analytics"' \
  --project=tallshitnearme-app \
  --freshness=7d \
  --limit=50 \
  --format=json
```

Count object detail opens:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="tallshit-prod-app"
   jsonPayload.eventNamespace="tallstuffnearme.analytics"
   jsonPayload.eventName="object_detail_open"' \
  --project=tallshitnearme-app \
  --freshness=30d \
  --format='value(jsonPayload.visitorId)' | wc -l
```

Count unique visitors with product analytics events:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="tallshit-prod-app"
   jsonPayload.eventNamespace="tallstuffnearme.analytics"
   jsonPayload.isLikelyBot=false' \
  --project=tallshitnearme-app \
  --freshness=30d \
  --format='value(jsonPayload.visitorId)' | sort -u | wc -l
```

Find Google Maps outbound clicks:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="tallshit-prod-app"
   jsonPayload.eventNamespace="tallstuffnearme.analytics"
   jsonPayload.eventName="google_maps_click"' \
  --project=tallshitnearme-app \
  --freshness=30d \
  --limit=100 \
  --format='table(timestamp,jsonPayload.visitorId,jsonPayload.payload.oasNumber,jsonPayload.payload.objectType,jsonPayload.payload.city,jsonPayload.payload.state)'
```

Inspect backend searches:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   resource.labels.service_name="tallshit-prod-app"
   jsonPayload.eventNamespace="tallstuffnearme.analytics"
   jsonPayload.eventName="objects_search"' \
  --project=tallshitnearme-app \
  --freshness=30d \
  --limit=100 \
  --format='table(timestamp,jsonPayload.visitorId,jsonPayload.payload.resultCount,jsonPayload.payload.durationMs,jsonPayload.payload.center.latitude,jsonPayload.payload.center.longitude)'
```

## Cost Notes

As of the current Google Cloud Observability pricing page, Cloud Logging
includes 50 GiB of log ingestion per project per month at no charge. Additional
ingestion is `$0.50/GiB`. Extended retention beyond the default 30 days is
`$0.01/GiB/month`, and Log Analytics has no separate charge. At current traffic,
this should be very small unless event volume grows substantially.

Pricing reference:
<https://cloud.google.com/stackdriver/pricing>
