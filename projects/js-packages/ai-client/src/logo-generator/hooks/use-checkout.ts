/**
 * External dependencies
 */
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store/index.js';
/**
 * Types
 */
import type { Selectors } from '../store/types.js';

const debug = debugFactory( 'ai-client:logo-generator:use-checkout' );

export const useCheckout = () => {
	const { nextTier } = useSelect( select => {
		const selectors: Selectors = select( STORE_NAME );
		return {
			nextTier: selectors.getAiAssistantFeature().nextTier,
		};
	}, [] );

	const isJetpackSite = ! isAtomicSite() && ! isSimpleSite();
	const redirectSource = isJetpackSite
		? 'jetpack-ai-upgrade-url-for-jetpack-sites'
		: 'jetpack-ai-yearly-tier-upgrade-nudge';

	/**
	 * Determine the post-checkout URL for non-Jetpack sites
	 */
	const siteFragment = getSiteFragment() as string;
	const wpcomRedirectToURL = `https://wordpress.com/home/${ siteFragment }`;

	/**
	 * Use the Jetpack redirect URL to open the checkout page
	 */
	const checkoutUrl = new URL( `https://jetpack.com/redirect/` );
	checkoutUrl.searchParams.set( 'source', redirectSource );
	checkoutUrl.searchParams.set( 'site', siteFragment );
	checkoutUrl.searchParams.set( 'path', 'jetpack_ai_yearly' );

	// For Jetpack sites, the redirect_to parameter is handled by the Jetpack redirect source
	if ( ! isJetpackSite ) {
		checkoutUrl.searchParams.set(
			'query',
			`redirect_to=${ encodeURIComponent( wpcomRedirectToURL ) }`
		);
	}

	const nextTierCheckoutURL = checkoutUrl.toString();

	debug( 'Next tier checkout URL: ', nextTierCheckoutURL );

	return {
		nextTierCheckoutURL,
		hasNextTier: !! nextTier,
	};
};
