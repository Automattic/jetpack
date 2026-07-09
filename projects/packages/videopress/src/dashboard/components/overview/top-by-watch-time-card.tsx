import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
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
 * "Top videos by watch time" card. Mirrors `MostViewedCard` but ranks
 * by per-video `watchTimeSeconds` and formats values with
 * `formatWatchTime` (e.g. "1.1 h", "12 min"). Rows link to the details
 * screen at `/video/$id`; the footer "See all videos" link routes to
 * the Library tab.
 *
 * @param props           - Component props.
 * @param props.videos    - Top videos by watch time for the active range.
 * @param props.isLoading - When true, renders skeleton rows so the card
 *                        height does not collapse.
 * @return The card element.
 */
export default function TopByWatchTimeCard( { videos, isLoading }: Props ): ReactElement {
	const items: RankingItem[] = videos.map( v => ( {
		key: v.id,
		label: <VideoTitleLink to={ `/video/${ v.id }` }>{ v.title }</VideoTitleLink>,
		value: v.watchTimeSeconds,
	} ) );

	return (
		<RankingCard
			title={ __( 'Top videos by watch time', 'jetpack-videopress-pkg' ) }
			ariaLabel={ __( 'Top videos by watch time', 'jetpack-videopress-pkg' ) }
			columnHeader={ __( 'TITLE', 'jetpack-videopress-pkg' ) }
			valueColumnHeader={ __( 'WATCH TIME', 'jetpack-videopress-pkg' ) }
			items={ items }
			isLoading={ isLoading }
			emptyMessage={ __( 'No videos watched in the chosen period.', 'jetpack-videopress-pkg' ) }
			formatValue={ formatWatchTime }
			footer={
				<Stack direction="row" justify="center" className="vp-overview__ranking-footer">
					<Link to="/library">{ __( 'See all videos', 'jetpack-videopress-pkg' ) }</Link>
				</Stack>
			}
		/>
	);
}
