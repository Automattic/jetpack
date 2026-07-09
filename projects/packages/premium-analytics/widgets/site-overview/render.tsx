/**
 * External dependencies
 */
import { useStatsSummary, type StatsSummaryResponse } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
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
import { Text, VisuallyHidden } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	SITE_OVERVIEW_METRICS,
	type SiteOverviewAttributes,
	type SiteOverviewMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type SiteOverviewRenderAttributes = SiteOverviewAttributes & Partial< ReportParamsFieldAttributes >;
type SiteOverviewWidgetProps = WidgetRenderProps< SiteOverviewRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Render-only config per metric: the tile icon, the summary-response field the
 * tile displays, and an optional aggregation caveat. Ids and labels are shared
 * with the settings checkboxes via `SITE_OVERVIEW_METRICS` in `widget.ts`.
 *
 * Each metric reads a numeric field of the `summary` response, which totals
 * views/visitors/likes/comments over the period; `followers` is excluded
 * because it is an all-time running total, not a period metric, so it has no
 * meaningful period-over-period comparison.
 */
const TILE_CONFIG: Record<
	SiteOverviewMetricId,
	{
		icon: typeof seen;
		value: ( summary: StatsSummaryResponse ) => number;
		/**
		 * Optional caveat about how the total is aggregated, surfaced on hover
		 * and as visually hidden text for assistive technology.
		 */
		note?: string;
	}
> = {
	showViews: { icon: seen, value: summary => summary.views },
	showVisitors: {
		icon: people,
		value: summary => summary.visitors,
		// Mirrors the upstream Stats caveat: the endpoint sums each day's
		// visitors, so a returning visitor counts once per day, not once overall.
		note: __(
			'Sum of daily visitors — a returning visitor is counted once per day, not once for the whole period.',
			'jetpack-premium-analytics'
		),
	},
	showLikes: { icon: starEmpty, value: summary => summary.likes },
	showComments: { icon: comment, value: summary => summary.comments },
};

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
 * @param props            - The component props.
 * @param props.attributes - The per-metric visibility flags; a missing flag means enabled.
 * @return The widget content.
 */
function SiteOverviewReport( { attributes }: { attributes: SiteOverviewAttributes } ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsSummary( reportParams );

	const summary = primary.data as StatsSummaryResponse | undefined;
	const comparisonSummary = comparison.data as StatsSummaryResponse | undefined;

	// Drop tiles the user has toggled off in the widget settings, keeping the
	// declared display order. A missing flag means enabled, matching the
	// `getValue` defaults on the widget definition.
	const visibleMetrics = SITE_OVERVIEW_METRICS.filter( ( { id } ) => attributes[ id ] ?? true );

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
	const isEmpty =
		! summary || visibleMetrics.every( ( { id } ) => TILE_CONFIG[ id ].value( summary ) === 0 );

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
					{ visibleMetrics.map( ( { id, label } ) => {
						const { icon, note, value: metricValue } = TILE_CONFIG[ id ];
						const value = summary ? metricValue( summary ) : 0;
						return (
							<div key={ id } className={ styles.tile }>
								<div className={ styles.tileHeader } title={ note }>
									<Icon className={ styles.tileIcon } icon={ icon } size={ 24 } />
									<Text className={ styles.tileLabel }>{ label }</Text>
									{ /* The `title` tooltip is invisible to keyboard and screen-reader
									     users, so the caveat is repeated as visually hidden text. */ }
									{ note && <VisuallyHidden>{ note }</VisuallyHidden> }
								</div>
								{ /* The tile shows a shortened count (e.g. 18K); the hover title
								     carries the exact total, as the upstream Stats tooltip does.
								     Both go through the package formatter so they agree on locale. */ }
								<div
									className={ styles.tileValue }
									title={ formatMetricValue( value, 'number', { decimals: 0 } ) }
								>
									<MetricWithComparison
										value={ value }
										// Only wire a comparison value when the comparison period
										// actually returned a summary; otherwise the tile renders as a
										// bare current-period total rather than showing a delta
										// derived from missing data.
										previousValue={
											hasComparison && comparisonSummary
												? metricValue( comparisonSummary )
												: undefined
										}
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
			<SiteOverviewReport attributes={ attributes } />
		</WidgetRoot>
	);
}
