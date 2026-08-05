/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@jetpack-premium-analytics/externals';
import {
	calculateDelta,
	describeError,
	getCombinedPeriodMax,
	LeaderboardChart,
	LeaderboardPostLabel,
	ReportLink,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	sharePercentage,
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

type UtmReportSection =
	| 'source-medium'
	| 'campaign-source-medium'
	| 'source'
	| 'medium'
	| 'campaign';

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
	/**
	 * Whether to render the "See report" footer link.
	 */
	showReportLink: boolean;
};

/** Map a widget dimension to a section supported by the UTM report. */
function getUtmReportSection( utmDimension: StatsUtmParam ): UtmReportSection {
	switch ( utmDimension ) {
		case 'utm_source,utm_medium':
			return 'source-medium';
		case 'utm_campaign,utm_source,utm_medium':
			return 'campaign-source-medium';
		case 'utm_source':
			return 'source';
		case 'utm_medium':
			return 'medium';
		case 'utm_campaign':
			return 'campaign';
	}
}

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param {UtmInsightsInnerProps} props - The component props.
 * @return The rendered leaderboard or state placeholder.
 */
function UtmInsightsInner( { utmDimension, max, showReportLink }: UtmInsightsInnerProps ) {
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

	const { data, hasComparison, isLoading, isFetching, isError, error, refetch } = useUtmInsights( {
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
		const maxValue = getCombinedPeriodMax(
			activeData.map( item => item.value ),
			withComparison ? activeData.map( item => item.previousValue ) : []
		);

		return activeData.map( ( item, index ) => {
			const previousValue = item.previousValue;
			const postRow = 'postId' in item ? item : null;

			return {
				id: `${ index }-${ item.label }`,
				label: postRow ? (
					<LeaderboardPostLabel
						id={ postRow.postId }
						label={ postRow.label }
						link={ postRow.href }
						variant="overlay"
						className={ styles.itemLabelInset }
					/>
				) : (
					<span className={ styles.itemLabel }>
						<Text className={ styles.itemLabelText }>{ item.label }</Text>
					</span>
				),
				currentValue: item.value,
				currentShare: sharePercentage( item.value, maxValue ),
				previousValue,
				previousShare:
					withComparison && previousValue !== undefined
						? sharePercentage( previousValue, maxValue )
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
							__( 'View posts for %s', 'jetpack-premium-analytics-pkg' ),
							item.label
						),
					} ),
			};
		} );
	}, [ activeData, isDrillDown, selectUtmLabel, withComparison ] );

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All UTM Insights', 'jetpack-premium-analytics-pkg' ) }
			ariaLabel={ __( 'View all UTM insights', 'jetpack-premium-analytics-pkg' ) }
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
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load UTM data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						icon: megaphone,
						description: __( 'No UTM data in this period.', 'jetpack-premium-analytics-pkg' ),
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
			{ showReportLink && (
				<WidgetFooter>
					<ReportLink report="utm" section={ getUtmReportSection( utmDimension ) } />
				</WidgetFooter>
			) }
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
	const showReportLink = attributes.showReportLink ?? true;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<UtmInsightsInner
					utmDimension={ utmDimension }
					max={ max }
					showReportLink={ showReportLink }
				/>
			</div>
		</WidgetRoot>
	);
}
