/**
 * External dependencies
 */
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
import { location as locationIcon } from '@jetpack-premium-analytics/icons';
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useLocationViews, { type GeoMode } from './use-location-views';
import { type LocationsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type LocationsRenderAttributes = LocationsAttributes & Partial< ReportParamsFieldAttributes >;
type LocationsWidgetProps = WidgetRenderProps< LocationsRenderAttributes >;
type DrillDownCountry = { code: string; name: string };

type GeoGranularity = NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
// Tab ids owned by the Locations report; `ReportLink` takes a bare string, so
// naming them here is what catches a typo at build time.
type LocationsReportSection = 'countries' | 'regions' | 'cities';

const REPORT_SECTIONS: Record< GeoGranularity, LocationsReportSection > = {
	country: 'countries',
	region: 'regions',
	city: 'cities',
};
const DEFAULT_GEO_GRANULARITY: GeoGranularity = 'country';

type LocationsInnerProps = {
	geoGranularity: NonNullable< LocationsAttributes[ 'geoGranularity' ] >;
};

/**
 * Locations widget inner component. Reads report params from WidgetRoot
 * context. Attributes arrive already normalized by the outer component, so
 * defaults are applied in exactly one place.
 */
function LocationsInner( { geoGranularity }: LocationsInnerProps ) {
	const { reportParams } = useWidgetRootContext();

	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< DrillDownCountry >();

	// Only Countries mode drills down, so leaving it would strand a selected
	// country the user can no longer clear.
	useEffect( () => {
		if ( geoGranularity !== 'country' ) {
			clearSelectedCountry();
		}
	}, [ clearSelectedCountry, geoGranularity ] );

	const activeSelectedCountry = geoGranularity === 'country' ? selectedCountry : undefined;
	const geoMode: GeoMode =
		geoGranularity === 'country' && activeSelectedCountry ? 'region' : geoGranularity;

	const { data, hasComparison, isLoading, isFetching, isError, refetch } = useLocationViews( {
		reportParams,
		max: WIDGET_ROW_LIMIT,
		geoMode,
		countryFilter: activeSelectedCountry?.code,
	} );

	const geoRows = useMemo(
		(): LocationsGeoRow[] =>
			data.map( location => ( {
				label: location.label,
				value: location.value,
				countryCode: location.countryCode,
				countryFull: location.countryFull,
			} ) ),
		[ data ]
	);

	const leaderboardData = useMemo( () => {
		const maxValue = getCombinedPeriodMax(
			data.map( location => location.value ),
			hasComparison ? data.map( location => location.previousValue ) : []
		);

		return data.map( location => {
			const imageUrl = flagUrl( location.countryCode );
			const previousValue = location.previousValue;
			const countryCode = location.countryCode;

			return {
				id: location.key,
				...buildLeaderboardRow( {
					label: location.label,
					media: {
						kind: 'flag',
						url: imageUrl ?? undefined,
						country: location.countryFull,
					},
					action:
						geoMode === 'country' && countryCode
							? {
									kind: 'drillDown',
									onClick: () =>
										selectCountry( {
											code: countryCode,
											name: location.countryFull,
										} ),
									ariaLabel: sprintf(
										/* translators: %s is the country name */
										__( 'View regions in %s', 'jetpack-premium-analytics-pkg' ),
										location.countryFull
									),
							  }
							: { kind: 'static' },
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
	}, [ data, geoMode, hasComparison, selectCountry ] );

	const backLink = activeSelectedCountry ? (
		<WidgetBackLink
			label={ __( 'All locations', 'jetpack-premium-analytics-pkg' ) }
			ariaLabel={ __( 'View all locations', 'jetpack-premium-analytics-pkg' ) }
			onClick={ clearSelectedCountry }
			className={ styles.backLink }
		/>
	) : null;

	const bodyHeader = backLink ? (
		<Stack direction="row" align="center" className={ styles.bodyHeader }>
			{ backLink }
		</Stack>
	) : null;

	// The back link stays a sibling of <WidgetState> so users can drill back up
	// from an empty or failed region view.
	return (
		<div className={ styles.content }>
			{ bodyHeader }
			<div className={ styles.stateArea }>
				<WidgetState
					isLoading={ isLoading }
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
					empty={ {
						icon: locationIcon,
						description: __( 'No location data in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
				>
					<div className={ styles.chartArea }>
						<div className={ styles.leaderboardPanel }>
							<LeaderboardChart
								data={ leaderboardData }
								withOverlayLabel
								withComparison={ hasComparison }
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
								focusCountry={ activeSelectedCountry }
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
 * leaderboard. Click a country to drill into its regions. Ported from the
 * Jetpack Stats Locations module.
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
				<LocationsInner geoGranularity={ geoGranularity } />
				<WidgetFooter>
					<ReportLink report="locations" section={ REPORT_SECTIONS[ geoGranularity ] } />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
