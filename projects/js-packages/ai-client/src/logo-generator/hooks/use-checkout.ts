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
	const { nextTier, tierPlansEnabled } = useSelect( select => {
		const selectors: Selectors = select( STORE_NAME );
		return {
			nextTier: selectors.getAiAssistantFeature().nextTier,
			tierPlansEnabled: selectors.getAiAssistantFeature().tierPlansEnabled,
		};
	}, [] );

	/**
	 * Determine the post-checkout URL
	 */
	const siteFragment = getSiteFragment() as string;
	const redirectToURL =
		isAtomicSite() || isSimpleSite()
			? `https://wordpress.com/home/${ siteFragment }`
			: `admin.php?page=my-jetpack#/jetpack-ai`;

	/**
	 * Use the Jetpack redirect URL to open the checkout page
	 */
	const checkoutUrl = new URL( `https://jetpack.com/redirect/` );
	checkoutUrl.searchParams.set( 'source', 'jetpack-ai-yearly-tier-upgrade-nudge' );
	checkoutUrl.searchParams.set( 'site', siteFragment );
	checkoutUrl.searchParams.set(
		'path',
		tierPlansEnabled ? `jetpack_ai_yearly:-q-${ nextTier?.limit }` : 'jetpack_ai_yearly'
	);
	checkoutUrl.searchParams.set( 'query', `redirect_to=${ encodeURIComponent( redirectToURL ) }` );
	const nextTierCheckoutURL = checkoutUrl.toString();

	debug( 'Next tier checkout URL: ', nextTierCheckoutURL );

	return {
		nextTierCheckoutURL,
		hasNextTier: !! nextTier,
	};
};
