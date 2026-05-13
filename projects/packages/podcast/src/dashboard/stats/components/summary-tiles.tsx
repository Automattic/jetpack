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

	const tiles: Tile[] = [
		{
			heading: __( 'Total downloads', 'jetpack-podcast' ),
			value: loadingValue ?? formatNumber( totalPlays ?? 0 ),
		},
		{
			heading: __( 'Top app', 'jetpack-podcast' ),
			value: loadingValue ?? ( topApp ? formatAppName( topApp.app ) : EMPTY_VALUE ),
			note: ! loadingValue && topApp ? formatPct( topApp.pct ) : undefined,
		},
		{
			heading: __( 'Top country', 'jetpack-podcast' ),
			value:
				loadingValue ??
				( topCountry ? getCountryName( topCountry.country, unknownCountry ) : EMPTY_VALUE ),
			note: ! loadingValue && topCountry ? formatPct( topCountry.pct ) : undefined,
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
			<ul className="podcast-stats-summary">
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
