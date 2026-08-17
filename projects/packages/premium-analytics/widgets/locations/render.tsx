/**
 * External dependencies
 */
import {
	GeoChart,
	GoogleDataTableColumnRoleType,
	LeaderboardChart,
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
	type GeoChartError,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { location as locationIcon } from '@jetpack-premium-analytics/icons';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
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
type CountrySummary = {
	countryFull: string;
	value: number;
	locations: LocationView[];
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

function getGeoChartCountryId( countryCode: string ): string {
	if ( countryCode.toUpperCase() === 'TW' ) {
		return 'Taiwan';
	}

	return countryCode.toUpperCase();
}

// A GeoChart tooltip is a single cell, so the rolled-up locations share one HTML
// string. The list is capped to keep a tooltip from overflowing the map.
const MAX_TOOLTIP_LOCATIONS = 10;

function buildCountryTooltip( country: CountrySummary ): string {
	const listed = country.locations.slice( 0, MAX_TOOLTIP_LOCATIONS );
	const lines = listed.map(
		location => `${ location.label }: ${ formatMetricValue( location.value ) }`
	);
	const remaining = country.locations.length - listed.length;

	if ( remaining > 0 ) {
		lines.push(
			sprintf(
				/* translators: %d is the number of locations left out of the tooltip list. */
				_n(
					'…and %d more location',
					'…and %d more locations',
					remaining,
					'jetpack-premium-analytics-pkg'
				),
				remaining
			)
		);
	}

	return lines.join( '<br />' );
}

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
	const [ unsupportedProvinceMapCountries, setUnsupportedProvinceMapCountries ] = useState<
		Set< string >
	>( () => new Set( runtimeUnsupportedProvinceMapCountries ) );

	const {
		drillDownItem: selectedCountry,
		drillDown: selectCountry,
		resetDrillDown: clearSelectedCountry,
	} = useWidgetDrillDown< DrillDownCountry >();

	// The "View by" control lives in the widget host header (the
	// `relevance: 'high'` attribute). Only Countries mode drills down, so leaving
	// the other modes would strand a selected country the user can't clear.
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

	const selectedCountryCode = activeSelectedCountry?.code.toUpperCase();
	const useProvinceMap =
		geoMode === 'region' &&
		!! selectedCountryCode &&
		! unsupportedProvinceMapCountries.has( selectedCountryCode );
	const useCountryFallbackMap =
		geoMode === 'region' && !! activeSelectedCountry && ! useProvinceMap;
	const fallbackCountry = useCountryFallbackMap ? activeSelectedCountry : undefined;
	// Cities, and Regions outside a country drill-down, span the whole world.
	// Google GeoChart can't place either row type on the world map, so both are
	// summed back up to their country.
	const useCountrySummaryMap =
		geoMode === 'city' || ( geoMode === 'region' && ! activeSelectedCountry );
	const countrySummaryRows = useMemo( () => {
		const countryRows = new Map< string, CountrySummary >();

		if ( ! useCountrySummaryMap ) {
			return [];
		}

		data.forEach( location => {
			const countryCode = location.countryCode.toUpperCase();
			const current = countryRows.get( countryCode );
			countryRows.set( countryCode, {
				countryFull: location.countryFull,
				value: ( current?.value ?? 0 ) + location.value,
				locations: [ ...( current?.locations ?? [] ), location ],
			} );
		} );

		return Array.from( countryRows.entries() );
	}, [ data, useCountrySummaryMap ] );
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
		// Only the provinces map plots sub-country rows; every other map is
		// country-scoped, whatever the leaderboard beside it lists.
		const header: GoogleDataTableColumn[] = [
			useProvinceMap
				? __( 'Location', 'jetpack-premium-analytics-pkg' )
				: __( 'Country', 'jetpack-premium-analytics-pkg' ),
			__( 'Views', 'jetpack-premium-analytics-pkg' ),
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

		if ( useCountrySummaryMap ) {
			// A summed country no longer names the regions behind its value, so it
			// carries them in a tooltip. Cities keep GeoChart's default tooltip.
			const withTooltips = geoMode === 'region';
			const summaryHeader: GoogleDataTableColumn[] = withTooltips
				? [
						...header,
						{
							type: 'string',
							role: GoogleDataTableColumnRoleType.tooltip,
							p: { html: true },
						},
				  ]
				: header;

			return [
				summaryHeader,
				...countrySummaryRows.map( ( [ countryCode, country ] ): GoogleDataTableRow => {
					const row: GoogleDataTableRow = [
						{
							v: getGeoChartCountryId( countryCode ),
							f: country.countryFull,
						},
						country.value,
					];

					return withTooltips ? [ ...row, buildCountryTooltip( country ) ] : row;
				} ),
			];
		}

		const rows: GoogleDataTableRow[] = data.map( location => [ location.label, location.value ] );
		return [ header, ...rows ];
	}, [ countrySummaryRows, data, fallbackCountry, geoMode, useCountrySummaryMap, useProvinceMap ] );

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
							<GeoChart
								data={ geoData }
								resizeDebounceTime={ 100 }
								region={ useProvinceMap ? activeSelectedCountry?.code ?? 'world' : 'world' }
								resolution={ useProvinceMap ? 'provinces' : 'countries' }
								onError={ handleGeoChartError }
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
	// Attributes are persisted, so a stale layout can carry a granularity this
	// widget no longer knows. Normalize once, before it becomes both the endpoint
	// path segment and the report tab.
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
