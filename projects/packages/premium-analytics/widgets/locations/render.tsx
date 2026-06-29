/**
 * External dependencies
 */
import { GeoChart } from '@automattic/charts';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetRoot,
	flagUrl,
	useWidgetRootContext,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useLocationViews, { type GeoMode } from './use-location-views';
/**
 * Types
 */
import type { GeoData, GoogleDataTableColumn, GoogleDataTableRow } from '@automattic/charts';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

interface LocationsAttributes {
	max?: number;
}

/**
 * Locations widget inner component. Reads report params from WidgetRoot context.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max).
 * @return The rendered widget content.
 */
function LocationsInner( { attributes }: WidgetRenderProps< LocationsAttributes > ) {
	const { reportParams } = useWidgetRootContext();
	const max = attributes?.max ?? 10;

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

	const { data, isLoading, isError } = useLocationViews( {
		reportParams,
		max,
		geoMode,
		countryFilter: selectedCountry?.code,
	} );

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

		return data.map( location => {
			const imageUrl = flagUrl( location.countryCode );

			return {
				id: location.countryCode + '_' + location.label,
				label: (
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
				),
				currentValue: location.value,
				previousValue: 0,
				currentShare: maxValue > 0 ? ( location.value / maxValue ) * 100 : 0,
				previousShare: 0,
				delta: 0,
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
	}, [ data, geoMode ] );

	if ( isLoading ) {
		return (
			<Stack align="center" justify="center" className={ clsx( styles.root, styles.placeholder ) }>
				<Text>{ __( 'Loading locations…', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ clsx( styles.root, styles.placeholder ) }>
				<Text>{ __( 'Could not load location data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( ! data.length ) {
		return (
			<Stack align="center" justify="center" className={ clsx( styles.root, styles.placeholder ) }>
				<Text>
					{ __(
						'Stats on where your visitors are viewing from will appear here.',
						'jetpack-premium-analytics'
					) }
				</Text>
			</Stack>
		);
	}

	return (
		<Stack className={ styles.root }>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className={ styles.widgetHeader }
			>
				<Stack direction="row" align="center" gap="xs" className={ styles.breadcrumb }>
					{ selectedCountry ? (
						<Button
							variant="unstyled"
							onClick={ clearSelectedCountry }
							className={ styles.breadcrumbLink }
						>
							{ __( 'Top Locations', 'jetpack-premium-analytics' ) }
						</Button>
					) : (
						<Text>{ __( 'Top Locations', 'jetpack-premium-analytics' ) }</Text>
					) }
					{ selectedCountry && (
						<>
							<Text className={ styles.breadcrumbSeparator }>/</Text>
							<Text>{ selectedCountry.name }</Text>
						</>
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
			<div className={ styles.content }>
				<div className={ clsx( styles.chartArea, geoMode === 'city' && styles.noMap ) }>
					<LeaderboardChart
						data={ leaderboardData }
						withOverlayLabel
						withComparison={ false }
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
		</Stack>
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
export default function Locations( { attributes }: WidgetRenderProps< LocationsAttributes > ) {
	return (
		<WidgetRoot>
			<LocationsInner attributes={ attributes } />
		</WidgetRoot>
	);
}
