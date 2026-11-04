/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { WIDGET_ROW_LIMIT } from '../../constants/rows';
import { LeaderboardChart } from '../chart-leaderboard/leaderboard-chart';
import { LeaderboardSkeleton } from '../chart-leaderboard/leaderboard-skeleton';
import { buildLeaderboardChartData } from '../leaderboard/build-leaderboard-chart-data';
import { LocationsGeoChart } from '../locations-geo-chart';
import {
	WidgetState,
	resolveWidgetStateError,
	type WidgetStateEmpty,
	type WidgetStateError,
} from '../widget-state';
import {
	buildLocationsData,
	type LocationRowInput,
	type LocationsCountry,
} from './build-locations-data';
import styles from './locations.module.scss';
import type { DataFormat, WidgetStatus } from '../../types';

type LocationsProps = {
	/**
	 * The ranking, in display order: countries, or the regions of `country`. The map draws them
	 * all, the list the first `maxRows`.
	 */
	rows: readonly LocationRowInput[];
	/**
	 * Request state, from the widget's data hook.
	 */
	status: WidgetStatus;
	/**
	 * Error copy and actions, as `describeError()` builds them. Omit for the generic
	 * message with a Retry bound to `status.refetch`.
	 */
	error?: WidgetStateError;
	/**
	 * A widget's own empty state; omit for the generic one.
	 */
	empty?: WidgetStateEmpty;
	/**
	 * Format of the figures. Defaults to compact integers.
	 */
	format?: DataFormat;
	/**
	 * What the figure is, as the map tooltip names it: "Views", "Store visitors".
	 */
	valueLabel: string;
	/**
	 * The country the rows are regions of. Omit for countries on the world map.
	 */
	country?: LocationsCountry;
	/**
	 * Rows the list shows, and the skeleton's height. Defaults to the widget row limit.
	 */
	maxRows?: number;
	/** What the widget shows, such as its title; the list is named "Chart: <title>" and the map "Map: <title>". */
	chartTitle?: string;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A locations widget body: the ranked list with a flag, share and delta per location beside
 * the map that places them, and the loading, error and empty states. Renders inside
 * `WidgetRoot`.
 *
 * @param {LocationsProps} props - The props for the Locations component.
 * @return {JSX.Element} The Locations component.
 */
export function Locations( {
	rows,
	status,
	error,
	empty,
	format = DEFAULT_FORMAT,
	valueLabel,
	country,
	maxRows = WIDGET_ROW_LIMIT,
	chartTitle,
}: LocationsProps ): JSX.Element {
	const { isLoading, isFetching, isError, refetch } = status;
	const hasComparison = !! status.hasComparison;

	const data = useMemo(
		() => buildLocationsData( rows, { country, hasComparison, maxRows } ),
		[ rows, country, hasComparison, maxRows ]
	);
	const listData = useMemo(
		() => buildLeaderboardChartData( data.rows, { maxRows } ),
		[ data, maxRows ]
	);
	const errorState = useMemo( () => resolveWidgetStateError( error, refetch ), [ error, refetch ] );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ !! isError }
				isEmpty={ rows.length === 0 }
				error={ errorState }
				empty={ empty }
				renderLoading={ <LeaderboardSkeleton rows={ maxRows } /> }
			>
				<div className={ styles.container }>
					<LeaderboardChart
						data={ listData }
						withOverlayLabel
						withComparison={ data.comparing }
						showLegend={ false }
						dataFormat={ format }
						className={ styles.list }
						chartTitle={ chartTitle }
					/>

					<Stack justify="center" align="center" className={ styles.map }>
						<LocationsGeoChart
							rows={ data.geoRows }
							mode={ data.geoMode }
							focusCountry={ data.focusCountry }
							valueLabel={ valueLabel }
							resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
							chartTitle={ chartTitle }
						/>
					</Stack>
				</div>
			</WidgetState>
		</div>
	);
}
