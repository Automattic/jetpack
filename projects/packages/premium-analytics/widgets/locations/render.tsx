/**
 * External dependencies
 */
import { isStatsFeatureLocked, usePrefetchViewerCountry } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LOCATIONS_GEO_MODES,
	LocationsGeoChart,
	LockedWidget,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	calculateDelta,
	flagUrl,
	getCombinedPeriodMax,
	getLocationsReportSection,
	getLocationsSectionLabel,
	locationsCsvExporter,
	sharePercentage,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LocationsGeoRow,
	type LocationsScope,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Disabled } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import styles from './style.module.css';
import useHeldLevel from './use-held-level';
import useLocationViews, { type GeoMode, type LocationView } from './use-location-views';
import { type LocationsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type LocationsRenderAttributes = LocationsAttributes & Partial< ReportParamsFieldAttributes >;
type LocationsWidgetProps = WidgetRenderProps< LocationsRenderAttributes >;
type DrillDownCountry = { code: string; name: string };

type GeoGranularity = NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
// A region is only meaningful inside its country, so the path always carries both.
type LocationsDrillDown = {
	country: DrillDownCountry;
	region?: string;
};

const DEFAULT_GEO_GRANULARITY: GeoGranularity = 'country';

type LocationsInnerProps = {
	geoGranularity: NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
};

/** The level a drill-down depth lists: depth 1 is a country's regions, depth 2 a region's cities. */
function getLevelMode( depth: number, geoGranularity: GeoGranularity ): GeoMode {
	return depth === 0 ? geoGranularity : ( [ 'region', 'city' ] as const )[ depth - 1 ];
}

/**
 * Locations widget inner component. Reads report params from WidgetRoot
 * context. Attributes arrive already normalized by the outer component, so
 * defaults are applied in exactly one place.
 */
function LocationsInner( { geoGranularity }: LocationsInnerProps ) {
	// Below `WidgetRoot`, which provides the query client.
	usePrefetchViewerCountry();
	const { reportParams } = useWidgetRootContext();

	const {
		drillDownItem: drillDownPath,
		drillDown: setDrillDownPath,
		resetDrillDown,
	} = useWidgetDrillDown< LocationsDrillDown >();

	const focusCountry = drillDownPath?.country;
	let drillDepth = 0;
	if ( drillDownPath ) {
		drillDepth = drillDownPath.region ? 2 : 1;
	}
	const geoMode = getLevelMode( drillDepth, geoGranularity );

	const scope = useMemo(
		(): LocationsScope | undefined =>
			drillDownPath
				? { country: drillDownPath.country.code, region: drillDownPath.region }
				: undefined,
		[ drillDownPath ]
	);

	const views = useLocationViews( {
		reportParams,
		max: WIDGET_ROW_LIMIT,
		geoMode,
		filter: scope,
	} );

	const { isLoading, isFetching, isError, refetch } = views;
	const {
		data,
		hasComparison,
		isHeld,
		drillDepth: shownDepth,
	} = useHeldLevel( { ...views, drillDepth, reportParams } );
	const rowsLabel = getLocationsSectionLabel(
		getLocationsReportSection( getLevelMode( shownDepth, geoGranularity ) )
	);
	const emptyState = useNoViewsEmptyState(
		{ isLoading: isLoading && ! isHeld, isError, isEmpty: data.length === 0 },
		__( 'You don’t have locations recorded yet.', 'jetpack-premium-analytics-pkg' )
	);

	const csvExporter = useMemo(
		() => locationsCsvExporter( getLocationsReportSection( geoMode ), scope ),
		[ geoMode, scope ]
	);

	// The held level's rows would land on the wrong map, so the map waits empty for the new ones.
	const geoRows = useMemo(
		(): LocationsGeoRow[] =>
			( isHeld ? [] : data )
				.filter( location => location.countryCode )
				.map( location => ( {
					label: location.label,
					value: location.value,
					countryCode: location.countryCode,
					countryFull: location.countryFull,
					coordinates: location.coordinates,
				} ) ),
		[ data, isHeld ]
	);

	const regionsLocked = isStatsFeatureLocked( 'regions-cities' );

	const leaderboardData = useMemo( () => {
		const getDrillDownAction = ( location: LocationView ) => {
			// The previous level's rows would drill with the new level's mode. Dropping the
			// buttons also unmounts a focused one, which `WidgetState` catches.
			if ( isHeld || ! location.countryCode || regionsLocked ) {
				return { kind: 'static' as const };
			}

			const country = { code: location.countryCode, name: location.countryFull };

			if ( geoMode === 'country' ) {
				return {
					kind: 'drillDown' as const,
					onClick: () => setDrillDownPath( { country } ),
					ariaLabel: sprintf(
						/* translators: %s is the country name */
						__( 'View regions in %s', 'jetpack-premium-analytics-pkg' ),
						location.countryFull
					),
				};
			}

			if ( geoMode === 'region' ) {
				return {
					kind: 'drillDown' as const,
					onClick: () => setDrillDownPath( { country, region: location.label } ),
					ariaLabel: sprintf(
						/* translators: %s is the region name, such as a state or province. */
						__( 'View cities in %s', 'jetpack-premium-analytics-pkg' ),
						location.label
					),
				};
			}

			return { kind: 'static' as const };
		};

		const maxValue = getCombinedPeriodMax(
			data.map( location => location.value ),
			hasComparison ? data.map( location => location.previousValue ) : []
		);

		return data.map( location => {
			const imageUrl = flagUrl( location.countryCode );
			const previousValue = location.previousValue;

			return {
				id: location.key,
				...buildLeaderboardRow( {
					label: location.label,
					media: {
						kind: 'flag',
						url: imageUrl ?? undefined,
						country: location.countryFull,
					},
					action: getDrillDownAction( location ),
				} ),
				currentValue: location.value,
				previousValue,
				currentShare: sharePercentage( location.value, maxValue ),
				previousShare:
					hasComparison && previousValue !== undefined
						? sharePercentage( previousValue, maxValue )
						: undefined,
				delta:
					hasComparison && previousValue !== undefined
						? calculateDelta( location.value, previousValue )
						: undefined,
			};
		} ) as LeaderboardChartData;
	}, [ data, geoMode, hasComparison, isHeld, regionsLocked, setDrillDownPath ] );

	// From a Countries-mode region, Back returns to that country's regions.
	const parentCountry =
		drillDownPath?.region && geoGranularity === 'country' ? drillDownPath.country : null;
	const goBack = useCallback( () => {
		if ( parentCountry ) {
			setDrillDownPath( { country: parentCountry } );
		} else {
			resetDrillDown();
		}
	}, [ parentCountry, resetDrillDown, setDrillDownPath ] );

	// The back link names only where it goes, and a region can share its only city's
	// name (Tokyo), so the current level is named too or the drill looks like a no-op.
	const trail = drillDownPath ? (
		<WidgetBackLink
			label={ parentCountry?.name ?? __( 'All locations', 'jetpack-premium-analytics-pkg' ) }
			ariaLabel={
				parentCountry
					? sprintf(
							/* translators: %s is the country name */
							__( 'View regions in %s', 'jetpack-premium-analytics-pkg' ),
							parentCountry.name
						)
					: __( 'View all locations', 'jetpack-premium-analytics-pkg' )
			}
			onClick={ goBack }
			current={ drillDownPath.region ?? drillDownPath.country.name }
			className={ styles.trail }
		/>
	) : null;

	const bodyHeader = trail ? (
		<Stack direction="row" align="center" className={ styles.bodyHeader }>
			{ trail }
		</Stack>
	) : null;

	const chartTitle = __( 'Top locations', 'jetpack-premium-analytics-pkg' );

	// View all opens the whole tab; only the download follows the drill-down.
	useReportActions( {
		report: 'locations',
		section: getLocationsReportSection( geoGranularity ),
		csv: {
			exporter: csvExporter,
			status: { isLoading, isFetching, isError },
			rowCount: data.length,
		},
	} );

	// The back link stays a sibling of <WidgetState> so users can drill back up
	// from an empty or failed drilled view.
	return (
		<div className={ styles.content }>
			{ bodyHeader }
			<div className={ styles.stateArea }>
				<WidgetState
					isLoading={ emptyState.isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load location data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ emptyState.empty }
				>
					<div className={ styles.chartArea }>
						<Disabled isDisabled={ isHeld } className={ styles.leaderboardPanel }>
							<LeaderboardChart
								data={ leaderboardData }
								loading={ isHeld }
								withOverlayLabel
								withComparison={ hasComparison }
								showLegend={ false }
								columns={ { label: rowsLabel, metric: 'views' } }
								dataFormat={ {
									type: 'number',
									options: { useMultipliers: true, decimals: 0 },
								} }
								className={ styles.leaderboard }
								chartTitle={ chartTitle }
							/>
						</Disabled>
						<div className={ styles.geoChart }>
							<LocationsGeoChart
								chartTitle={ chartTitle }
								rows={ geoRows }
								mode={ geoMode }
								focusCountry={ focusCountry }
								resizeDebounceTime={ 100 }
							/>
						</div>
					</div>
				</WidgetState>
			</div>
		</div>
	);
}

/**
 * Locations widget: visitor views by country/region/city, as a map plus a
 * leaderboard. Click a country to drill into its regions, and a region into its
 * cities. Ported from the Jetpack Stats Locations module.
 */
export default function Locations( { attributes = {} }: LocationsWidgetProps ) {
	// A persisted layout can carry a granularity this widget no longer knows, and
	// it becomes both an endpoint path segment and a report tab.
	const storedGranularity = attributes?.geoGranularity ?? DEFAULT_GEO_GRANULARITY;
	const geoGranularity = ( Object.values( LOCATIONS_GEO_MODES ) as string[] ).includes(
		storedGranularity
	)
		? storedGranularity
		: DEFAULT_GEO_GRANULARITY;

	// Regions and cities are paid on plans that keep countries; without countries the whole widget locks.
	if ( geoGranularity !== 'country' && isStatsFeatureLocked( 'regions-cities' ) ) {
		return (
			<WidgetRoot attributes={ attributes }>
				<LockedWidget feature="regions-cities" />
			</WidgetRoot>
		);
	}

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				{ /* Keyed so a drill-down picked in one mode never outlives a switch to another. */ }
				<LocationsInner key={ geoGranularity } geoGranularity={ geoGranularity } />
			</div>
		</WidgetRoot>
	);
}
