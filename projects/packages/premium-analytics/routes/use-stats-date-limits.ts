/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	getLockedFeature,
	getStatsDatePolicy,
	isDateLimitedPolicy,
	OPEN_DATE_POLICY,
	type DateLimits,
	type DateLimitUpsellCopy,
	type StatsFeatureKey,
} from '@jetpack-premium-analytics/data';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { useSiteDay } from './use-site-day';

/**
 * The date limits a Stats surface declares in its report scope.
 *
 * @param isLimited - Whether the surface follows the plan's date limits.
 * @return The limits, and whether the surface may still offer a comparison.
 */
export function useStatsDateLimits( isLimited: boolean ): {
	dateLimits?: DateLimits;
	offersComparison: boolean;
} {
	const trackEvent = useTrackEvent();
	const siteDay = useSiteDay();

	return useMemo( () => {
		// The policy's date window follows the site's day, so a new day recomputes it.
		void siteDay;
		const policy = isLimited ? getStatsDatePolicy() : OPEN_DATE_POLICY;
		if ( ! isDateLimitedPolicy( policy ) ) {
			return { offersComparison: true };
		}

		const upsellFor = ( feature: StatsFeatureKey ): DateLimitUpsellCopy | undefined => {
			const locked = getLockedFeature( feature );

			return (
				locked && {
					description: locked.description,
					supportUrl: locked.support_url,
					upgradeUrl: locked.upgrade_url,
					onUpgradeClick: () =>
						trackEvent( 'jetpack_premium_analytics_plan_upgrade_click', {
							feature,
							source: 'locked_date_control',
						} ),
				}
			);
		};

		return {
			offersComparison: policy.offersComparison,
			dateLimits: {
				lockedPresetIds: policy.lockedPresetIds,
				earliestDate: policy.earliestDate,
				lockedIntervals: policy.lockedIntervals,
				upsell: policy.feature && upsellFor( policy.feature ),
				intervalUpsell: upsellFor( 'intervals' ),
			},
		};
	}, [ isLimited, trackEvent, siteDay ] );
}
