import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';

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
