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
	type GeoChartError,
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
// Google GeoChart has no `provinces` map file for some countries (e.g. TW, SG).
// There is no upstream list of them; each is learned at runtime when its
// provinces draw fails, via the GeoChart `onError` callback. This module-level
// cache carries what was learned across widget remounts, so within one page
// load each country pays the failed draw (a brief error flash) at most once.
const runtimeUnsupportedProvinceMapCountries = new Set< string >();

function getGeoChartCountryId( countryCode: string ): string {
	if ( countryCode.toUpperCase() === 'TW' ) {
		return 'Taiwan';
	}

	return countryCode.toUpperCase();
}

type LocationsInnerProps = Required< Pick< LocationsAttributes, 'max' | 'geoGranularity' > >;

/**
 * Locations widget inner component. Reads report params from WidgetRoot
 * context. Attributes arrive already normalized by the outer component, so
 * defaults are applied in exactly one place.
 *
 * @param {LocationsInnerProps} props - The normalized widget attributes.
 * @return The rendered widget content.
 */
function LocationsInner( { max, geoGranularity }: LocationsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const [ unsupportedProvinceMapCountries, setUnsupportedProvinceMapCountries ] = useState<
		Set< string >
	>( () => new Set( runtimeUnsupportedProvinceMapCountries ) );

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
		geoGranularity === 'country' && activeSelectedCountry ? 'region' : geoGranularity;

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
		max,
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
	const fallbackCountry = useCountryFallbackMap ? renderSelectedCountry : undefined;
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
		( error: GeoChartError ) => {
			const message = `${ error.message ?? '' } ${ error.detailedMessage ?? '' }`;
			// Any error during a provinces draw means this country's map is unusable —
			// fall back regardless of the message text, which Google may localize.
			// Stragglers from that failed draw keep arriving after the widget already
			// switched to the fallback map (resize and drill-down layout shifts each
			// redraw), so a selected country already learned as unsupported also
			// qualifies without depending on the message. The English message match
			// stays only as a last resort for errors arriving outside those states.
			const isProvinceDrawError = !! selectedCountryCode && useProvinceMap;
			const isKnownUnsupportedProvinceDraw =
				!! selectedCountryCode && runtimeUnsupportedProvinceMapCountries.has( selectedCountryCode );

			if (
				! isProvinceDrawError &&
				! isKnownUnsupportedProvinceDraw &&
				! message.includes( MISSING_MAP_ERROR_MESSAGE )
			) {
				return;
			}

			// Clear the error element Google injected into the chart container; the
			// fallback redraw replaces the failed map, but the error element would
			// otherwise linger above it.
			if ( error.id && typeof window !== 'undefined' ) {
				( window as GoogleChartsWindow ).google?.visualization?.errors?.removeError?.( error.id );
			}

			if ( ! isProvinceDrawError ) {
				return;
			}

			runtimeUnsupportedProvinceMapCountries.add( selectedCountryCode );
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
		const useLocationHeader = renderGeoMode === 'region' && ! useCountryFallbackMap;
		const header: GoogleDataTableColumn[] = [
			useLocationHeader
				? __( 'Location', 'jetpack-premium-analytics' )
				: __( 'Country', 'jetpack-premium-analytics' ),
			__( 'Views', 'jetpack-premium-analytics' ),
		];

		if ( fallbackCountry ) {
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
						region={ useProvinceMap ? renderSelectedCountry?.code ?? 'world' : 'world' }
						resolution={ useProvinceMap ? 'provinces' : 'countries' }
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
