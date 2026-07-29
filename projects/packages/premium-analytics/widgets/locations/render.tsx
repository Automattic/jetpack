/**
 * External dependencies
 */
import {
	LeaderboardChart,
	LocationsGeoChart,
	ReportLink,
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
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { location as locationIcon } from '@jetpack-premium-analytics/icons';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
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

	const { data, hasComparison, isLoading, isFetching, isError, isPlaceholderData, refetch } =
		useLocationViews( {
			reportParams,
			max,
			geoMode,
			countryFilter: geoMode === 'region' ? activeSelectedCountry?.code : undefined,
		} );
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
						renderGeoMode === 'country' && countryCode
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
	}, [ data, renderGeoMode, hasComparison, selectCountry ] );

	const backLink = renderSelectedCountry ? (
		<WidgetBackLink
			label={ __( 'All Locations', 'jetpack-premium-analytics-pkg' ) }
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
								rows={ data }
								geoMode={ renderGeoMode }
								selectedCountry={ renderSelectedCountry }
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
				<WidgetFooter>
					<ReportLink
						report="locations"
						section={ geoGranularity === 'city' ? 'cities' : 'countries' }
					/>
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
