/**
 * External dependencies
 */
import { getVideoKey, getVideoLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';

/**
 * A single video row with its presentation fields resolved, built from the
 * already-merged video-plays rows the Stats data layer returns.
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
	 * Play count for the comparison period. `undefined` when the video has no
	 * matching comparison row — distinct from a real zero, so the chart can
	 * suppress the row's delta instead of fabricating one.
	 */
	previousPlays: number | undefined;
};

/**
 * Maps merged video-plays rows from the Stats data layer onto normalized rows
 * ready for the leaderboard. Comparison matching already happened in the data
 * layer; this only resolves the display key, label, and link.
 *
 * @param videos - Merged video-plays rows from the Stats data layer.
 * @return Normalized rows ready for the leaderboard.
 */
export function toVideoPlaysRows( videos: StatsVideoPlaysComparisonItem[] = [] ): VideoPlaysRow[] {
	return videos.map( video => ( {
		key: getVideoKey( video ),
		label: getVideoLabel( video ),
		link: video.link,
		plays: video.plays,
		previousPlays: video.previousPlays,
	} ) );
}
