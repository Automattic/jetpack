import { formatNumber } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { formatAppName, formatPct } from '../lib/format';
import HorizontalBarList from './horizontal-bar-list';
import SectionCard from './section-card';
import type { PodcastStatsAppRow } from '../types';

type StatsByAppProps = {
	rows?: PodcastStatsAppRow[];
	isLoading?: boolean;
};

const StatsByApp = ( { rows = [], isLoading = false }: StatsByAppProps ) => {
	const title = __( 'By app', 'jetpack-podcast' );

	if ( isLoading ) {
		return <SectionCard title={ title } isLoading />;
	}

	if ( rows.length === 0 ) {
		return (
			<SectionCard
				title={ title }
				isEmpty
				emptyMessage={ __( 'No app data in this period.', 'jetpack-podcast' ) }
			>
				{ null }
			</SectionCard>
		);
	}

	const maxValue = rows.reduce( ( max, row ) => Math.max( max, row.plays ), 0 );
	const data = rows.map( row => {
		const labelText = formatAppName( row.app );
		return {
			id: row.app,
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
		<SectionCard title={ title }>
			<HorizontalBarList rows={ data } />
		</SectionCard>
	);
};

export default StatsByApp;
