/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

/**
 * A single normalized video row, flattened from the video-plays report with
 * its comparison-period plays already matched by stable video key.
 */
export type VideoPlaysRow = {
	/**
	 * Stable row key: the video's post ID, else its URL, else its label.
	 */
	key: string;
	/**
	 * Video title, falling back to a translated "Untitled video" label.
	 */
	label: string;
	/**
	 * URL of the page embedding the video, used to render the row label as an
	 * outbound link. `null` when the API provides none.
	 */
	link: string | null;
	/**
	 * Play count for the selected period.
	 */
	plays: number;
	/**
	 * Play count for the comparison period. `null` when the video has no
	 * matching comparison row — distinct from a real zero, so the widget can
	 * fall back to a non-comparison view instead of fabricating deltas.
	 */
	previousPlays: number | null;
};

/**
 * Resolve a display label for a video, falling back to a translated
 * "Untitled video" label when the API provides none.
 *
 * @param video - The video-plays item.
 * @return The video's display label.
 */
function getVideoLabel( video: StatsVideoPlaysItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics' );
}

/**
 * Resolve the key used to align a video across the primary and comparison
 * periods, and to identify its leaderboard row. Prefers the stable post ID,
 * then the video URL, and only falls back to the display label when the API
 * omits both — so multiple untitled videos don't collapse onto one key.
 *
 * @param video - The video-plays item.
 * @return The alignment key.
 */
function getVideoKey( video: StatsVideoPlaysItem ) {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}

/**
 * Flatten a normalized video-plays report into its per-video items. The Stats
 * query layer summarizes multi-day ranges server-side and the endpoint returns
 * videos already ranked and limited by `max`, so the report carries a single
 * data point of per-video totals.
 *
 * @param report - The normalized video-plays report, or undefined while loading.
 * @return The per-video items for the period.
 */
function toVideoItems(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): StatsVideoPlaysItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

/**
 * Flattens the primary video-plays report into normalized rows, attaching each
 * video's comparison-period plays matched by stable video key. Videos missing
 * from the comparison period keep `previousPlays: null` so the caller can tell
 * "no comparison row" apart from a real zero.
 *
 * @param primary    - Primary period video-plays report
 * @param comparison - Comparison period video-plays report
 * @return Normalized rows ready for the leaderboard
 */
export function toVideoPlaysRows(
	primary: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	comparison: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): VideoPlaysRow[] {
	const comparisonPlays = new Map(
		toVideoItems( comparison ).map( video => [ getVideoKey( video ), video.plays ] )
	);

	return toVideoItems( primary ).map( video => {
		const key = getVideoKey( video );

		return {
			key,
			label: getVideoLabel( video ),
			link: video.link,
			plays: video.plays,
			previousPlays: comparisonPlays.get( key ) ?? null,
		};
	} );
}
