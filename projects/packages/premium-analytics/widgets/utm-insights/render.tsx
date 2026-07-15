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
	WidgetRoot,
	WidgetState,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { megaphone } from '@jetpack-premium-analytics/icons';
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

	const { data, hasComparison, isLoading, isFetching, isError, refetch } = useUtmInsights( {
		reportParams,
		utmParam: utmDimension,
		max,
	} );

	const selectedUtm = useMemo(
		() => data.find( item => item.label === selectedUtmLabel ) ?? null,
		[ data, selectedUtmLabel ]
	);
	const isDrillDown = !! selectedUtm?.children?.length;
	const activeData = useMemo(
		() => ( isDrillDown ? selectedUtm?.children ?? [] : data ),
		[ data, isDrillDown, selectedUtm ]
	);
	const withComparison = isDrillDown ? !! selectedUtm?.childrenHaveComparison : hasComparison;

	// The view already falls back to the top list when the selected row is
	// missing or no longer drillable (no children); clear the stored selection
	// too once data has settled without a drillable match, so stale state
	// can't resurface on a later refetch (WOOA7S-1666). In-flight fetches keep
	// placeholder rows and errors aren't settled data, so a valid selection
	// survives refetches and transient failures.
	useEffect( () => {
		if ( selectedUtmLabel && ! isDrillDown && ! isLoading && ! isFetching && ! isError ) {
			clearSelectedUtm();
		}
	}, [ selectedUtmLabel, isDrillDown, isLoading, isFetching, isError, clearSelectedUtm ] );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...activeData.map( d => d.value ), 1 );
		const maxPreviousValue = Math.max( ...activeData.map( d => d.previousValue ?? 0 ), 1 );

		return activeData.map( ( item, index ) => {
			const previousValue = item.previousValue;

			return {
				id: `${ index }-${ item.label }`,
				label: (
					<Stack align="center" className={ styles.itemLabel }>
						<Text className={ styles.itemLabelText }>{ item.label }</Text>
					</Stack>
				),
				currentValue: item.value,
				currentShare: ( item.value / maxValue ) * 100,
				previousValue,
				previousShare:
					withComparison && previousValue !== undefined
						? ( previousValue / maxPreviousValue ) * 100
						: undefined,
				delta:
					withComparison && previousValue !== undefined
						? calculateDelta( item.value, previousValue )
						: undefined,
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
			};
		} );
	}, [ activeData, isDrillDown, selectUtmLabel, withComparison ] );

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All UTM Insights', 'jetpack-premium-analytics' ) }
			ariaLabel={ __( 'View all UTM insights', 'jetpack-premium-analytics' ) }
			onClick={ clearSelectedUtm }
			className={ styles.backLink }
		/>
	) : null;

	return (
		<>
			{ backLink }
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load UTM data. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: megaphone,
						description: __( 'No UTM data in this period.', 'jetpack-premium-analytics' ),
					} }
				>
					<LeaderboardChart
						data={ leaderboardData }
						withComparison={ withComparison }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
					/>
				</WidgetState>
			</div>
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
