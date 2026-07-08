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
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
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
type DrillDownCountry = { code: string; name: string };
type RenderLocationState = {
	geoMode: GeoMode;
	selectedCountry?: DrillDownCountry;
};
type GoogleChartsWindow = Window & {
	google?: {
		visualization?: {
			errors?: {
				removeError?: ( errorId: string ) => void;
			};
		};
	};
};

const MISSING_MAP_ERROR_MESSAGE = 'Requested map does not exist';

function getGeoChartCountryId( countryCode: string ): string {
	if ( countryCode.toUpperCase() === 'TW' ) {
		return 'Taiwan';
	}

	return countryCode.toUpperCase();
}

/**
 * Locations widget inner component. Reads report params from WidgetRoot context.
 *
 * @param {LocationsAttributes} attributes - The widget attributes.
 * @return The rendered widget content.
 */
function LocationsInner( { max, geoGranularity }: LocationsAttributes ) {
	const { reportParams } = useWidgetRootContext();
	const [ unsupportedProvinceMapCountries, setUnsupportedProvinceMapCountries ] = useState<
		Set< string >
	>( () => new Set() );

	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< DrillDownCountry >();

	// The "View by" control lives in the widget host header (the
	// `relevance: 'high'` attribute). City mode disables country drill-down.
	useEffect( () => {
		if ( geoGranularity === 'city' ) {
			clearSelectedCountry();
		}
	}, [ clearSelectedCountry, geoGranularity ] );

	const activeSelectedCountry = geoGranularity === 'country' ? selectedCountry : undefined;
	const geoMode: GeoMode =
		geoGranularity === 'country' && activeSelectedCountry ? 'region' : geoGranularity ?? 'country';

	const {
		data,
		comparisonData,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		isPlaceholderData,
	} = useLocationViews( {
		reportParams,
		max: max ?? 10,
		geoMode,
		countryFilter: geoMode === 'region' ? activeSelectedCountry?.code : undefined,
	} );
	const showLoading = isLoading || ( isFetching && hasData );
	const [ renderLocationState, setRenderLocationState ] = useState< RenderLocationState >( {
		geoMode,
		selectedCountry: activeSelectedCountry,
	} );

	useEffect( () => {
		if ( isPlaceholderData ) {
			return;
		}

		setRenderLocationState( { geoMode, selectedCountry: activeSelectedCountry } );
	}, [ activeSelectedCountry, geoMode, isPlaceholderData ] );

	const renderGeoMode = isPlaceholderData ? renderLocationState.geoMode : geoMode;
	const renderSelectedCountry = isPlaceholderData
		? renderLocationState.selectedCountry
		: activeSelectedCountry;
	const selectedCountryCode = renderSelectedCountry?.code.toUpperCase();
	const useProvinceMap =
		renderGeoMode === 'region' &&
		!! selectedCountryCode &&
		! unsupportedProvinceMapCountries.has( selectedCountryCode );
	const useCountryFallbackMap =
		renderGeoMode === 'region' && !! renderSelectedCountry && ! useProvinceMap;
	const fallbackCountry =
		geoMode === 'region' ? activeSelectedCountry ?? renderSelectedCountry : undefined;
	const useSelectedCountryFallbackMap =
		!! fallbackCountry && ( isPlaceholderData || useCountryFallbackMap );
	const useCityCountryMap = renderGeoMode === 'city';
	const cityCountryRows = useMemo( () => {
		const countryRows = new Map< string, { countryFull: string; value: number } >();

		if ( ! useCityCountryMap ) {
			return [];
		}

		data.forEach( location => {
			const countryCode = location.countryCode.toUpperCase();
			const current = countryRows.get( countryCode );
			countryRows.set( countryCode, {
				countryFull: location.countryFull,
				value: ( current?.value ?? 0 ) + location.value,
			} );
		} );

		return Array.from( countryRows.entries() );
	}, [ data, useCityCountryMap ] );
	const handleGeoChartError = useCallback(
		( error: { id?: string; message?: string; detailedMessage?: string } ) => {
			if ( ! selectedCountryCode || ! useProvinceMap ) {
				return;
			}

			const message = `${ error.message ?? '' } ${ error.detailedMessage ?? '' }`;

			if ( ! message.includes( MISSING_MAP_ERROR_MESSAGE ) ) {
				return;
			}

			if ( error.id && typeof window !== 'undefined' ) {
				( window as GoogleChartsWindow ).google?.visualization?.errors?.removeError?.( error.id );
			}

			setUnsupportedProvinceMapCountries( previous => {
				if ( previous.has( selectedCountryCode ) ) {
					return previous;
				}

				const next = new Set( previous );
				next.add( selectedCountryCode );
				return next;
			} );
		},
		[ selectedCountryCode, useProvinceMap ]
	);

	const geoData = useMemo( (): GeoData => {
		const useLocationHeader =
			renderGeoMode === 'region' && ! useCountryFallbackMap && ! useSelectedCountryFallbackMap;
		const header: GoogleDataTableColumn[] = [
			useLocationHeader
				? __( 'Location', 'jetpack-premium-analytics' )
				: __( 'Country', 'jetpack-premium-analytics' ),
			__( 'Views', 'jetpack-premium-analytics' ),
		];

		if ( useSelectedCountryFallbackMap && fallbackCountry ) {
			const countryCode = fallbackCountry.code.toUpperCase();
			const value = data
				.filter( location => location.countryCode.toUpperCase() === countryCode )
				.reduce( ( total, location ) => total + location.value, 0 );

			return [
				header,
				[
					{
						v: getGeoChartCountryId( countryCode ),
						f: fallbackCountry.name,
					},
					value,
				],
			];
		}

		if ( useCityCountryMap ) {
			return [
				header,
				...cityCountryRows.map(
					( [ countryCode, location ] ): GoogleDataTableRow => [
						{
							v: getGeoChartCountryId( countryCode ),
							f: location.countryFull,
						},
						location.value,
					]
				),
			];
		}

		const rows: GoogleDataTableRow[] = data.map( location => [ location.label, location.value ] );
		return [ header, ...rows ];
	}, [
		cityCountryRows,
		data,
		fallbackCountry,
		renderGeoMode,
		useCityCountryMap,
		useCountryFallbackMap,
		useSelectedCountryFallbackMap,
	] );

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
				...( renderGeoMode === 'country' &&
					location.countryCode && {
						onClick: () =>
							selectCountry( {
								code: location.countryCode,
								name: location.countryFull,
							} ),
						// Without ariaLabel the button's accessible name is computed from
						// its children: "Flag of X" (image alt) + "X" (visible label) ->
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
	}, [ comparisonData, data, renderGeoMode, hasComparison, selectCountry ] );

	const backLink = renderSelectedCountry ? (
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
	// back link visible so users can drill back up from an empty region view.
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
						region={
							useProvinceMap && ! useSelectedCountryFallbackMap
								? renderSelectedCountry?.code ?? 'world'
								: 'world'
						}
						resolution={
							useProvinceMap && ! useSelectedCountryFallbackMap ? 'provinces' : 'countries'
						}
						onError={ handleGeoChartError }
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
