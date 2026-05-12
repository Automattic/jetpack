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

type SummaryTileProps = {
	heading: string;
	value: string;
	note?: string;
	asCard?: boolean;
};

const SummaryTile = ( { heading, value, note, asCard = true }: SummaryTileProps ) => {
	const content = (
		<>
			<div className="highlight-card-heading">{ heading }</div>
			<div className="highlight-card-count">
				<span className="highlight-card-count-value">{ value }</span>
			</div>
			{ note && <div className="podcast-stats-summary__note">{ note }</div> }
		</>
	);
	const className = 'highlight-card podcast-stats-summary__tile';
	return asCard ? (
		<Card className={ className }>
			<CardBody>{ content }</CardBody>
		</Card>
	) : (
		<div className={ className }>{ content }</div>
	);
};

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

	const tiles = [
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

	const sectionClass = [
		'podcast-stats-summary',
		layout === 'standalone' ? 'highlight-cards' : 'podcast-stats-summary--chart',
	].join( ' ' );

	return (
		<section className={ sectionClass }>
			<div className="highlight-cards-list podcast-stats-summary__list">
				{ tiles.map( tile => (
					<SummaryTile
						key={ tile.heading }
						heading={ tile.heading }
						value={ tile.value }
						note={ tile.note }
						asCard={ layout === 'standalone' }
					/>
				) ) }
			</div>
		</section>
	);
};

export default SummaryTiles;
