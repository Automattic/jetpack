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
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
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
 * @param root0     - Component props.
 * @param root0.max - Maximum rows to display.
 * @return The rendered widget content.
 */
function LocationsInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();

	const [ topMode, setTopMode ] = useState< 'country' | 'city' >( 'country' );
	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< { code: string; name: string } >();

	const handleModeChange = useCallback(
		( value: string ) => {
			setTopMode( value as 'country' | 'city' );
			clearSelectedCountry();
		},
		[ clearSelectedCountry ]
	);

	// Drill-down (region) takes priority over topMode; city mode disables drill-down.
	const geoMode: GeoMode = selectedCountry ? 'region' : topMode;

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
			geoMode === 'region' || geoMode === 'city'
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

	const bodyHeader = (
		<Stack direction="row" align="center" className={ styles.bodyHeader }>
			{ backLink }
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'View by', 'jetpack-premium-analytics' ) }
				hideLabelFromVision
				value={ topMode }
				options={ [
					{ label: __( 'Countries', 'jetpack-premium-analytics' ), value: 'country' },
					{ label: __( 'Cities', 'jetpack-premium-analytics' ), value: 'city' },
				] }
				onChange={ handleModeChange }
				className={ styles.modeSelect }
			/>
		</Stack>
	);

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
	// header and "View by" selector visible so users can switch mode or drill back up.
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
			{ bodyHeader }
			{ showLoading && <WidgetLoadingOverlay /> }
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
		</div>
	);
}

/**
 * Locations widget: visitor views by country/region, as a world map plus a
 * leaderboard. Click a country to drill into its regions. Ported from the
 * Jetpack Stats Locations module.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max).
 * @return The rendered Locations widget.
 */
export default function Locations( { attributes = {} }: LocationsWidgetProps ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<LocationsInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
