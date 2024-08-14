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

	/**
	 * Use the Jetpack redirect URL to open the checkout page
	 */
	const wpcomCheckoutUrl = new URL( `https://jetpack.com/redirect/` );
	wpcomCheckoutUrl.searchParams.set( 'source', 'jetpack-ai-yearly-tier-upgrade-nudge' );
	wpcomCheckoutUrl.searchParams.set( 'site', getSiteFragment() as string );
	wpcomCheckoutUrl.searchParams.set( 'path', `jetpack_ai_yearly:-q-${ nextTier?.limit }` );

	/**
	 * Open the product interstitial page
	 */
	const jetpackCheckoutUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?redirect_to_referrer=1&page=my-jetpack#/add-jetpack-ai`;

	const nextTierCheckoutURL =
		isAtomicSite() || isSimpleSite() ? wpcomCheckoutUrl.toString() : jetpackCheckoutUrl;

	debug( 'Next tier checkout URL: ', nextTierCheckoutURL );

	return {
		nextTierCheckoutURL,
		hasNextTier: !! nextTier,
	};
};
