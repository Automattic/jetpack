import { __ } from '@wordpress/i18n';
import { formatWatchTime } from '../../utils/format';
import RankingCard, { type RankingItem } from './ranking-card';
import VideoTitleLink from './video-title-link';
import type { TopVideo } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	videos: TopVideo[];
	isLoading: boolean;
};

/**
 * "Top videos by watch time" ranking. Mirrors `MostViewedCard` but ranks
 * by per-video `watchTimeSeconds` and formats values with
 * `formatWatchTime` (e.g. "1.1 h", "12 min"). Rows link to the details
 * screen at `/video/$id`.
 *
 * @param props           - Component props.
 * @param props.videos    - Top videos by watch time for the active range.
 * @param props.isLoading - When true, renders skeleton rows so the card
 *                        height does not collapse.
 * @return The ranking.
 */
export default function TopByWatchTimeCard( { videos, isLoading }: Props ): ReactElement {
	const items: RankingItem[] = videos.map( v => ( {
		key: v.id,
		label: <VideoTitleLink to={ `/video/${ v.id }` }>{ v.title }</VideoTitleLink>,
		value: v.watchTimeSeconds,
	} ) );

	return (
		<RankingCard
			ariaLabel={ __( 'Top videos by watch time', 'jetpack-videopress-pkg' ) }
			columnHeader={ __( 'TITLE', 'jetpack-videopress-pkg' ) }
			valueColumnHeader={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
			items={ items }
			isLoading={ isLoading }
			emptyMessage={ __( 'No videos watched in the chosen period.', 'jetpack-videopress-pkg' ) }
			formatValue={ formatWatchTime }
		/>
	);
}
