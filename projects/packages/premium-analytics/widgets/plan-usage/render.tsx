/**
 * External dependencies
 */
import { useStatsAppPlanUsage } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	SemiCircleChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useSegmentStyles,
	type ReportParamsFieldAttributes,
	type SemiCircleChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n, sprintf } from '@wordpress/i18n';
import { percent } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { PlanUsageAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the usage
// endpoint ignores them (it reports the current billing cycle, with no date
// range or comparison period), but WidgetRoot still expects them on
// `attributes`.
type PlanUsageRenderAttributes = PlanUsageAttributes & Partial< ReportParamsFieldAttributes >;
type PlanUsageWidgetProps = WidgetRenderProps< PlanUsageRenderAttributes >;

type PlanUsageGaugeProps = {
	/**
	 * The plan's billable views limit for the cycle. `null` for legacy or
	 * unplanned sites (no limit to gauge against); `undefined` while loading.
	 */
	limit?: number | null;
	/**
	 * Billable views used so far in the current cycle.
	 */
	usage?: number;
	/**
	 * Days remaining until the current cycle resets.
	 */
	daysToReset?: number;
	/**
	 * Number of recent cycles the site has exceeded its limit.
	 */
	overLimitMonths?: number | null;
	/**
	 * When `true`, the report is still being fetched.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, the report failed to load.
	 */
	isError?: boolean;
};

/**
 * The over-limit warning shown when the site has exceeded its limit in recent
 * cycles. One cycle reads as a single lapse; two or more escalates the wording,
 * mirroring the Stats "Plan usage" section.
 *
 * @param overLimitMonths - Number of recent cycles over the limit (>= 1).
 * @return The translated warning text.
 */
function overLimitMessage( overLimitMonths: number ): string {
	if ( overLimitMonths >= 2 ) {
		return __(
			"You've surpassed your limit for two consecutive periods already.",
			'jetpack-premium-analytics'
		);
	}

	return __( "You've surpassed your limit the past month.", 'jetpack-premium-analytics' );
}

/**
 * Presentational gauge for the "Plan usage" widget. Renders billable views used
 * against the plan's cycle limit as a semi-circle gauge, with the exact figures
 * and the days-until-reset below it. Takes already-fetched values via props and
 * owns the loading, error, unavailable, and populated states.
 *
 * @param {PlanUsageGaugeProps} props - The component props.
 * @return The rendered gauge.
 */
function PlanUsageGauge( {
	limit,
	usage,
	daysToReset,
	overLimitMonths,
	isLoading = false,
	isError = false,
}: PlanUsageGaugeProps ) {
	const usageValue = usage ?? 0;
	const limitValue = limit ?? 0;
	const remaining = Math.max( limitValue - usageValue, 0 );

	// Two segments: views used, then the headroom left in the cycle. The gauge
	// fill is therefore proportional to usage / limit.
	const chartData: SemiCircleChartData = useMemo(
		() => [
			{ label: __( 'Billable views used', 'jetpack-premium-analytics' ), value: usageValue },
			{ label: __( 'Remaining', 'jetpack-premium-analytics' ), value: remaining },
		],
		[ usageValue, remaining ]
	);
	const segmentStyles = useSegmentStyles( chartData );

	if ( isError ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load plan usage.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	// No data yet — show the overlay only before the first response arrives.
	if ( isLoading && limit === undefined ) {
		return <WidgetLoadingOverlay />;
	}

	// Sites on legacy plans or no plan report a null limit; there is nothing to
	// gauge against, so surface an unavailable state instead of an empty gauge.
	if ( limit === undefined || limit === null ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( "Plan usage isn't available for your current plan.", 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	return (
		<Stack
			className={ styles.root }
			direction="column"
			align="center"
			justify="safe center"
			gap="md"
		>
			<SemiCircleChart
				chartData={ chartData }
				value={ usageValue }
				styles={ segmentStyles }
				showLegend={ false }
				emptyStateIcon={ percent }
				emptyStateText={ __( 'No billable views yet.', 'jetpack-premium-analytics' ) }
				dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
			/>
			<Stack className={ styles.captions } direction="column" align="center" gap="xs">
				<Text className={ styles.usage }>
					{ sprintf(
						/* translators: 1: billable views used, 2: the plan's billable views limit. */
						__( '%1$s / %2$s billable views', 'jetpack-premium-analytics' ),
						formatMetricValue( usageValue, 'number', { decimals: 0 } ),
						formatMetricValue( limitValue, 'number', { decimals: 0 } )
					) }
				</Text>
				{ daysToReset !== undefined && (
					<Text className={ styles.caption }>
						{ sprintf(
							/* translators: %d: number of days until the billing cycle resets. */
							_n(
								'Restarts in %d day',
								'Restarts in %d days',
								daysToReset,
								'jetpack-premium-analytics'
							),
							daysToReset
						) }
					</Text>
				) }
				{ overLimitMonths ? (
					<Text className={ styles.warning }>{ overLimitMessage( overLimitMonths ) }</Text>
				) : null }
			</Stack>
		</Stack>
	);
}

/**
 * Fetches the plan-usage report through the `useStatsAppPlanUsage` hook and
 * hands the current-cycle figures to the presentational gauge. The endpoint is
 * a point-in-time reading of the connected plan, so it takes no report params.
 *
 * @return The widget content.
 */
function PlanUsageReport() {
	const { data, isLoading, isError } = useStatsAppPlanUsage();

	return (
		<PlanUsageGauge
			limit={ data ? data.views_limit : undefined }
			usage={ data?.current_usage?.views_count }
			daysToReset={ data?.current_usage?.days_to_reset }
			overLimitMonths={ data?.over_limit_months }
			isLoading={ isLoading }
			isError={ isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * Passes host attributes into `WidgetRoot` for the widget contract and to
 * provide the query client and chart theme the inner gauge needs. The usage
 * report takes no parameters, so the inner component reads nothing from
 * `attributes`.
 *
 * @param {PlanUsageWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PlanUsage( { attributes = {} }: PlanUsageWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PlanUsageReport />
		</WidgetRoot>
	);
}
