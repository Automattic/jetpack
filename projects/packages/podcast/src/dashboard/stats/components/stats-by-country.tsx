import { formatNumber } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { formatPct, getCountryName } from '../lib/format';
import HorizontalBarList from './horizontal-bar-list';
import SectionCard from './section-card';
import type { PodcastStatsCountryRow } from '../types';

type StatsByCountryProps = {
	rows?: PodcastStatsCountryRow[];
	isLoading?: boolean;
};

const StatsByCountry = ( { rows = [], isLoading = false }: StatsByCountryProps ) => {
	const title = __( 'By country', 'jetpack-podcast' );
	const metricLabel = __( 'Downloads', 'jetpack-podcast' );
	const unknown = __( 'Unknown', 'jetpack-podcast' );

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

	const maxValue = rows.reduce( ( max, row ) => Math.max( max, row.plays ), 0 );
	const data = rows.map( row => {
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
		<SectionCard title={ title } metricLabel={ metricLabel }>
			<HorizontalBarList rows={ data } />
		</SectionCard>
	);
};

export default StatsByCountry;
