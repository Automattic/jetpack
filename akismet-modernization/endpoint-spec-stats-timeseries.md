# Spec: `akismet/v1/stats/timeseries` (proposal)

**For:** AKISMET team (`cfinke`, `bluefuton`, `derekspringer`, `andyperdomo`) — to be filed as its own Linear issue under the AKISMET team. This doc is the issue body draft.

**Why:** The existing `akismet/v1/stats/<interval>` endpoint returns interval *totals* only. Any modernized admin UI that wants to show a "spam blocked over time" line chart has to either (a) embed the existing `tools.akismet.com/1.0/user-stats.php` iframe (current state — the modernized UI is trying to leave this behind) or (b) call multiple totals endpoints and stitch them, which doesn't work for non-anchored buckets. Both are bad. A proper time-series endpoint unblocks the modernized UI and any future consumer that wants per-day or per-week data.

This is filed in support of the **Akismet UI exploration** ([umbrella ticket TBD]) that's part of the [Jetpack Experience Unification](https://linear.app/a8c/initiative/jetpack-experience-unification-2c58a9bef240) initiative.

---

## Proposed contract

```
GET /wp-json/akismet/v1/stats/timeseries?interval={interval}&bucket={bucket}
```

### Query params

| Param | Type | Required | Default | Allowed |
| --- | --- | --- | --- | --- |
| `interval` | enum | yes | — | `30-days`, `60-days`, `6-months`, `12-months`, `all` |
| `bucket` | enum | no | derived from `interval` (`30-days`/`60-days` → `day`; `6-months`/`12-months` → `week`; `all` → `month`) | `day`, `week`, `month` |

### Response (200)

```json
{
  "interval": "30-days",
  "bucket": "day",
  "series": [
    { "date": "2026-04-28", "spam": 142, "ham": 8, "missed_spam": 1, "false_positives": 0 },
    { "date": "2026-04-29", "spam": 220, "ham": 5, "missed_spam": 0, "false_positives": 1 }
    // ... one point per bucket
  ],
  "totals": {
    "spam": 4321,
    "ham": 187,
    "missed_spam": 6,
    "false_positives": 2,
    "accuracy": 99.81,
    "time_saved": 51852
  },
  "generated_at": "2026-05-27T12:00:00Z"
}
```

- `date` is the **bucket start** in `YYYY-MM-DD` (UTC).
- `accuracy` is `(spam + ham - missed_spam - false_positives) / (spam + ham) * 100` rounded to 2 decimals.
- `time_saved` is in seconds.
- `totals` is a convenience for clients that want both the chart and the KPI tiles in one round-trip; equivalent to `GET /stats/{interval}`.

### Errors

| Status | Code | When |
| --- | --- | --- |
| 400 | `invalid_interval` | `interval` not in the allowed list |
| 400 | `invalid_bucket` | `bucket` not in the allowed list, or incompatible with `interval` (e.g. `bucket=day` with `interval=all` returns >365 points — reject) |
| 401 | (default) | not authenticated |
| 403 | `forbidden` | user lacks `manage_options` |
| 503 | `akismet_unavailable` | upstream (Akismet.com / tools.akismet.com) returned a non-2xx |

## Permission

`privileged_permission_callback` (same as the existing `akismet/v1/stats/<interval>`).

## Data source

Two implementation options the AKISMET team should choose between:

### Option A — proxy to a new Akismet.com endpoint

Stand up a sibling of `tools.akismet.com/1.0/user-stats.php` that returns JSON time-series. The WP-side handler proxies the call (Bearer or `blog`+`token` auth, same as current `Akismet::http_post( …, 'get-stats' )` shape at `class.akismet.php`). Pros: single source of truth, matches the existing stats pipeline. Cons: requires Akismet.com work.

### Option B — local synthesis from `akismet_history` + `_akismet_score` meta

Bucket-aggregate from comment-meta written by `Akismet::update_comment_history()` (in `class.akismet.php`). Pros: zero external dependency, runs on the site. Cons: slow for sites with millions of comments unless we materialize a rollup table; only covers data written *after* the meta-write was in place; doesn't include `time_saved`.

**Recommendation:** Option A. Aligns with how the existing endpoints work and stays the source-of-truth in Akismet.com.

### Hybrid path

If the Akismet.com endpoint can't ship soon, an interim handler can synthesize the series locally from comment meta and serve only the buckets it can fully cover (the response includes a `partial: true` flag for windows where data is missing). The modernized UI would render a "data before YYYY-MM-DD is approximate" hint in those cases. The exploration prototype doesn't need this; the production version might.

## Caching

Server-side cache the response for `MINUTE_IN_SECONDS * 5` per `(interval, bucket, blog_id)`. Existing `Akismet::http_post( …, 'get-stats' )` doesn't cache today; a transient-based cache here keeps the chart snappy without hammering tools.akismet.com.

## Test cases

1. `GET /stats/timeseries?interval=30-days` returns `series.length == 30` with `bucket == "day"`.
2. `GET /stats/timeseries?interval=6-months` returns `bucket == "week"` and `series.length` in `[26, 27]`.
3. `GET /stats/timeseries?interval=30-days&bucket=month` returns 400 `invalid_bucket`.
4. `GET /stats/timeseries?interval=garbage` returns 400 `invalid_interval`.
5. Unauthenticated request returns 401.
6. User without `manage_options` returns 403.
7. With the Akismet.com source unavailable, the handler returns 503 with code `akismet_unavailable`.
8. `totals` matches what `GET /stats/30-days` returns (cross-endpoint consistency).

## Out of scope for this ticket

- Time-series **enriched with Blackbox signals** — that's a separate, larger conversation. The exploration UI's "blackbox overview" surface uses Blackbox endpoints directly; we don't try to fold Blackbox aggregates into this Akismet endpoint.
- Per-host breakdown (e.g., spam by post, spam by source domain). Worth a future endpoint; not blocking the modernized chart.
- Daily buckets for `interval=all`. Too many points for a chart; only `bucket=month` is meaningful at that range.

## Timeline ask

If Option A is acceptable, the exploration UI needs the endpoint by **end of June 2026** to land before any internal demo. The prototype runs against a deterministic mock adapter until the endpoint exists; the swap is a one-file change. No hard external dependency.

---

## Linear issue body (for filing)

```
## Summary

Propose a new REST endpoint `GET /akismet/v1/stats/timeseries` that returns a per-bucket time-series of spam / ham / accuracy / time-saved data, alongside the existing interval totals.

## Why

`akismet/v1/stats/<interval>` only returns totals. The modernized admin UI being prototyped under [Jetpack Experience Unification] needs per-day / per-week buckets to render a native chart instead of the current `tools.akismet.com/1.0/user-stats.php` iframe. Building this once helps every future Akismet UI consumer.

## Proposed contract

[See full spec doc: <link to akismet-modernization/endpoint-spec-stats-timeseries.md in the prototype branch>]

GET /akismet/v1/stats/timeseries?interval={30-days|60-days|6-months|12-months|all}&bucket={day|week|month}

Returns { interval, bucket, series[{date,spam,ham,missed_spam,false_positives}], totals{…}, generated_at }.

## Implementation options

- A) Proxy to a new Akismet.com endpoint (recommended; aligns with existing stats pipeline).
- B) Local synthesis from comment meta (zero external dep; slower; partial coverage).

## Not in scope

- Blackbox-enriched time-series (separate track).
- Per-host / per-post breakdown.

## Asks

- Is Option A on the table? If yes, who from Akismet.com owns it?
- Acceptable to ship the WP-side handler against mocks until the upstream lands?
- Target: end of June 2026 to keep the UI exploration on cadence.
```
