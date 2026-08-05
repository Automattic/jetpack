/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { Text } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	defaultPeriodForInterval,
	describeError,
	Sparkline,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
	withoutComparison,
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

// Finest to coarsest, as `defaultPeriodForInterval` requires. Same set as
// `traffic-chart`, so both land on the same period and share its query.
const PERIODS = [ 'day', 'week', 'month' ] as const;

// `decimals: 0` would round 291,900 to "292K"; the prototype's headline keeps
// the digit ("291.9k" / "1.2M").
const HEADLINE_OPTIONS = { useMultipliers: true, decimals: 1 };

/**
 * The period's visitor total over an area sparkline of the trend.
 *
 * Requests `views,visitors` rather than just `visitors`: that is the pair
 * `traffic-chart` fetches, so a board carrying those cards resolves to one cache
 * entry and one request.
 *
 * @return The widget content.
 */
function TotalVisitorsReport() {
	const { reportParams } = useWidgetRootContext();
	const period = defaultPeriodForInterval( reportParams.interval, PERIODS );

	const params = useMemo< StatsVisitsParams >(
		() => withoutComparison( { ...reportParams, stat_fields: 'views,visitors', period } ),
		[ reportParams, period ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	// The headline is the report summary's total, never a sum of the buckets.
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
			>
				<div className={ styles.body }>
					{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
					    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
					<Text
						variant="heading-2xl"
						title={ formatMetricValue( total, 'number', { decimals: 0 } ) }
					>
						{ formatMetricValue( total, 'number', HEADLINE_OPTIONS ) }
					</Text>
					<div className={ styles.chart }>
						{ /* `withResponsive` caps width at 1200px by default, stranding space on a
						    wider card. */ }
						<Sparkline data={ points } withGradientFill maxWidth={ Infinity } />
					</div>
				</div>
			</WidgetState>
		</div>
	);
}

/**
 * Total visitors widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params.
 *
 * @param {TotalVisitorsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TotalVisitorsRender( {
	attributes = {},
	setError,
}: TotalVisitorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TotalVisitorsReport />
		</WidgetRoot>
	);
}
