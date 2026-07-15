/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsAppPlanUsage } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { percent } from '@wordpress/icons';
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
	 * The plan's billable views limit for the cycle. Loading, error, and
	 * no-limit states are handled by `WidgetState` before the bar renders.
	 */
	limit: number;
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
 * applicable) below it when a purchase URL or warning is available. Renders
 * the populated state only — `WidgetState` owns loading, error, and
 * unavailable.
 *
 * @param {PlanUsageBarProps} props - The component props.
 * @return The rendered bar.
 */
function PlanUsageBar( { limit, usage, daysToReset, overLimitMonths }: PlanUsageBarProps ) {
	const usageValue = usage ?? 0;
	const isOverLimit = usageValue >= limit;
	const upgradeHref = upgradeUrl();

	return (
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
						/* translators: 1: views used in the current cycle, 2: the plan's views limit. */
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
			{ ( !! overLimitMonths || upgradeHref ) && (
				<Text className={ styles.note } variant="body-sm">
					{ overLimitMonths ? (
						<>
							<strong>{ overLimitMessage( overLimitMonths ) }</strong>{ ' ' }
						</>
					) : null }
					{ /* Without script data there is no purchase URL, and a Link with no
					     href renders styled but non-actionable — omit the sentence. */ }
					{ upgradeHref &&
						createInterpolateElement(
							__(
								'Do you want to increase your views limit? <a>Upgrade now</a>',
								'jetpack-premium-analytics'
							),
							{ a: <Link href={ upgradeHref } /> }
						) }
				</Text>
			) }
		</Stack>
	);
}

/**
 * Fetches the plan-usage report through the `useStatsAppPlanUsage` hook and
 * hands the current-cycle figures to the presentational bar through
 * `WidgetState`, which owns the loading, error, and unavailable states. The
 * endpoint is a point-in-time reading of the connected plan, so it takes no
 * report params.
 *
 * @return The widget content.
 */
function PlanUsageReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsAppPlanUsage();

	// Sites on legacy plans or no plan report a null limit, and a zero limit
	// gives nothing to meter against either; both render the unavailable
	// message instead of an empty (or degenerate `max={0}`) bar.
	const limit = data?.views_limit;
	const hasLimit = typeof limit === 'number' && limit > 0;

	// VIP sites aren't held to the billable-views limit, so the Stats "Plan
	// usage" section suppresses the over-limit warning for them. The dashboard's
	// script data carries the same host guess Calypso derives `isVip` from.
	const isVip = getScriptData()?.site?.host === 'vip';

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The query keeps prior data via `placeholderData`, so a transient refetch
			// failure keeps the usage bar visible; only surface the error when there is
			// nothing to show.
			isError={ ! data && isError }
			isEmpty={ ! hasLimit }
			error={ {
				description: __(
					"We couldn't load plan usage. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: percent,
				description: __(
					"Plan usage isn't available for your current plan.",
					'jetpack-premium-analytics'
				),
			} }
		>
			{ hasLimit && (
				<PlanUsageBar
					limit={ limit }
					usage={ data?.current_usage?.views_count }
					daysToReset={ data?.current_usage?.days_to_reset }
					overLimitMonths={ isVip ? null : data?.over_limit_months }
				/>
			) }
		</WidgetState>
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
