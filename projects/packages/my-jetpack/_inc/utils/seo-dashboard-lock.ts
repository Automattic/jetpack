import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { select } from '@wordpress/data';

const SEO_MODULES = [ 'seo-tools', 'sitemaps', 'canonical-urls', 'verification-tools' ];

/**
 * Prototype: whether a module is paused because the SEO dashboard is switched off.
 *
 * @param slug - The module slug.
 * @return True for an SEO module while the `seo-dashboard` module exists and is off.
 */
export function isLockedBySeoDashboard( slug: string ): boolean {
	if ( ! SEO_MODULES.includes( slug ) ) {
		return false;
	}

	const modules = select( modulesStore );
	const dashboard = modules.hasFinishedResolution( 'getJetpackModules' )
		? modules.getJetpackModules()?.[ 'seo-dashboard' ]
		: undefined;

	return dashboard?.activated === false;
}
