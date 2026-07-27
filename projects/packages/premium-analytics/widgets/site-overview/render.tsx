/**
 * External dependencies
 */
import { useStatsSummary, type StatsSummaryResponse } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { comment, globe, people, seen, starEmpty } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	DEFAULT_SITE_OVERVIEW_METRICS,
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
	views: { icon: seen, value: summary => summary.views },
	visitors: {
		icon: people,
		value: summary => summary.visitors,
		// Mirrors the upstream Stats caveat: the endpoint sums each day's
		// visitors, so a returning visitor counts once per day, not once overall.
		note: __(
			'Sum of daily visitors — a returning visitor is counted once per day, not once for the whole period.',
			'jetpack-premium-analytics'
		),
	},
	likes: { icon: starEmpty, value: summary => summary.likes },
	comments: { icon: comment, value: summary => summary.comments },
};

/**
 * Fetches the period summary through the designated `useStatsSummary` Stats hook
 * and renders views, visitors, likes, and comments as metric tiles. The date
 * range and comparison period come from the dashboard picker via `reportParams`.
 *
 * When a comparison period is requested and returns data, each tile shows its
 * period-over-period change; the comparison total is looked up per metric so a
 * primary metric is never paired with a fabricated previous value. Which tiles
 * appear is controlled by the `metrics` attribute.
 *
 * @param props           - The component props.
 * @param props.metricIds - The selected metric tile ids; missing means every metric.
 * @return The widget content.
 */
function SiteOverviewReport( {
	metricIds = DEFAULT_SITE_OVERVIEW_METRICS,
}: {
	metricIds?: SiteOverviewMetricId[];
} ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsSummary( reportParams );

	const summary = primary.data as StatsSummaryResponse | undefined;
	const comparisonSummary = comparison.data as StatsSummaryResponse | undefined;

	// Resolve the selected ids against the canonical definitions so the tile
	// order stays stable regardless of the order the ids were toggled in.
	const visibleMetrics = useMemo( () => {
		const selected = new Set( metricIds );
		return SITE_OVERVIEW_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metricIds ] );

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

	const tiles = visibleMetrics.map( ( { id, label } ) => {
		const { icon, note, value: metricValue } = TILE_CONFIG[ id ];
		const value = summary ? metricValue( summary ) : 0;
		return {
			key: id,
			icon,
			label,
			value,
			// Only pair a comparison value when the comparison period actually
			// returned a summary; a `null` (never `undefined`) keeps every tile in
			// the fixed-size comparison layout — no fabricated delta, and one value
			// size instead of MetricTileGrid's responsive `.value` clamp — so tiles
			// stay consistently sized with or without comparison data.
			previousValue: hasComparison && comparisonSummary ? metricValue( comparisonSummary ) : null,
			note,
			// The tile shows a shortened count (e.g. 18K); the hover title carries
			// the exact total, as the upstream Stats tooltip does.
			valueTitle: formatMetricValue( value, 'number', { decimals: 0 } ),
		};
	} );

	return (
		<div className={ styles.root }>
			<WidgetState
				// `isPending` covers the query being disabled before a date resolves;
				// once a period's totals are on screen a date-range change refetches in
				// the background and the busy overlay layers over the stale tiles.
				isLoading={ ( isLoading || primary.isPending ) && ! summary }
				isFetching={ isFetching }
				// As with `isLoading` above: the stale totals stay on screen through a
				// transient refetch failure, so only surface the error when there is
				// nothing to show.
				isError={ ! summary && isError }
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
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
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
			<SiteOverviewReport metricIds={ attributes.metrics } />
		</WidgetRoot>
	);
}
