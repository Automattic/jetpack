/**
 * External dependencies
 */
import {
	getVideoKey,
	getVideoLabel,
	toVideoItems,
} from '@jetpack-premium-analytics/widgets-toolkit';
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
