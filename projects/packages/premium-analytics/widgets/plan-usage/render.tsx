/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsAppPlanUsage } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	WidgetLoadingOverlay,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
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

type PlanUsageBarProps = {
	/**
	 * The plan's billable views limit for the cycle. `null` for legacy or
	 * unplanned sites (no limit to meter against); `undefined` while loading.
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
	 * When `true`, a loading overlay is layered over the bar while data
	 * refetches in the background (stale figures stay visible underneath).
	 */
	isRefetching?: boolean;
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
 * The Stats tier-upgrade purchase screen for this site — the same flow the
 * Stats "Plan usage" section links to — returning to this dashboard after
 * checkout. `undefined` where script data is absent (e.g. Storybook without a
 * seeded `window.JetpackScriptData`).
 *
 * @return The purchase screen URL.
 */
function upgradeUrl(): string | undefined {
	const site = getScriptData()?.site;
	const blogId = site?.wpcom?.blog_id;
	if ( ! site?.admin_url || ! blogId ) {
		return undefined;
	}

	const backTo = encodeURIComponent( 'admin.php?page=jetpack-premium-analytics-wp-admin' );
	return `${ site.admin_url }admin.php?page=stats#!/stats/purchase/${ blogId }?from=jetpack-premium-analytics&productType=commercial&redirect_uri=${ backTo }`;
}

/**
 * Presentational bar for the "Plan usage" widget, following the Stats "Plan
 * usage" section: a horizontal meter filled proportionally to the billable
 * views used against the plan's cycle limit, the figures and days-until-reset
 * inside the bar, and the upgrade note (with the over-limit warning when
 * applicable) below it. Takes already-fetched values via props and owns the
 * loading, error, unavailable, and populated states.
 *
 * @param {PlanUsageBarProps} props - The component props.
 * @return The rendered bar.
 */
function PlanUsageBar( {
	limit,
	usage,
	daysToReset,
	overLimitMonths,
	isLoading = false,
	isRefetching = false,
	isError = false,
}: PlanUsageBarProps ) {
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
	// meter against, so surface an unavailable state instead of an empty bar.
	if ( limit === undefined || limit === null ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( "Plan usage isn't available for your current plan.", 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	const usageValue = usage ?? 0;
	const isOverLimit = usageValue >= limit;

	return (
		<div className={ styles.container }>
			<Stack
				className={ styles.root }
				direction="column"
				align="stretch"
				justify="safe center"
				gap="md"
			>
				<div className={ clsx( styles.progress, isOverLimit && styles.isOverLimit ) }>
					{ /* The fill is value-driven, so the dynamic width needs no inline style. */ }
					<progress
						className={ styles.progressMeter }
						value={ Math.min( usageValue, limit ) }
						max={ limit }
						aria-label={ __( 'Plan usage', 'jetpack-premium-analytics' ) }
					/>
					<Text className={ styles.progressLabel } variant="body-sm">
						{ sprintf(
							/* translators: 1: billable views used, 2: the plan's billable views limit. */
							__( '%1$s / %2$s views', 'jetpack-premium-analytics' ),
							formatMetricValue( usageValue, 'number', { decimals: 0 } ),
							formatMetricValue( limit, 'number', { decimals: 0 } )
						) }
					</Text>
					{ daysToReset !== undefined && (
						<Text className={ styles.progressLabel } variant="body-sm">
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
				</div>
				<Text className={ styles.note } variant="body-sm">
					{ overLimitMonths ? (
						<>
							<strong>{ overLimitMessage( overLimitMonths ) }</strong>{ ' ' }
						</>
					) : null }
					{ createInterpolateElement(
						__(
							'Do you want to increase your views limit? <a>Upgrade now</a>',
							'jetpack-premium-analytics'
						),
						{ a: <Link href={ upgradeUrl() } /> }
					) }
				</Text>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</div>
	);
}

/**
 * Fetches the plan-usage report through the `useStatsAppPlanUsage` hook and
 * hands the current-cycle figures to the presentational bar. The endpoint is
 * a point-in-time reading of the connected plan, so it takes no report params.
 *
 * @return The widget content.
 */
function PlanUsageReport() {
	const { data, isLoading, isFetching, isError } = useStatsAppPlanUsage();

	// Keep the stale bar visible and layer the overlay when a background
	// refetch runs after the first response has arrived.
	const hasData = data !== undefined;
	const isRefetching = isFetching && hasData;

	return (
		<PlanUsageBar
			limit={ data ? data.views_limit : undefined }
			usage={ data?.current_usage?.views_count }
			daysToReset={ data?.current_usage?.days_to_reset }
			overLimitMonths={ data?.over_limit_months }
			isLoading={ isLoading }
			isRefetching={ isRefetching }
			isError={ isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * Passes host attributes into `WidgetRoot` for the widget contract and to
 * provide the query client the inner bar needs. The usage report takes no
 * parameters, so the inner component reads nothing from `attributes`.
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
