/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	calculateDelta,
	LeaderboardChart,
	WidgetBackLink,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useUtmInsights from './use-utm-insights';
import { type UtmInsightsAttributes } from './widget';
/**
 * Types
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type UtmInsightsRenderAttributes = UtmInsightsAttributes & Partial< ReportParamsFieldAttributes >;
type UtmInsightsWidgetProps = WidgetRenderProps< UtmInsightsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEFAULT_UTM_DIMENSION: StatsUtmParam = 'utm_source,utm_medium';

type UtmInsightsInnerProps = {
	/**
	 * Active UTM dimension.
	 */
	utmDimension: StatsUtmParam;
	/**
	 * Max rows to display.
	 */
	max: number;
};

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param {UtmInsightsInnerProps} props - The component props.
 * @return The rendered leaderboard or state placeholder.
 */
function UtmInsightsInner( { utmDimension, max }: UtmInsightsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const {
		drillDownItem: selectedUtmLabel,
		drillDown: selectUtmLabel,
		resetDrillDown: clearSelectedUtm,
	} = useWidgetDrillDown< string >();

	// The "UTM parameter" control lives in the widget host header (the
	// `relevance: 'high'` attribute); changing it resets any drill-down.
	useEffect( () => {
		clearSelectedUtm();
	}, [ clearSelectedUtm, utmDimension ] );

	const { data, hasComparison, isLoading, isFetching, hasData, isError } = useUtmInsights( {
		reportParams,
		utmParam: utmDimension,
		max,
	} );

	const showLoading = isLoading || ( isFetching && hasData );
	const selectedUtm = useMemo(
		() => data.find( item => item.label === selectedUtmLabel ) ?? null,
		[ data, selectedUtmLabel ]
	);
	const isDrillDown = !! selectedUtm?.children?.length;
	const activeData = useMemo(
		() => ( isDrillDown ? selectedUtm?.children ?? [] : data ),
		[ data, isDrillDown, selectedUtm ]
	);

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...activeData.map( d => d.value ), 1 );
		const maxPreviousValue = Math.max( ...activeData.map( d => d.previousValue ), 1 );

		return activeData.map( ( item, index ) => ( {
			id: `${ index }-${ item.label }`,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text className={ styles.itemLabelText }>{ item.label }</Text>
				</Stack>
			),
			currentValue: item.value,
			currentShare: ( item.value / maxValue ) * 100,
			previousValue: item.previousValue,
			previousShare:
				hasComparison && item.previousValue > 0
					? ( item.previousValue / maxPreviousValue ) * 100
					: 0,
			delta: hasComparison ? calculateDelta( item.value, item.previousValue ) : 0,
			...( ! isDrillDown &&
				'children' in item &&
				item.children?.length && {
					onClick: () => selectUtmLabel( item.label ),
					ariaLabel: sprintf(
						/* translators: %s is the UTM value label. */
						__( 'View posts for %s', 'jetpack-premium-analytics' ),
						item.label
					),
				} ),
		} ) );
	}, [ activeData, hasComparison, isDrillDown, selectUtmLabel ] );

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All UTM Insights', 'jetpack-premium-analytics' ) }
			ariaLabel={ __( 'View all UTM insights', 'jetpack-premium-analytics' ) }
			onClick={ clearSelectedUtm }
			className={ styles.backLink }
		/>
	) : null;

	if ( isError ) {
		return (
			<>
				{ backLink }
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>{ __( 'Could not load UTM data.', 'jetpack-premium-analytics' ) }</Text>
				</Stack>
			</>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<>
				{ backLink }
				<WidgetLoadingOverlay />
			</>
		);
	}

	return (
		<>
			{ backLink }
			<LeaderboardChart
				data={ leaderboardData }
				loading={ showLoading }
				withComparison={ hasComparison }
				withOverlayLabel
				showLegend={ false }
				emptyStateText={ __( 'No UTM data in this period.', 'jetpack-premium-analytics' ) }
				dataFormat={ DATA_FORMAT }
				className={ styles.leaderboard }
			/>
		</>
	);
}

/**
 * UTM Insights widget render component.
 *
 * Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active
 * dimension (source/medium, campaign, etc.) is the `utmDimension` attribute
 * (`relevance: 'high'`), exposed as a control by the widget host.
 *
 * @param {UtmInsightsWidgetProps} props - The widget render props.
 * @return The rendered widget content.
 */
export default function UtmInsightsWidget( { attributes = {} }: UtmInsightsWidgetProps ) {
	const utmDimension = attributes.utmDimension ?? DEFAULT_UTM_DIMENSION;
	const max = attributes.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<UtmInsightsInner utmDimension={ utmDimension } max={ max } />
			</div>
		</WidgetRoot>
	);
}
