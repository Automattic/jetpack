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
import clsx from 'clsx';
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

/**
 * Locations widget inner component. Reads report params from WidgetRoot context.
 *
 * @param {LocationsAttributes} attributes - The widget attributes.
 * @return The rendered widget content.
 */
function LocationsInner( { max, geoGranularity }: LocationsAttributes ) {
	const { reportParams } = useWidgetRootContext();

	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< { code: string; name: string } >();

	// The "View by" control lives in the widget host header (the
	// `relevance: 'high'` attribute); changing it resets any drill-down.
	useEffect( () => {
		clearSelectedCountry();
	}, [ geoGranularity, clearSelectedCountry ] );

	// City mode disables drill-down; in country mode a selected country switches
	// the report to its regions. City wins while the reset effect above settles.
	const drillMode: GeoMode = selectedCountry ? 'region' : 'country';
	const geoMode: GeoMode = geoGranularity === 'city' ? 'city' : drillMode;

	const { data, comparisonData, hasComparison, isLoading, isFetching, hasData, isError } =
		useLocationViews( {
			reportParams,
			max,
			geoMode,
			countryFilter: selectedCountry?.code,
		} );
	const showLoading = isLoading || ( isFetching && hasData );

	const geoData = useMemo( (): GeoData => {
		const header: GoogleDataTableColumn[] = [
			geoMode === 'city'
				? __( 'Location', 'jetpack-premium-analytics' )
				: __( 'Country', 'jetpack-premium-analytics' ),
			__( 'Views', 'jetpack-premium-analytics' ),
		];
		const rows: GoogleDataTableRow[] = data.map( location => [ location.label, location.value ] );
		return [ header, ...rows ];
	}, [ data, geoMode ] );

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

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	if ( isError ) {
		return (
			<>
				{ backLink }
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>{ __( 'Could not load location data.', 'jetpack-premium-analytics' ) }</Text>
				</Stack>
			</>
		);
	}

	// Explicit empty branch (rather than emptyStateText on LeaderboardChart) keeps the
	// back link visible so users can drill back up from an empty region view.
	if ( ! data.length ) {
		return (
			<>
				{ backLink }
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>
						{ __(
							'Stats on where your visitors are viewing from will appear here.',
							'jetpack-premium-analytics'
						) }
					</Text>
				</Stack>
			</>
		);
	}

	return (
		<>
			{ showLoading && <WidgetLoadingOverlay /> }
			{ backLink }
			<div className={ clsx( styles.chartArea, geoMode === 'city' && styles.noMap ) }>
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

				{ geoMode !== 'city' && (
					<div className={ styles.geoChart }>
						<GeoChart
							data={ geoData }
							resizeDebounceTime={ 100 }
							region={ selectedCountry?.code ?? 'world' }
							resolution={ selectedCountry ? 'provinces' : 'countries' }
						/>
					</div>
				) }
			</div>
		</>
	);
}

/**
 * Locations widget: visitor views by country/region, as a world map plus a
 * leaderboard. Click a country to drill into its regions. Ported from the
 * Jetpack Stats Locations module.
 *
 * @param {LocationsWidgetProps} props - The widget render props.
 * @return The rendered Locations widget.
 */
export default function Locations( { attributes = {} }: LocationsWidgetProps ) {
	const max = attributes?.max ?? 10;
	const geoGranularity = attributes?.geoGranularity ?? 'country';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<LocationsInner max={ max } geoGranularity={ geoGranularity } />
			</div>
		</WidgetRoot>
	);
}
