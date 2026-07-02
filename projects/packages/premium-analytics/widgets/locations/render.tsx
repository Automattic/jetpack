/**
 * External dependencies
 */
import { GeoChart } from '@automattic/charts';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	flagUrl,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useLocationViews, { type GeoMode } from './use-location-views';
import widgetDefinition, { type LocationsAttributes } from './widget';
/**
 * Types
 */
import type { GeoData, GoogleDataTableColumn, GoogleDataTableRow } from '@automattic/charts';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type LocationsRenderAttributes = LocationsAttributes & Partial< ReportParamsFieldAttributes >;
type LocationsWidgetProps = WidgetRenderProps< LocationsRenderAttributes >;

function LocationsHeaderTitle() {
	return (
		<span className={ styles.headerTitle }>
			<Icon icon={ widgetDefinition.icon } size={ 20 } className={ styles.headerIcon } />
			<span>{ __( 'Locations', 'jetpack-premium-analytics' ) }</span>
		</span>
	);
}

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
	const [ selectedCountry, setSelectedCountry ] = useState< { code: string; name: string } | null >(
		null
	);

	const clearSelectedCountry = useCallback( () => setSelectedCountry( null ), [] );

	const handleModeChange = useCallback( ( value: string ) => {
		setTopMode( value as 'country' | 'city' );
		setSelectedCountry( null );
	}, [] );

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
							setSelectedCountry( { code: location.countryCode, name: location.countryFull } ),
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
	}, [ comparisonData, data, geoMode, hasComparison ] );

	const header = (
		<Stack direction="row" justify="space-between" align="center" className={ styles.widgetHeader }>
			<Stack direction="row" align="center" gap="xs" className={ styles.breadcrumb }>
				{ selectedCountry ? (
					<>
						<Button
							variant="unstyled"
							onClick={ clearSelectedCountry }
							className={ styles.breadcrumbLink }
						>
							<LocationsHeaderTitle />
						</Button>
						<Text className={ styles.breadcrumbSeparator }>/</Text>
						<Text className={ styles.breadcrumbCurrent }>{ selectedCountry.name }</Text>
					</>
				) : (
					<Text className={ styles.breadcrumbTitle }>
						<LocationsHeaderTitle />
					</Text>
				) }
			</Stack>
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
			<>
				{ header }
				<div className={ styles.content }>
					<WidgetLoadingOverlay />
				</div>
			</>
		);
	}

	if ( isError ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>{ __( 'Could not load location data.', 'jetpack-premium-analytics' ) }</Text>
					</Stack>
				</div>
			</>
		);
	}

	// Explicit empty branch (rather than emptyStateText on LeaderboardChart) keeps the
	// header breadcrumb and "View by" selector visible so users can switch mode or drill
	// back up — consistent with the pattern used when chart chrome must remain interactive.
	if ( ! data.length ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>
							{ __(
								'Stats on where your visitors are viewing from will appear here.',
								'jetpack-premium-analytics'
							) }
						</Text>
					</Stack>
				</div>
			</>
		);
	}

	return (
		<>
			{ header }
			<div className={ styles.content }>
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
		</>
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
