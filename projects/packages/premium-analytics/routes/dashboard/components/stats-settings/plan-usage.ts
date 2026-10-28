import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsUpgradeLinkProps } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';

/**
 * One cycle reads as a single lapse; two or more escalates the wording, mirroring the Stats
 * "Plan usage" section.
 *
 * @param overLimitMonths - Number of recent billing cycles the site exceeded its limit.
 * @return The warning, or `undefined` when the site stayed within its limit.
 */
export function getOverLimitMessage(
	overLimitMonths: number | null | undefined
): string | undefined {
	if ( ! overLimitMonths ) {
		return undefined;
	}

	if ( overLimitMonths >= 2 ) {
		return __(
			"You've surpassed your limit for two consecutive periods already.",
			'jetpack-premium-analytics-pkg'
		);
	}

	return __( "You've surpassed your limit the past month.", 'jetpack-premium-analytics-pkg' );
}

/**
 * Link props for the Stats tier-upgrade screen, returning to this dashboard after checkout.
 *
 * @param from - Where the purchase started, reported with the upgrade events as `from`.
 * @return The props, or `undefined` where script data is absent (e.g. Storybook without a seeded `window.JetpackScriptData`).
 */
export function usePlanUpgradeLinkProps( from = 'jetpack-premium-analytics' ) {
	const site = getScriptData()?.site;
	const blogId = site?.wpcom?.blog_id;
	const backTo = encodeURIComponent( 'admin.php?page=jetpack-premium-analytics-wp-admin' );
	const wpcomHref = blogId
		? `${ site?.admin_url }admin.php?page=stats#!/stats/purchase/${ blogId }?from=${ from }&productType=commercial&redirect_uri=${ backTo }`
		: undefined;
	const linkProps = useStatsUpgradeLinkProps( from, wpcomHref );

	return site?.admin_url && blogId ? linkProps : undefined;
}
