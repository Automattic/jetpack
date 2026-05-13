import { formatNumber } from '@automattic/number-formatters';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
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
};

type Tile = {
	heading: string;
	value: string;
	note?: string;
};

const SummaryTiles = ( {
	totalPlays,
	byApp = [],
	byCountry = [],
	topDay,
	isLoading = false,
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

	return (
		<div className="podcast-stats-summary">
			{ tiles.map( tile => (
				<VStack
					key={ tile.heading }
					className="podcast-stats-summary__tile"
					spacing={ 1 }
					alignment="topLeft"
				>
					<Heading level={ 4 } size={ 13 } lineHeight="20px" weight={ 500 }>
						{ tile.heading }
					</Heading>
					<Text size={ 28 } lineHeight="36px" truncate>
						{ tile.value }
					</Text>
					{ tile.note && (
						<Text size={ 12 } variant="muted">
							{ tile.note }
						</Text>
					) }
				</VStack>
			) ) }
		</div>
	);
};

export default SummaryTiles;
