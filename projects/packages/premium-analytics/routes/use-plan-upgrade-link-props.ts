import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsUpgradeLinkProps } from '@jetpack-premium-analytics/widgets-toolkit';

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
