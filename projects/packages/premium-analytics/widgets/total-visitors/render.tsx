/**
 * External dependencies
 */
import { useStatsVisits, withoutComparison } from '@jetpack-premium-analytics/data';
import { Text } from '@jetpack-premium-analytics/externals';
import {
	AbbreviatedValue,
	describeError,
	MetricSparklineSkeleton,
	Sparkline,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TotalVisitorsAttributes } from './widget';
import type { StatsVisitsParams, StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but the host
// and Storybook may also pass them via `attributes`.
type TotalVisitorsRenderAttributes = TotalVisitorsAttributes &
	Partial< ReportParamsFieldAttributes >;

type TotalVisitorsWidgetProps = WidgetRenderProps< TotalVisitorsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

// Fixed, never derived from the dashboard interval: `stats/visits` counts
// visitors unique-within-bucket, so a coarser bucket silently shrinks the
// summed headline (a daily visitor counts 30 times across 30 daily buckets but
// only 13 across 13 weekly ones). Views are additive and unaffected.
const PERIOD = 'day';

const HEADLINE_FORMAT = { type: 'number' as const, options: { useMultipliers: true } };

/**
 * The period's visitor total over an area sparkline of the trend.
 *
 * Requests `views,visitors` rather than just `visitors` so the two total cards share
 * one cache entry and one request.
 */
function TotalVisitorsMetric() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo< StatsVisitsParams >(
		() => withoutComparison( { ...reportParams, stat_fields: 'views,visitors', period: PERIOD } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	// The sanitizer builds the report summary by summing the returned buckets.
	const total = Number( report?.summary?.visitors ?? 0 );
	const points = useMemo(
		() =>
			( report?.data ?? [] ).map( row =>
				Number( ( row as Record< string, unknown > ).visitors ?? 0 )
			),
		[ report ]
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the prior rows on a transient refetch failure,
				// so only surface the error when there is nothing left to show.
				isError={ isError && points.length === 0 }
				isEmpty={ points.length === 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load your visitors. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: people,
					description: __( 'No visitors in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <MetricSparklineSkeleton /> }
			>
				<div className={ styles.body }>
					{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
					    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
					<Text variant="heading-2xl">
						<AbbreviatedValue value={ total } dataFormat={ HEADLINE_FORMAT } />
					</Text>
					<div className={ styles.chart }>
						{ /* `withResponsive` caps width at 1200px by default, stranding space on a
						    wider card. */ }
						<Sparkline data={ points } maxWidth={ Infinity } />
					</div>
				</div>
			</WidgetState>
		</div>
	);
}

/**
 * WidgetRoot provides the query client, chart theme, and resolved report params.
 */
export default function TotalVisitorsRender( {
	attributes = {},
	setError,
}: TotalVisitorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TotalVisitorsMetric />
		</WidgetRoot>
	);
}
