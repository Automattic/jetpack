import { GeoChart } from '@automattic/charts';
import { formatNumber } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { formatPct, getCountryName } from '../lib/format';
import HorizontalBarList from './horizontal-bar-list';
import SectionCard from './section-card';
import type { PodcastStatsCountryRow } from '../types';
import type { GeoData } from '@automattic/charts';

type StatsLocationsProps = {
	rows?: PodcastStatsCountryRow[];
	isLoading?: boolean;
};

const StatsLocations = ( { rows = [], isLoading = false }: StatsLocationsProps ) => {
	const title = __( 'By location', 'jetpack-podcast' );

	if ( isLoading ) {
		return <SectionCard title={ title } isLoading />;
	}

	if ( rows.length === 0 ) {
		return (
			<SectionCard
				title={ title }
				isEmpty
				emptyMessage={ __( 'No country data in this period.', 'jetpack-podcast' ) }
			>
				{ null }
			</SectionCard>
		);
	}

	const unknown = __( 'Unknown', 'jetpack-podcast' );
	// GeoChart can't place rows without a country code; bar list keeps them under "Unknown".
	const mapData: GeoData = [
		[ __( 'Country', 'jetpack-podcast' ), __( 'Downloads', 'jetpack-podcast' ) ],
		...rows
			.filter( row => row.country )
			.map( row => [ row.country, row.plays ] as [ string, number ] ),
	];

	const maxValue = rows.reduce( ( max, row ) => Math.max( max, row.plays ), 0 );
	const barData = rows.map( row => {
		const labelText = getCountryName( row.country, unknown );
		return {
			id: row.country || 'unknown',
			label: labelText,
			labelText,
			value: row.plays,
			maxValue,
			formattedValue: sprintf(
				/* translators: 1: localized download count, 2: localized percentage. */
				__( '%1$s · %2$s', 'jetpack-podcast' ),
				formatNumber( row.plays ),
				formatPct( row.pct )
			),
		};
	} );

	return (
		<SectionCard title={ title } className="podcast-stats-locations">
			<div className="podcast-stats-locations__grid">
				<div className="podcast-stats-locations__map">
					<GeoChart data={ mapData } region="world" height={ 480 } />
				</div>
				<div>
					<h4 className="podcast-stats-locations__list-title">
						{ __( 'Top countries', 'jetpack-podcast' ) }
					</h4>
					<HorizontalBarList rows={ barData } />
				</div>
			</div>
		</SectionCard>
	);
};

export default StatsLocations;
