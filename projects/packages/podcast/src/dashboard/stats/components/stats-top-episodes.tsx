import { formatNumber } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import HorizontalBarList from './horizontal-bar-list';
import SectionCard from './section-card';
import type { PodcastStatsTopEpisode } from '../types';

type StatsTopEpisodesProps = {
	episodes?: PodcastStatsTopEpisode[];
	isLoading?: boolean;
	onSelect?: ( episode: PodcastStatsTopEpisode ) => void;
};

const StatsTopEpisodes = ( {
	episodes = [],
	isLoading = false,
	onSelect,
}: StatsTopEpisodesProps ) => {
	const title = __( 'Top episodes', 'jetpack-podcast' );

	if ( isLoading ) {
		return <SectionCard title={ title } isLoading />;
	}

	if ( episodes.length === 0 ) {
		return (
			<SectionCard
				title={ title }
				isEmpty
				emptyMessage={ __( 'No episode downloads in this period.', 'jetpack-podcast' ) }
			>
				{ null }
			</SectionCard>
		);
	}

	const maxValue = episodes.reduce( ( max, ep ) => Math.max( max, ep.plays ), 0 );
	const data = episodes.map( ep => {
		const labelText = ep.title || __( '(Untitled)', 'jetpack-podcast' );
		return {
			id: String( ep.post_id ),
			label: labelText,
			labelText,
			value: ep.plays,
			maxValue,
			formattedValue: formatNumber( ep.plays ),
			onClick: onSelect ? () => onSelect( ep ) : undefined,
		};
	} );

	return (
		<SectionCard title={ title }>
			<HorizontalBarList rows={ data } />
		</SectionCard>
	);
};

export default StatsTopEpisodes;
