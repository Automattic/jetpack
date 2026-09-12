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
import { seen } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TotalViewsAttributes } from './widget';
import type { StatsVisitsParams, StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but the host
// and Storybook may also pass them via `attributes`.
type TotalViewsRenderAttributes = TotalViewsAttributes & Partial< ReportParamsFieldAttributes >;

type TotalViewsWidgetProps = WidgetRenderProps< TotalViewsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

// Fixed, never derived from the dashboard interval: `stats/visits` counts a
// visitor once per bucket, so a coarser bucket undercounts a repeat visitor and a
// longer range could report a smaller total. Views are additive and unaffected,
// but both cards share one unit and one request.
const PERIOD = 'day';

const HEADLINE_FORMAT = { type: 'number' as const, options: { useMultipliers: true } };

/**
 * The period's view total over an area sparkline of the trend.
 *
 * Requests `views,visitors` rather than just `views` so the two total cards share
 * one cache entry and one request.
 */
function TotalViewsMetric() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo< StatsVisitsParams >(
		() => withoutComparison( { ...reportParams, stat_fields: 'views,visitors', period: PERIOD } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	// The sanitizer builds the report summary by summing the returned buckets.
	const total = Number( report?.summary?.views ?? 0 );
	const points = useMemo(
		() =>
			( report?.data ?? [] ).map( row =>
				Number( ( row as Record< string, unknown > ).views ?? 0 )
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
						"We couldn't load your views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: seen,
					description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
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
export default function TotalViewsRender( { attributes = {}, setError }: TotalViewsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TotalViewsMetric />
		</WidgetRoot>
	);
}
