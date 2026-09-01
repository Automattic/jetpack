/**
 * WordPress.com-provided domain suffixes. A site whose primary domain ends in
 * one of these is still on its default address, not a custom domain.
 */
const WPCOM_DEFAULT_DOMAIN_SUFFIXES = [ '.wordpress.com', '.wpcomstaging.com' ];

/**
 * Decide whether a site's primary domain is a real custom domain.
 *
 * The plan-feature flag (`wpcom_site_has_feature( 'custom-domain' )`) reports
 * whether the plan *allows* a custom domain, not whether one is actually mapped,
 * so a site already on a custom domain but on a plan without the feature would
 * otherwise still be shown the "get a domain" upsell. Treating any non-default
 * primary domain as custom closes that gap.
 *
 * @param {string} domain - The site's primary domain (host only, no scheme).
 * @return {boolean} True when the domain is not a WordPress.com default domain.
 */
export function isCustomDomain( domain: string ): boolean {
	if ( ! domain ) {
		return false;
	}

	const host = domain.toLowerCase();

	return ! WPCOM_DEFAULT_DOMAIN_SUFFIXES.some( suffix => host.endsWith( suffix ) );
}
