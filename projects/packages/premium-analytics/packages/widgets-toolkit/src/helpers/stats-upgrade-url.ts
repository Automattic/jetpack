/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * The Stats tier-upgrade purchase screen for this site, returning to this
 * dashboard after checkout. `undefined` where script data is absent (e.g.
 * Storybook without a seeded `window.JetpackScriptData`).
 *
 * @param from - Where the purchase started, reported to the checkout as `from`.
 * @return The purchase URL, or `undefined`.
 */
export function statsUpgradeUrl( from: string ): string | undefined {
	const site = getScriptData()?.site;
	const blogId = site?.wpcom?.blog_id;
	if ( ! site?.admin_url || ! blogId ) {
		return undefined;
	}

	const backTo = encodeURIComponent( 'admin.php?page=jetpack-premium-analytics-wp-admin' );
	return `${ site.admin_url }admin.php?page=stats#!/stats/purchase/${ blogId }?from=${ encodeURIComponent(
		from
	) }&productType=commercial&redirect_uri=${ backTo }`;
}
