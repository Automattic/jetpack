import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { useEffect, useRef } from '@wordpress/element';

type StatsArea = 'subscribers' | 'recent_posts';
type StatsViewState = 'empty' | 'error';

/**
 * Record a Stats interaction, including the site type.
 *
 * @param event - Tracks event name.
 * @param props - Extra event properties. `site_type` is added here.
 */
export function recordStatsEvent(
	event:
		| 'jetpack_newsletter_stats_post_click'
		| 'jetpack_newsletter_stats_view_all_click'
		| 'jetpack_newsletter_stats_create_post_click'
		| 'jetpack_newsletter_stats_retry_click'
		| 'jetpack_newsletter_stats_interval_click'
		| 'jetpack_newsletter_stats_state_view',
	props: Record< string, string | number > = {}
): void {
	analytics.tracks.recordEvent( event, {
		site_type: getSiteType(),
		...props,
	} );
}

/**
 * Record an empty or error Stats view once per area and state.
 * Loading, and a later re-render of the same state, do not record again.
 *
 * @param area  - Chart or recent-posts list.
 * @param state - Empty or error, or null while loading or showing content.
 */
export function useStatsStateView( area: StatsArea, state: StatsViewState | null ): void {
	const lastState = useRef< string | null >( null );

	useEffect( () => {
		if ( ! state ) {
			lastState.current = null;
			return;
		}

		const key = `${ area }:${ state }`;
		if ( lastState.current === key ) {
			return;
		}

		lastState.current = key;
		recordStatsEvent( 'jetpack_newsletter_stats_state_view', { area, state } );
	}, [ area, state ] );
}
