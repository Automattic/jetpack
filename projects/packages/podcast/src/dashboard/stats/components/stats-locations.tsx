import { GeoChart } from '@automattic/charts';
import { __ } from '@wordpress/i18n';
import SectionCard from './section-card';
import type { PodcastStatsCountryRow } from '../types';
import type { GeoData } from '@automattic/charts';

type StatsLocationsProps = {
	rows?: PodcastStatsCountryRow[];
	isLoading?: boolean;
};

const StatsLocations = ( { rows = [], isLoading = false }: StatsLocationsProps ) => {
	const title = __( 'Locations', 'jetpack-podcast' );
	const metricLabel = __( 'Downloads', 'jetpack-podcast' );

	if ( isLoading ) {
		return <SectionCard title={ title } metricLabel={ metricLabel } isLoading />;
	}

	if ( rows.length === 0 ) {
		return (
			<SectionCard
				title={ title }
				metricLabel={ metricLabel }
				isEmpty
				emptyMessage={ __( 'No country data in this period.', 'jetpack-podcast' ) }
			>
				{ null }
			</SectionCard>
		);
	}

	const data: GeoData = [
		[ __( 'Country', 'jetpack-podcast' ), __( 'Downloads', 'jetpack-podcast' ) ],
		...rows.map( row => [ row.country, row.plays ] as [ string, number ] ),
	];

	return (
		<SectionCard title={ title } metricLabel={ metricLabel } className="podcast-stats-locations">
			<div className="podcast-stats-locations__map">
				<GeoChart data={ data } region="world" height={ 320 } />
			</div>
		</SectionCard>
	);
};

export default StatsLocations;
