/**
 * External dependencies
 */
import { useStatsSummary, type StatsSummaryResponse } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Icon, comment, globe, people, seen, starEmpty } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { SiteOverviewAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type SiteOverviewRenderAttributes = SiteOverviewAttributes & Partial< ReportParamsFieldAttributes >;
type SiteOverviewWidgetProps = WidgetRenderProps< SiteOverviewRenderAttributes >;

/**
 * The per-metric visibility flags from widget attributes, with defaults applied.
 */
type SiteOverviewReportProps = Required< SiteOverviewAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

type MetricKey = 'views' | 'visitors' | 'likes' | 'comments';

type Metric = {
	key: MetricKey;
	label: string;
	icon: typeof seen;
	/** Optional caveat about how the total is aggregated, surfaced on hover. */
	note?: string;
};

/**
 * The period metrics shown, in display order. Each key is a numeric field of the
 * summary response, paired with its Stats icon. `summary` totals views/visitors/
 * likes/comments over the period; `followers` is excluded because it is an
 * all-time running total, not a period metric, so it has no meaningful
 * period-over-period comparison.
 */
const METRICS: Metric[] = [
	{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ), icon: seen },
	{
		key: 'visitors',
		label: __( 'Visitors', 'jetpack-premium-analytics' ),
		icon: people,
		// Mirrors the upstream Stats caveat: the endpoint sums each day's
		// visitors, so a returning visitor counts once per day, not once overall.
		note: __(
			'Sum of daily visitors — a returning visitor is counted once per day, not once for the whole period.',
			'jetpack-premium-analytics'
		),
	},
	{ key: 'likes', label: __( 'Likes', 'jetpack-premium-analytics' ), icon: starEmpty },
	{ key: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ), icon: comment },
];

/**
 * Fetches the period summary through the designated `useStatsSummary` Stats hook
 * and renders views, visitors, likes, and comments as metric tiles. The date
 * range and comparison period come from the dashboard picker via `reportParams`.
 *
 * When a comparison period is requested and returns data, each tile shows its
 * period-over-period change; the comparison total is looked up per metric so a
 * primary metric is never paired with a fabricated previous value. Which tiles
 * appear is controlled by the per-metric visibility attributes.
 *
 * @param {SiteOverviewReportProps} props - The component props.
 * @return The widget content.
 */
function SiteOverviewReport( {
	showViews,
	showVisitors,
	showLikes,
	showComments,
}: SiteOverviewReportProps ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsSummary( reportParams );

	const summary = primary.data as StatsSummaryResponse | undefined;
	const comparisonSummary = comparison.data as StatsSummaryResponse | undefined;

	// Only wire comparison values when the comparison period actually returned a
	// summary; otherwise the tiles render as bare current-period totals rather
	// than showing a delta derived from missing data.
	const previousByMetric = useMemo( () => {
		const map = new Map< keyof StatsSummaryResponse, number >();
		if ( hasComparison && comparisonSummary ) {
			for ( const metric of METRICS ) {
				map.set( metric.key, comparisonSummary[ metric.key ] );
			}
		}
		return map;
	}, [ hasComparison, comparisonSummary ] );

	// Drop tiles the user has toggled off in the widget settings, keeping the
	// declared display order.
	const enabledByKey: Record< MetricKey, boolean > = {
		views: showViews,
		visitors: showVisitors,
		likes: showLikes,
		comments: showComments,
	};
	const visibleMetrics = METRICS.filter( metric => enabledByKey[ metric.key ] );

	// Not a data state: the user has toggled every tile off in the widget
	// settings, so it stays outside `WidgetState` and shows in every fetch state.
	if ( visibleMetrics.length === 0 ) {
		return (
			<div className={ styles.root }>
				<div className={ styles.state }>
					<Text>
						{ __( 'Select at least one metric to display.', 'jetpack-premium-analytics' ) }
					</Text>
				</div>
			</div>
		);
	}

	// The summary endpoint resolves to a flat totals object even for an idle
	// period, so "empty" is every visible metric at zero, not a missing payload.
	const isEmpty = ! summary || visibleMetrics.every( metric => summary[ metric.key ] === 0 );

	return (
		<div className={ styles.root }>
			<WidgetState
				// `isPending` covers the query being disabled before a date resolves;
				// once a period's totals are on screen a date-range change refetches in
				// the background and the busy overlay layers over the stale tiles.
				isLoading={ ( isLoading || primary.isPending ) && ! summary }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load the site overview. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: globe,
					description: __( 'No stats recorded for this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<div className={ styles.grid }>
					{ visibleMetrics.map( metric => {
						const value = summary?.[ metric.key ] ?? 0;
						return (
							<div key={ metric.key } className={ styles.tile }>
								<div className={ styles.tileHeader } title={ metric.note }>
									<Icon className={ styles.tileIcon } icon={ metric.icon } size={ 24 } />
									<Text className={ styles.tileLabel }>{ metric.label }</Text>
								</div>
								{ /* The tile shows a shortened count (e.g. 18K); the hover title
								     carries the exact total, as the upstream Stats tooltip does. */ }
								<div className={ styles.tileValue } title={ value.toLocaleString() }>
									<MetricWithComparison
										value={ value }
										previousValue={ previousByMetric.get( metric.key ) }
										dataFormat={ COUNT_FORMAT }
										fontSize="xl"
									/>
								</div>
							</div>
						);
					} ) }
				</div>
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner report — resolved from the dashboard date range
 * and comparison state via context, the same way the other Stats widgets read
 * them.
 *
 * @param {SiteOverviewWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SiteOverview( { attributes = {} }: SiteOverviewWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SiteOverviewReport
				showViews={ attributes.showViews ?? true }
				showVisitors={ attributes.showVisitors ?? true }
				showLikes={ attributes.showLikes ?? true }
				showComments={ attributes.showComments ?? true }
			/>
		</WidgetRoot>
	);
}
