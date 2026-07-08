import jetpackAnalytics from '@automattic/jetpack-analytics';

/**
 * Tracks event names mirrored from Calypso's `client/my-sites/subscribers/` directory, with the
 * `calypso_` prefix swapped for `jetpack_`. We only mirror events that have a counterpart in
 * the wp-admin port — Migrate is intentionally excluded since that flow doesn't ship from the
 * dashboard yet, and a few Calypso-only marketing-CTA events from the WPCOM empty state are
 * dropped because they don't exist here.
 */
export type TracksEventName =
	| 'jetpack_subscribers_search_performed'
	| 'jetpack_subscribers_filter_applied'
	| 'jetpack_subscribers_sort_changed'
	| 'jetpack_subscribers_subscriber_row_clicked'
	| 'jetpack_subscribers_subscriber_removed'
	| 'jetpack_subscribers_remove_free_subscriber_modal_showed'
	| 'jetpack_subscribers_remove_free_subscriber_modal_dismissed'
	| 'jetpack_subscribers_remove_paid_subscriber_modal_showed'
	| 'jetpack_subscribers_remove_paid_subscriber_modal_dismissed'
	| 'jetpack_subscribers_comp_modal_open'
	| 'jetpack_subscribers_comp_modal_confirm'
	| 'jetpack_subscribers_remove_comp_confirm'
	| 'jetpack_subscribers_export_downloaded'
	| 'jetpack_subscribers_add_question'
	| 'jetpack_subscribers_empty_view_displayed';

type Props = Record< string, unknown >;

/**
 * Fire a Tracks event scoped to the subscribers dashboard. Silently no-ops when the WPCOM Tracks
 * queue (`window._tkq`) hasn't been loaded — that's the case in unit tests and on environments
 * where stats.wp.com is suppressed, and we don't want to raise.
 *
 * @param event - Tracks event name (must start with `jetpack_subscribers_`).
 * @param props - Event payload. `blog_id` is auto-attached by `jetpack-analytics` when present
 *              in `window.jpTracksContext` so callers shouldn't pass it.
 */
export function recordTracksEvent( event: TracksEventName, props: Props = {} ): void {
	jetpackAnalytics.tracks.recordEvent( event, props );
}
