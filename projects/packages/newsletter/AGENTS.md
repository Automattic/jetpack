# AGENTS.md

Guidance for AI coding agents working in this package.

## Seeing the newsletter screens locally

Almost every newsletter screen calls WordPress.com, so on a local Jetpack Docker site they stay hidden or empty. The dev mock in `tests/dev-mock/` fakes the connection and answers those calls with sample data. It's mounted as an inactive plugin in the `dev` Docker config, and it never ships, since `tests/` is excluded from production.

```bash
jp docker wp -- plugin activate newsletter-dev-mock
jp docker wp -- jetpack module activate subscriptions
jp docker wp -- jetpack module activate stats
jp docker wp -- jetpack module activate blocks   # without it, the editor loads no Jetpack plugins
jp docker wp -- option update sm_enabled 1       # turns on the subscribe pop-up
```

If your Docker site was already running before this mount existed, run `jp docker up` again so the container picks it up. In a worktree with its own Docker instance, add `--name <instance>` after `wp`. The mock connects user 1 (the Docker admin) through the `jetpack_options` filter and writes nothing to the database, so deactivating it leaves the site as it was. Every WordPress.com call without sample data returns a 404 and writes a `newsletter-dev-mock: no sample data for ...` line to `wp-content/debug.log`; add a pattern for that path to `tests/dev-mock/fixtures.json` to fill it.

## Feature map

| Screen | How to reach it | WordPress.com call | Sample data | Code |
| --- | --- | --- | --- | --- |
| Overview | Jetpack > Newsletter (`admin.php?page=jetpack-newsletter`) | `/wpcom/v2/sites/{id}/newsletter/task-lists/onboarding` | `fixtures.json` | `routes/dashboard/` |
| Subscribers | Newsletter > Subscribers tab (`&p=/?tab=subscribers`) | `/wpcom/v2/sites/{id}/subscribers` and `/subscribers/counts`, through the Jetpack proxy at `/wpcom/v2/subscribers/list` | `fixtures.json`: three subscribers, one with two comps, one paid plus a comp, one free | `_inc/subscribers/` |
| Settings | Newsletter > Settings tab (`&p=/?tab=settings`) | None; it reads and saves local settings | n/a | `src/settings/` |
| Dashboard widget | wp-admin Dashboard, "Jetpack Newsletter" box | `/wpcom/v2/sites/{id}/subscribers/stats`, made server-side | Built in `newsletter-dev-mock.php`: 30 days rising from 10 to 45 subscribers | `projects/plugins/jetpack/modules/subscriptions/newsletter-widget/` |
| Editor sidebar | Post editor, Jetpack Newsletter icon in the toolbar | Subscriber counts and the email preview, not mocked yet, so the audience counts show 0 | n/a | `projects/plugins/jetpack/extensions/blocks/subscriptions/` |
| Subscribe pop-up | A published post, logged out, scrolled halfway down (or after the `jetpack_subscribe_modal_load_time` delay, 60 seconds by default) | None | n/a | `projects/plugins/jetpack/modules/subscriptions/subscribe-modal/` |
