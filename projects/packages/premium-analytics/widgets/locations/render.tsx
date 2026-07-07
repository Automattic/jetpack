/**
 * External dependencies
 */
import {
	GeoChart,
	LeaderboardChart,
	LeaderboardLabel,
	WidgetBackLink,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	flagUrl,
	useWidgetDrillDown,
	useWidgetRootContext,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
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

// Google GeoChart does not provide province-level maps for every country/territory.
// Keep this list conservative so unsupported country maps fall back to highlighting
// the selected country on the world map instead of rendering a chart error.
const SUPPORTED_PROVINCE_MAP_COUNTRY_CODES = new Set( [
	'AU',
	'BR',
	'CA',
	'CN',
	'DE',
	'ES',
	'FR',
	'GB',
	'IN',
	'IT',
	'JP',
	'MX',
	'RU',
	'US',
] );

function supportsProvinceMap( countryCode?: string ) {
	return !! countryCode && SUPPORTED_PROVINCE_MAP_COUNTRY_CODES.has( countryCode.toUpperCase() );
}

/**
 * Locations widget inner component. Reads report params from WidgetRoot context.
 *
 * @param root0         - Component props.
 * @param root0.max     - Maximum rows to display.
 * @param root0.topMode - Top-level location mode selected by the host toolbar.
 * @return The rendered widget content.
 */
function LocationsInner( { max, topMode }: { max: number; topMode: 'country' | 'city' } ) {
	const { reportParams } = useWidgetRootContext();

	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< { code: string; name: string } >();

	useEffect( () => {
		if ( topMode === 'city' ) {
			clearSelectedCountry();
		}
	}, [ clearSelectedCountry, topMode ] );

	// Drill-down (region) takes priority over topMode; city mode disables drill-down.
	const geoMode: GeoMode = topMode === 'country' && selectedCountry ? 'region' : topMode;

	const { data, comparisonData, hasComparison, isLoading, isFetching, hasData, isError } =
		useLocationViews( {
			reportParams,
			max,
			geoMode,
			countryFilter: selectedCountry?.code,
		} );
	const showLoading = isLoading || ( isFetching && hasData );
	const useProvinceMap = geoMode === 'region' && supportsProvinceMap( selectedCountry?.code );
	const useCountryFallbackMap = geoMode === 'region' && !! selectedCountry && ! useProvinceMap;
	const useMarkerMap = geoMode === 'city';

	const geoData = useMemo( (): GeoData => {
		const useLocationHeader =
			( geoMode === 'region' && ! useCountryFallbackMap ) || geoMode === 'city';
		const header: GoogleDataTableColumn[] = [
			useLocationHeader
				? __( 'Location', 'jetpack-premium-analytics' )
				: __( 'Country', 'jetpack-premium-analytics' ),
			__( 'Views', 'jetpack-premium-analytics' ),
		];

		if ( useCountryFallbackMap && selectedCountry ) {
			const value = data.reduce( ( total, location ) => total + location.value, 0 );
			const countryCode = selectedCountry.code.toUpperCase();
			return [
				header,
				[ { v: countryCode, f: selectedCountry.name }, value ],
			];
		}

		const rows: GoogleDataTableRow[] = data.map( location => [
			useMarkerMap ? `${ location.label }, ${ location.countryFull }` : location.label,
			location.value,
		] );
		return [ header, ...rows ];
	}, [ data, geoMode, selectedCountry, useCountryFallbackMap, useMarkerMap ] );

	const leaderboardData = useMemo( () => {
		const maxValue = Math.max( ...data.map( l => l.value ), 0 );
		const maxComparisonValue = Math.max( ...comparisonData.map( l => l.value ), 0 );
		const comparisonMap = new Map(
			comparisonData.map( location => [ location.key, location.value ] )
		);

		return data.map( location => {
			const imageUrl = flagUrl( location.countryCode );
			const previousValue = hasComparison ? comparisonMap.get( location.key ) ?? 0 : 0;

			return {
				id: location.key,
				label: (
					<div className={ styles.leaderboardLabel }>
						<LeaderboardLabel
							label={ location.label }
							imageUrl={ imageUrl ?? undefined }
							imageAlt={ sprintf(
								/* translators: %s is the country name */
								__( 'Flag of %s', 'jetpack-premium-analytics' ),
								location.countryFull
							) }
							imageClassName={ styles.leaderboardImage }
						/>
					</div>
				),
				currentValue: location.value,
				previousValue,
				currentShare: maxValue > 0 ? ( location.value / maxValue ) * 100 : 0,
				previousShare:
					hasComparison && maxComparisonValue > 0
						? ( previousValue / maxComparisonValue ) * 100
						: 0,
				delta: hasComparison ? calculateDelta( location.value, previousValue ) : 0,
				// Country mode: click to drill into regions.
				// Region/city mode: rows are not interactive.
				...( geoMode === 'country' &&
					location.countryCode && {
						onClick: () =>
							selectCountry( { code: location.countryCode, name: location.countryFull } ),
						// Without ariaLabel the button's accessible name is computed from
						// its children: "Flag of X" (image alt) + "X" (visible label) →
						// screen readers announce the country name twice. Provide a concise
						// action label that replaces the computed name.
						ariaLabel: sprintf(
							/* translators: %s is the country name */
							__( 'View regions in %s', 'jetpack-premium-analytics' ),
							location.countryFull
						),
					} ),
			};
		} ) as LeaderboardChartData;
	}, [ comparisonData, data, geoMode, hasComparison, selectCountry ] );

	const backLink = selectedCountry ? (
		<WidgetBackLink
			label={ __( 'All Locations', 'jetpack-premium-analytics' ) }
			ariaLabel={ __( 'View all locations', 'jetpack-premium-analytics' ) }
			onClick={ clearSelectedCountry }
			className={ styles.backLink }
		/>
	) : null;

	const bodyHeader = backLink ? (
		<Stack direction="row" align="center" className={ styles.bodyHeader }>
			{ backLink }
		</Stack>
	) : null;

	if ( isLoading && data.length === 0 ) {
		return (
			<div className={ styles.content }>
				{ bodyHeader }
				<WidgetLoadingOverlay />
			</div>
		);
	}

	if ( isError ) {
		return (
			<div className={ styles.content }>
				{ bodyHeader }
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>{ __( 'Could not load location data.', 'jetpack-premium-analytics' ) }</Text>
				</Stack>
			</div>
		);
	}

	// Explicit empty branch (rather than emptyStateText on LeaderboardChart) keeps the
	// breadcrumb visible so users can drill back up.
	if ( ! data.length ) {
		return (
			<div className={ styles.content }>
				{ bodyHeader }
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>
						{ __(
							'Stats on where your visitors are viewing from will appear here.',
							'jetpack-premium-analytics'
						) }
					</Text>
				</Stack>
			</div>
		);
	}

	return (
		<div className={ styles.content }>
			{ showLoading && <WidgetLoadingOverlay /> }
			<div className={ styles.chartArea }>
				<div className={ styles.leaderboardPanel }>
					{ bodyHeader }
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
					<GeoChart
						data={ geoData }
						resizeDebounceTime={ 100 }
						region={ useProvinceMap ? selectedCountry?.code ?? 'world' : 'world' }
						resolution={ useProvinceMap ? 'provinces' : 'countries' }
						displayMode={ useMarkerMap ? 'markers' : undefined }
					/>
				</div>
			</div>
		</div>
	);
}

/**
 * Locations widget: visitor views by country/region/city, as a map plus a
 * leaderboard. Click a country to drill into its regions. Ported from the
 * Jetpack Stats Locations module.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes.
 * @return The rendered Locations widget.
 */
export default function Locations( { attributes = {} }: LocationsWidgetProps ) {
	const max = attributes?.max ?? 10;
	const topMode = attributes?.geoMode === 'city' ? 'city' : 'country';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<LocationsInner max={ max } topMode={ topMode } />
			</div>
		</WidgetRoot>
	);
}
