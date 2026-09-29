/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsAppPlanUsage } from '@jetpack-premium-analytics/data';
import { Text } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './plan-usage-meter.module.scss';

export type PlanUsageMeterProps = {
	/** The plan's billable views limit for the cycle. */
	limit: number;
	usage?: number;
	daysToReset?: number;
};

/**
 * One cycle reads as a single lapse; two or more escalates the wording, mirroring the Stats
 * "Plan usage" section. Expects `overLimitMonths >= 1`.
 *
 * @param overLimitMonths - Number of recent billing cycles the site exceeded its limit.
 * @return The warning.
 */
export function getOverLimitMessage( overLimitMonths: number ): string {
	if ( overLimitMonths >= 2 ) {
		return __(
			"You've surpassed your limit for two consecutive periods already.",
			'jetpack-premium-analytics-pkg'
		);
	}

	return __( "You've surpassed your limit the past month.", 'jetpack-premium-analytics-pkg' );
}

/**
 * The Stats tier-upgrade purchase screen for this site, the same flow the Stats "Plan usage"
 * section links to, returning to this dashboard after checkout.
 *
 * @return The URL, or `undefined` where script data is absent (e.g. Storybook without a seeded `window.JetpackScriptData`).
 */
export function getPlanUpgradeUrl(): string | undefined {
	const site = getScriptData()?.site;
	const blogId = site?.wpcom?.blog_id;
	if ( ! site?.admin_url || ! blogId ) {
		return undefined;
	}

	const backTo = encodeURIComponent( 'admin.php?page=jetpack-premium-analytics-wp-admin' );
	return `${ site.admin_url }admin.php?page=stats#!/stats/purchase/${ blogId }?from=jetpack-premium-analytics&productType=commercial&redirect_uri=${ backTo }`;
}

/**
 * The site's plan usage for the current billing cycle.
 *
 * @return The query state, the limit when there is one to meter against, and the over-limit count to warn about.
 */
export function usePlanUsage() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsAppPlanUsage();

	// Legacy plans and no plan report a null limit, and a zero limit gives nothing to meter against either.
	const limit =
		typeof data?.views_limit === 'number' && data.views_limit > 0 ? data.views_limit : null;

	// VIP sites aren't held to the billable-views limit, so the Stats "Plan usage" section never
	// warns them. The script data carries the same host guess Calypso derives `isVip` from.
	const isVip = getScriptData()?.site?.host === 'vip';

	return {
		data,
		isLoading,
		isFetching,
		isError,
		refetch,
		limit,
		overLimitMonths: isVip ? null : ( data?.over_limit_months ?? null ),
	};
}

/**
 * The usage meter, after the configurations design (WOOA7S-2055): the figures above a bar filled
 * in the brand color, proportional to usage / limit.
 *
 * @param props             - Component props.
 * @param props.limit       - The plan's billable views limit for the cycle.
 * @param props.usage       - The billable views counted so far this cycle.
 * @param props.daysToReset - Days until the cycle restarts.
 * @return The meter.
 */
export function PlanUsageMeter( { limit, usage, daysToReset }: PlanUsageMeterProps ) {
	const usageValue = usage ?? 0;

	return (
		<div className={ styles.meter }>
			<div className={ styles.figures }>
				<Text className={ styles.count }>
					{ sprintf(
						/* translators: 1: views used in the current cycle, 2: the plan's views limit. */
						__( '%1$s / %2$s views', 'jetpack-premium-analytics-pkg' ),
						formatMetricValue( usageValue, 'number', { decimals: 0 } ),
						formatMetricValue( limit, 'number', { decimals: 0 } )
					) }
				</Text>
				{ daysToReset !== undefined && (
					<Text className={ styles.reset }>
						{ sprintf(
							/* translators: %d: number of days until the billing cycle resets. */
							_n(
								'Restarts in %d day',
								'Restarts in %d days',
								daysToReset,
								'jetpack-premium-analytics-pkg'
							),
							daysToReset
						) }
					</Text>
				) }
			</div>
			<progress
				className={ clsx( styles.bar, usageValue >= limit && styles.isOverLimit ) }
				value={ Math.min( usageValue, limit ) }
				max={ limit }
				aria-label={ __( 'Plan usage', 'jetpack-premium-analytics-pkg' ) }
			/>
		</div>
	);
}
