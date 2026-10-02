/**
 * External dependencies
 */
import { usePrefetchViewerCountry } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LocationsGeoChart,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	calculateDelta,
	flagUrl,
	getCombinedPeriodMax,
	sharePercentage,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LocationsGeoRow,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
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

// Tab ids owned by the Locations report; `ReportLink` takes a bare string, so
// naming them here is what catches a typo at build time.
type LocationsReportSection = 'countries' | 'regions' | 'cities';

const REPORT_SECTIONS: Record< GeoGranularity, LocationsReportSection > = {
	country: 'countries',
	region: 'regions',
	city: 'cities',
};
const DEFAULT_GEO_GRANULARITY: GeoGranularity = 'country';

// The last level that finished loading, which a drill-down keeps on screen until the next one does.
type SettledLevel = {
	drillKey: string;
	paramsKey: string;
	data: LocationView[];
	hasComparison: boolean;
};

type LocationsInnerProps = {
	geoGranularity: NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
};

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
	let geoMode: GeoMode = geoGranularity;
	if ( drillDownPath ) {
		geoMode = drillDownPath.region ? 'city' : 'region';
	}

	const { data, hasComparison, isLoading, isFetching, isError, refetch } = useLocationViews( {
		reportParams,
		max: WIDGET_ROW_LIMIT,
		geoMode,
		filter: drillDownPath
			? { country: drillDownPath.country.code, region: drillDownPath.region }
			: undefined,
	} );

	const drillKey = JSON.stringify( drillDownPath ?? null );
	const paramsKey = JSON.stringify( reportParams );
	const [ settled, setSettled ] = useState< SettledLevel | null >( null );
	if (
		! isLoading &&
		( settled?.drillKey !== drillKey ||
			settled.paramsKey !== paramsKey ||
			settled.data !== data ||
			settled.hasComparison !== hasComparison )
	) {
		setSettled( { drillKey, paramsKey, data, hasComparison } );
	}
	// Held whole rather than read off `data`: with a comparison, the two queries land separately
	// and mix levels. A params change is not a drill-down and still gets the skeleton.
	const heldLevel =
		isLoading &&
		settled &&
		settled.paramsKey === paramsKey &&
		settled.drillKey !== drillKey &&
		settled.data.length > 0
			? settled
			: null;
	const isDrilling = heldLevel !== null;
	const listData = heldLevel?.data ?? data;
	const listHasComparison = heldLevel?.hasComparison ?? hasComparison;

	// The held level's rows would land on the wrong map, so the map waits empty for the new ones.
	const geoRows = useMemo(
		(): LocationsGeoRow[] =>
			( isDrilling ? [] : data )
				.filter( location => location.countryCode )
				.map( location => ( {
					label: location.label,
					value: location.value,
					countryCode: location.countryCode,
					countryFull: location.countryFull,
					coordinates: location.coordinates,
				} ) ),
		[ data, isDrilling ]
	);

	const leaderboardData = useMemo( () => {
		const getDrillDownAction = ( location: LocationView ) => {
			// The previous level's rows would drill with the new level's mode. Dropping the
			// buttons also unmounts a focused one, which `WidgetState` catches.
			if ( isDrilling || ! location.countryCode ) {
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
			listData.map( location => location.value ),
			listHasComparison ? listData.map( location => location.previousValue ) : []
		);

		return listData.map( location => {
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
					listHasComparison && previousValue !== undefined
						? sharePercentage( previousValue, maxValue )
						: undefined,
				delta:
					listHasComparison && previousValue !== undefined
						? calculateDelta( location.value, previousValue )
						: undefined,
			};
		} ) as LeaderboardChartData;
	}, [ listData, geoMode, listHasComparison, isDrilling, setDrillDownPath ] );

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

	// The back link stays a sibling of <WidgetState> so users can drill back up
	// from an empty or failed drilled view.
	return (
		<div className={ styles.content }>
			{ bodyHeader }
			<div className={ styles.stateArea }>
				<WidgetState
					isLoading={ isLoading && ! isDrilling }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ listData.length === 0 }
					error={ {
						description: __(
							"We couldn't load location data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
				>
					<div className={ styles.chartArea }>
						<div
							className={ styles.leaderboardPanel }
							// React 18 strips a boolean `inert`; the string form is what renders.
							// @ts-expect-error `inert` is not in the React 18 types.
							inert={ isDrilling ? 'true' : undefined }
						>
							<LeaderboardChart
								data={ leaderboardData }
								loading={ isDrilling }
								withOverlayLabel
								withComparison={ listHasComparison }
								showLegend={ false }
								dataFormat={ {
									type: 'number',
									options: { useMultipliers: true, decimals: 0 },
								} }
								className={ styles.leaderboard }
							/>
						</div>
						<div className={ styles.geoChart }>
							<LocationsGeoChart
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
	// `in` would also accept inherited keys such as `toString`, which would then
	// reach the endpoint as a path segment.
	const geoGranularity = Object.prototype.hasOwnProperty.call( REPORT_SECTIONS, storedGranularity )
		? storedGranularity
		: DEFAULT_GEO_GRANULARITY;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				{ /* Keyed so a drill-down picked in one mode never outlives a switch to another. */ }
				<LocationsInner key={ geoGranularity } geoGranularity={ geoGranularity } />
				<WidgetFooter>
					<ReportLink report="locations" section={ REPORT_SECTIONS[ geoGranularity ] } />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
