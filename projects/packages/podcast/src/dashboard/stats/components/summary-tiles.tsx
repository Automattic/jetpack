import { formatNumber } from '@automattic/number-formatters';
import { Card, CardBody } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatAppName, formatPct, formatPodcastDate, getCountryName } from '../lib/format';
import type { PodcastStatsAppRow, PodcastStatsCountryRow, PodcastStatsTopDay } from '../types';

const EMPTY_VALUE = '-';

type SummaryTilesProps = {
	totalPlays?: number | null;
	byApp?: PodcastStatsAppRow[];
	byCountry?: PodcastStatsCountryRow[];
	topDay?: PodcastStatsTopDay | null;
	isLoading?: boolean;
	// When 'chart', tiles render as a flat divided row inside the Downloads
	// card. When 'standalone', each tile is its own Card.
	layout?: 'standalone' | 'chart';
};

type Tile = {
	heading: string;
	value: string;
	note?: string;
};

const TileContent = ( { heading, value, note }: Tile ) => (
	<>
		<div className="podcast-stats-summary__heading">{ heading }</div>
		<div className="podcast-stats-summary__value">{ value }</div>
		{ note && <div className="podcast-stats-summary__note">{ note }</div> }
	</>
);

const SummaryTiles = ( {
	totalPlays,
	byApp = [],
	byCountry = [],
	topDay,
	isLoading = false,
	layout = 'standalone',
}: SummaryTilesProps ) => {
	const topApp = byApp[ 0 ];
	const topCountry = byCountry[ 0 ];
	const loadingValue = isLoading ? EMPTY_VALUE : null;
	const unknownCountry = __( 'Unknown', 'jetpack-podcast' );

	const formatNameAndPct = ( name: string, pct: number ) =>
		sprintf(
			/* translators: 1: app or country name, 2: localized percentage. */
			__( '%1$s %2$s', 'jetpack-podcast' ),
			name,
			formatPct( pct )
		);

	const tiles: Tile[] = [
		{
			heading: __( 'Total downloads', 'jetpack-podcast' ),
			value: loadingValue ?? formatNumber( totalPlays ?? 0 ),
		},
		{
			heading: __( 'Top app', 'jetpack-podcast' ),
			value:
				loadingValue ??
				( topApp ? formatNameAndPct( formatAppName( topApp.app ), topApp.pct ) : EMPTY_VALUE ),
		},
		{
			heading: __( 'Top country', 'jetpack-podcast' ),
			value:
				loadingValue ??
				( topCountry
					? formatNameAndPct( getCountryName( topCountry.country, unknownCountry ), topCountry.pct )
					: EMPTY_VALUE ),
		},
		{
			heading: __( 'Top day', 'jetpack-podcast' ),
			value: loadingValue ?? ( topDay ? formatPodcastDate( topDay.date ) : EMPTY_VALUE ),
			note:
				! loadingValue && topDay
					? sprintf(
							/* translators: %s is the localized download count. */
							_n( '%s download', '%s downloads', topDay.plays, 'jetpack-podcast' ),
							formatNumber( topDay.plays )
					  )
					: undefined,
		},
	];

	if ( layout === 'chart' ) {
		return (
			<ul className="podcast-stats-summary podcast-stats-summary--chart">
				{ tiles.map( tile => (
					<li key={ tile.heading } className="podcast-stats-summary__tile">
						<TileContent { ...tile } />
					</li>
				) ) }
			</ul>
		);
	}

	return (
		<section className="podcast-stats-summary podcast-stats-summary--standalone">
			{ tiles.map( tile => (
				<Card key={ tile.heading } className="podcast-stats-summary__tile">
					<CardBody>
						<TileContent { ...tile } />
					</CardBody>
				</Card>
			) ) }
		</section>
	);
};

export default SummaryTiles;
