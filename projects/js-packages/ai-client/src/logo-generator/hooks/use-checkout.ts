/**
 * External dependencies
 */
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store/index.ts';
/**
 * Types
 */
import type { Selectors } from '../store/types.ts';

export const useCheckout = () => {
	const { nextTier, tierPlansEnabled } = useSelect( select => {
		const selectors: Selectors = select( STORE_NAME );
		return {
			nextTier: selectors.getAiAssistantFeature().nextTier,
			tierPlansEnabled: selectors.getAiAssistantFeature().tierPlansEnabled,
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
	checkoutUrl.searchParams.set(
		'path',
		tierPlansEnabled ? `jetpack_ai_yearly:-q-${ nextTier?.limit }` : 'jetpack_ai_yearly'
	);

	// For Jetpack sites, the redirect_to parameter is handled by the Jetpack redirect source
	if ( ! isJetpackSite ) {
		checkoutUrl.searchParams.set(
			'query',
			`redirect_to=${ encodeURIComponent( wpcomRedirectToURL ) }`
		);
	}

	const nextTierCheckoutURL = checkoutUrl.toString();

	return {
		nextTierCheckoutURL,
		hasNextTier: !! nextTier,
	};
};
