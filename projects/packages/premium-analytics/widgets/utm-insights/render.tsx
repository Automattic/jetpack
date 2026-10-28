/**
 * External dependencies
 */
import { search } from '@jetpack-premium-analytics/icons';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	WIDGET_ROW_LIMIT,
	calculateDelta,
	describeError,
	getCombinedPeriodMax,
	LeaderboardChart,
	LeaderboardSkeleton,
	LeaderboardPostLabel,
	WidgetBackLink,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	resolveLeaderboardRowAction,
	sharePercentage,
	useWidgetDrillDown,
	useReportActions,
	useWidgetRootContext,
	getUtmDimensionLabel,
	getUtmReportSection,
	utmCsvExporters,
	UtmUrlBuilderDialog,
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
	 * Whether to render the footer: View all and Download CSV.
	 */
	showReportLink: boolean;
};

function UtmInsightsInner( { utmDimension, showReportLink }: UtmInsightsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const [ isBuilderOpen, setBuilderOpen ] = useState( false );
	const openBuilder = useCallback( () => setBuilderOpen( true ), [] );
	const closeBuilder = useCallback( () => setBuilderOpen( false ), [] );
	const reportSection = getUtmReportSection( utmDimension );
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
		max: WIDGET_ROW_LIMIT,
	} );

	const selectedUtm = useMemo(
		() => data.find( item => item.label === selectedUtmLabel ) ?? null,
		[ data, selectedUtmLabel ]
	);
	const isDrillDown = !! selectedUtm?.children?.length;
	const activeData = useMemo(
		() => ( isDrillDown ? ( selectedUtm?.children ?? [] ) : data ),
		[ data, isDrillDown, selectedUtm ]
	);
	const withComparison = isDrillDown ? !! selectedUtm?.childrenHaveComparison : hasComparison;

	// Clear the stored selection only once data has settled without a drillable
	// match, so it can't resurface on a later refetch (WOOA7S-1666) and a valid
	// selection survives in-flight fetches and transient failures.
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
			const hasChildren = ! isDrillDown && 'children' in item && Boolean( item.children?.length );

			return {
				id: `${ index }-${ item.label }`,
				...( postRow
					? {
							label: (
								<LeaderboardPostLabel
									id={ postRow.postId }
									label={ postRow.label }
									link={ postRow.href }
									origin={ {
										report: 'utm',
										section: reportSection,
									} }
								/>
							),
						}
					: buildLeaderboardRow( {
							label: item.label,
							media: { kind: 'none' },
							action: resolveLeaderboardRowAction( {
								hasChildren,
								drillDown: {
									onClick: () => selectUtmLabel( item.label ),
									ariaLabel: sprintf(
										/* translators: %s is the UTM value label. */
										__( 'View posts for %s', 'jetpack-premium-analytics-pkg' ),
										item.label
									),
								},
							} ),
						} ) ),
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
			};
		} );
	}, [ activeData, isDrillDown, reportSection, selectUtmLabel, withComparison ] );

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All UTM insights', 'jetpack-premium-analytics-pkg' ) }
			ariaLabel={ __( 'View all UTM insights', 'jetpack-premium-analytics-pkg' ) }
			onClick={ clearSelectedUtm }
			className={ styles.backLink }
		/>
	) : null;
	const offersFooterBuildUrl = isError || data.length > 0;
	useReportActions( {
		...( showReportLink && {
			report: 'utm',
			section: reportSection,
			csv: {
				exporter: utmCsvExporters[ reportSection ],
				status: { isLoading, isFetching, isError },
				rowCount: data.length,
			},
		} ),
		actions: offersFooterBuildUrl
			? [
					{
						id: 'build-url',
						label: __( 'Build URL', 'jetpack-premium-analytics-pkg' ),
						relevance: 'medium',
						callback: openBuilder,
					},
				]
			: [],
	} );

	return (
		<>
			{ backLink }
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					empty={ {
						icon: search,
						description: __(
							'You don’t have UTM visits for this period. Build a URL to start tracking a campaign.',
							'jetpack-premium-analytics-pkg'
						),
						action: {
							label: __( 'Build URL', 'jetpack-premium-analytics-pkg' ),
							onClick: openBuilder,
						},
					} }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load UTM data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<LeaderboardChart
						chartTitle={ __( 'Top UTM', 'jetpack-premium-analytics-pkg' ) }
						data={ leaderboardData }
						withComparison={ withComparison }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ DATA_FORMAT }
						columns={ {
							label: isDrillDown
								? __( 'Posts', 'jetpack-premium-analytics-pkg' )
								: getUtmDimensionLabel( reportSection ),
							metric: 'views',
						} }
					/>
				</WidgetState>
			</div>
			{ isBuilderOpen && <UtmUrlBuilderDialog onClose={ closeBuilder } /> }
		</>
	);
}

/**
 * Traffic breakdown by UTM parameter as a ranked leaderboard. The active
 * dimension (source/medium, campaign, etc.) is the `utmDimension` attribute
 * (`relevance: 'high'`), exposed as a control by the widget host.
 */
export default function UtmInsightsWidget( { attributes = {} }: UtmInsightsWidgetProps ) {
	const utmDimension = attributes.utmDimension ?? DEFAULT_UTM_DIMENSION;
	const showReportLink = attributes.showReportLink ?? true;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<UtmInsightsInner utmDimension={ utmDimension } showReportLink={ showReportLink } />
			</div>
		</WidgetRoot>
	);
}
